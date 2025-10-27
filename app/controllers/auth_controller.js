const notificationService = require("../services/sendNotification");
const resetStore = require("../services/resetTokenStore");
const db = require("../models");
const config = require("../config/auth_config");

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Op } = require("sequelize");

const UserAccount = db.UserAccount;
const PortAccount = db.PortAccount;
const Agent = db.Agent;
const Company = db.Company;
//const UserNotification = db.UserNotification;
//const PortNotification = db.PortNotification;

// User Registration - For UserAccount
exports.registerUser = async (req, res) => {
    try {
        const {
            account_email,
            account_password,
            account_type, // 0 = agent, 1 = company
            agent_fullname,
            id_type,
            id_no,
            contact_no,
            address,
            state,
            postcode,
            city,
            company_name,
            registration_no,
            sst_no,
            attc_registration
        } = req.body;

        // Basic validation - Need Email, Password and Acc Type
        if (!account_email || !account_password || account_type === undefined) {
            return res.status(400).send({ message: "Email, password, and account type are required." });
        }

        // Most of the input validation is in middleware/verifyInput

        // Agent-specific validation
        if (account_type === 0) {
            if (!agent_fullname || id_type === undefined || !id_no
                || !contact_no || !address || !state || !postcode || !city) {
                return res.status(400).send({ message: "All agent fields are required." });
            }
        }

        // Company-specific validation
        if (account_type === 1) {
            if (!company_name || !registration_no || !sst_no || !contact_no
                || !address || !state || !postcode || !city || !attc_registration) {
                return res.status(400).send({ message: "All company fields are required." });
            }
        }

        const hashedPassword = bcrypt.hashSync(account_password, 8); //hash password
        let user; // For create user

        // Conditional creation - Agent
        if (account_type === 0) {
            // Create user account
            user = await UserAccount.create({
                account_email,
                account_password: hashedPassword,
                account_type,
                account_status: 0 // pending
            });

            await Agent.create({
                user_account_id: user.user_account_id,
                agent_fullname,
                id_type, // 0 = ID card, 1 = Passport
                id_no,
                contact_no,
                address,
                state,
                postcode,
                city
            });
        } else { // Conditional creation - Company
            // Create user account
            user = await UserAccount.create({
                account_email,
                account_password: hashedPassword,
                account_type,
                account_status: 0 // pending
            });

            await Company.create({
                user_account_id: user.user_account_id,
                company_name,
                registration_no,
                sst_no,
                contact_no,
                address,
                state,
                postcode,
                city,
                attc_registration
            });
        }

        // Create notifications - Keep aside first
        //const now = new Date();
        //const desc = `New ${account_type === 0 ? "agent" : "company"} registration submitted.`;

        // await UserNotification.create({
        //     user_account_id: user.user_account_id,
        //     un_created_at: now,
        //     un_desc: "Your registration has been submitted and is pending approval.",
        //     un_status: 0
        // });

        // Keep aside first
        // await PortNotification.create({
        //     pn_created_at: now,
        //     pn_desc: desc,
        //     pn_status: 0
        // });

        // Send email and WhatsApp
        await notificationService.sendEmail(account_email,
            "Registration Submitted",
            "Your registration is pending approval.",
            null);
        // await notificationService.sendWhatsApp(contact_no,
        //     "Your registration has been submitted, waiting for approval");  //Keep aside first

        return res.status(201).send({ message: "Registration successful. Awaiting approval." });
    } catch (err) {
        return res.status(500).send({ message: "Registration failed.", error: err.message });
    }
};

// Login - PortAccount
exports.signinPort = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        let account;
        let token;
        let response;

        // Can use username or email
        account = await PortAccount.findOne({
            where: {
                [Op.or]: [
                    { port_account_username: identifier },
                    { port_account_email: identifier }
                ]
            }
        });

        // PortAccount found
        if(account){
            const passwordIsValid = bcrypt.compareSync(password, account.port_account_password);

            // If password is not valid
            if (!passwordIsValid) {
                return res.status(401).send({ message: "Invalid Password!" });
            }

            // Determine token type based on role
            const tokenType = account.port_account_role === 3 ? "superadmin" : "port";

            // Get ID and generate token with type
            token = jwt.sign({ id: account.port_account_id, type: tokenType }, config.secret, {
                algorithm: 'HS256',
                allowInsecureKeySizes: true,
                expiresIn: 86400 // 24 hours
            });

            req.session.token = token; // Store token in session - JWT is Session based

            // Build response
            response = {
                id: account.port_account_id,
                username: account.port_account_username,
                email: account.port_account_email,
                role: account.port_account_role //,
                //token: token  //If want to check token
            };

            return res.status(200).send(response);
        } else {
            return res.status(404).send({ message: "Account not found." });
        }
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

// Login - UserAccount
exports.signinUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        let account;
        let token;
        let response;

        account = await UserAccount.findOne({
            where: { account_email: email }
        });

        // If not found at all, return error
        if (!account) {
            return res.status(404).send({ message: "Account not found." });
        }

        if(account.account_status !== 1){
            if (account.account_status === 0) { // Check if account is pending
                return res.status(403).send({
                    message: "Your registration is still pending approval by the port officer." });
            } else if (account.account_status === 2) { // If account is rejected
                return res.status(403).send({
                    message: "Your registration is rejected by the port officer." });
            } else { // If account is deleted
                return res.status(403).send({
                    message: "Your registration is deleted by the port officer." });
            }
        }

        const passwordIsValid = bcrypt.compareSync(password, account.account_password);

        // If password is not valid
        if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid Password!" });
        }

        // Get ID and generate token with type
        token = jwt.sign({ id: account.user_account_id, type: "user"}, config.secret, {
            algorithm: 'HS256',
            allowInsecureKeySizes: true,
            expiresIn: 86400
        });

        req.session.token = token;  // Store token in session - JWT is Session based

        // Build response
        response = {
            id: account.user_account_id,
            email: account.account_email,
            account_type: account.account_type, // 0 = agent, 1 = company
            // token: token  //If want to check token
        };

        return res.status(200).send(response);
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

// Logout - Both PortAccount and UserAccount
exports.signout = async (req, res) => {
    try {
        // Log email based on account type - testing purpose
        // const email =
        //     req.user?.account_email || req.user?.port_account_email || "Unknown email";

        // console.log("Account signed out:", email);

        req.session = null;
        return res.status(200).send({ message: "You've been signed out!" });
    } catch (err) {
        res.status(500).send({ message: "Error during signout.", error: err.message });
    }
};

// Request password reset - Both PortAccount and UserAccount
exports.requestReset = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email and format
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).send({
                message: !email
                    ? "No email request reset password."
                    : "Invalid email format."
            });
        }

        // If email exists - Find PortAccount first
        let emailAccount = await PortAccount.findOne({ where: { port_account_email: email } });
        let account_type;

        if (emailAccount) {
            account_type = "port";
        } else {
            // Try UserAccount if PortAccount not found
            emailAccount = await UserAccount.findOne({ where: { account_email: email } });

            // Not found at all
            if (!emailAccount) {
                return res.status(404).send({ message: "Email not found." });
            }

            account_type = "user";
        }

        // Generate Token and store
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
        resetStore.set(token, { email, account_type, expiry });

        const resetLink = `http://localhost:8080/api/auth/reset-password/${token}`;

        // Send notification to Email
        await notificationService.sendEmail(
            email,
            "Password Reset",
            `Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.`,
            null
        );

        res.send({ message: "Reset link sent to your email." });
    } catch (err) {
        console.error("Error in requestReset:", err);
        res.status(500).send({ message: "Failed to process password reset request.", error: err.message });
    }
};

// Reset password - Both PortAccount and UserAccount
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // Validate password and length
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).send({
                message: !newPassword
                    ? "Password is required."
                    : "Password must be at least 6 characters long."
            });
        }

        const entry = resetStore.get(token);

        const email = entry?.email;
        const account_type = entry?.account_type;
        //const contact_no = entry?.contact_no; //For WhatsApp, current not use

        // Validate token
        if (!entry || entry.expiry < Date.now()) {
            await notificationService.sendEmail(email,
                "Password Reset Attempt Failed",
                "Your password reset link was invalid or expired.",
                null);
            // await notificationService.sendWhatsApp(contact_no,
            //     "Password reset failed: invalid or expired link.");   //Keep aside first
            return res.status(400).send({ message: "Invalid or expired token." });
        }

        let account; //For finding an account

        if (account_type === "port") {
            // Find account by email - Port Account first
            account = await PortAccount.findOne({ where: { port_account_email: email } });
            if (!account) {
                await notificationService.sendEmail(email,
                    "Password Reset Attempt Failed",
                    "Your port account could not be found.",
                    null);
                // await notificationService.sendWhatsApp(contact_no,
                //     "Password reset failed: account not found.");  //Keep aside first
                return res.status(404).send({ message: "Account not found." });
            }

            // Update password
            account.port_account_password = bcrypt.hashSync(newPassword, 8);
        } else {
            // If PortAccount not found, try UserAccount
            account = await UserAccount.findOne({ where: { account_email: email } });

            // Account not found at all
            if (!account) {
                await notificationService.sendEmail(email,
                    "Password Reset Attempt Failed",
                    "Your user account could not be found.",
                    null);
                // await notificationService.sendWhatsApp(contact_no,
                //     "Password reset failed: account not found.");  //Keep aside first
                return res.status(404).send({ message: "Account not found." });
            }

            // Update password
            account.account_password = bcrypt.hashSync(newPassword, 8);
        }

        await account.save();
        resetStore.remove(token); // Invalidate the reset password token

        // Send Success Notification
        await notificationService.sendEmail(email,
            "Password Reset Successful",
            "Your password has been reset successfully.",
            null);
        //await notificationService.sendWhatsApp(contact_no,
        //  "Your password has been reset successfully.");  //Keep aside first
        res.send({ message: "Password has been reset successfully." });
    } catch (err) {
        // Send Failed Notification
        await notificationService.sendEmail(email,
            "Password Reset Attempt Failed",
            "An error occurred during your password reset attempt.",
            null);
        //await notificationService.sendWhatsApp(contact_no,
        //  "Password reset failed due to a system error."); //Keep aside first
        res.status(500).send({ message: "Error resetting password.", error: err.message });
    }
};