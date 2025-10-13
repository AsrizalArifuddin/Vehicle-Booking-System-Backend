const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const resetStore = require("../services/resetTokenStore");
const db = require("../models");
const config = require("../config/auth_config");
//const twilio = require("twilio");
const { Op } = require("sequelize");

const UserAccount = db.UserAccount;
const Agent = db.Agent;
const Company = db.Company;
//const UserNotification = db.UserNotification;
//const PortNotification = db.PortNotification;
const PortAccount = db.PortAccount;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "eddykoh2003@gmail.com",
        pass: "izhx twka tvsb qomb"
    }
});

// Keep aside first
// const twilioClient = twilio(
//     process.env.TWILIO_ACCOUNT_SID,
//     process.env.TWILIO_AUTH_TOKEN
// );

// const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

// User Registration
exports.registerUser = async (req, res) => {
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

    try {
        // Basic validation - Need Email, Password and Acc Type
        if (!account_email || !account_password || account_type === undefined) {
            return res.status(400).send({ message: "Email, password, and account type are required." });
        }

        // Account Type must be 0 or 1
        if (![0, 1].includes(account_type)) {
            return res.status(400).send({ message: "Invalid account type. Must be 0 (agent) or 1 (company)." });
        }

        // Check email validity
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account_email)) {
            return res.status(400).send({ message: "Invalid email format." });
        }

        // Check duplicate email
        const existing = await UserAccount.findOne({ where: { account_email } });
        if (existing) {
            return res.status(400).send({ message: "Email already registered." });
        }

        // Validate password length
        if (account_password && account_password.length < 6) {
            return res.status(400).send({ message: "Password must be at least 6 characters long." });
        }

        const hashedPassword = bcrypt.hashSync(account_password, 8);
        let user;

        // Conditional creation - Agent
        if (account_type === 0) {
            // Agent validation
            if (!agent_fullname || id_type === undefined || !id_no || !contact_no || !address || !state || !postcode || !city) {
                return res.status(400).send({ message: "All agent fields are required." });
            }

            // Validate contact number (basic check: digits only, 8–15 characters)
            if (contact_no && !/^\d{8,15}$/.test(contact_no)) {
                return res.status(400).send({ message: "Invalid contact number format." });
            }

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
            // Company validation
            if (!company_name || !registration_no || !sst_no || !contact_no || !address || !state || !postcode || !city || !attc_registration) {
                return res.status(400).send({ message: "All company fields are required." });
            }

            // Validate contact number (basic check: digits only, 8–15 characters)
            if (contact_no && !/^\d{8,15}$/.test(contact_no)) {
                return res.status(400).send({ message: "Invalid contact number format." });
            }

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

        // Helper to send notification email
        const sendEmail = async (subject, message) => {
            if (!account_email) return;
            await transporter.sendMail({
                to: account_email,
                subject,
                html: `<p>${message}</p>`
            });
        };

        // Helper: send WhatsApp notification // Keep aside first
        // const sendWhatsApp = async (message) => {
        //     if (!contact_no) return;
        //     const to = `whatsapp:+${contact_no.replace(/^0/, "60")}`; // Convert to international format
        //     await twilioClient.messages.create({
        //         from: whatsappFrom,
        //         to,
        //         body: message
        //     });
        // };

        // Send email and WhatsApp
        await sendEmail("Registration Submitted", "Your registration is pending approval.");
        // await sendWhatsApp("Your registration has been submitted, waiting for approval");  //Keep aside first

        return res.status(201).send({ message: "Registration successful. Awaiting approval." });
    } catch (err) {
        return res.status(500).send({ message: "Registration failed.", error: err.message });
    }
};

// Login
exports.signin = async (req, res) => {
    try {
        const { identifier, password } = req.body;
        let account;
        let token;
        let response;

        // Try PortAccount First (username or email)
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

            // Get ID and generate token with type
            token = jwt.sign({ id: account.port_account_id, type: "port" }, config.secret, {
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
        }

        // Try UserAccount if PortAccount not found (email only)
        account = await UserAccount.findOne({
            where: { account_email: identifier }
        });

        // If not found at all, return error
        if (!account) {
            return res.status(404).send({ message: "Account not found." });
        }

        // Check if account is pending
        if (account.account_status === 0) {
            return res.status(403).send({ message: "Your registration is still pending approval by the port officer." });
        }

        // If account is rejected
        if (account.account_status === 2) {
            return res.status(403).send({ message: "Your registration is rejecteed by the port officer." });
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

// Logout
exports.signout = async (req, res) => {
    try {
        // Check if accountId exists
        if (!req.accountId) {
            return res.status(401).send({ message: "Unauthorized: You must be signed in to log out." });
        }

       // Log email based on account type
        const email =
            req.user?.account_email || req.user?.port_account_email || "Unknown email";

        console.log("Account signed out:", email);

        req.session = null;
        return res.status(200).send({ message: "You've been signed out!" });
    } catch (err) {
        res.status(500).send({ message: "Error during signout.", error: err.message });
    }
};

// Request password reset
exports.requestReset = async (req, res) => {
    const { email } = req.body;

    // Validate email format
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).send({ message: "Invalid email format." });
    }

    // Check if email exists - Find PortAccount first
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

    await transporter.sendMail({
        to: email,
        subject: "Password Reset",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`
    });

    res.send({ message: "Reset link sent to your email." });
};

// Reset password
exports.resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword } = req.body;

    // Validate password length
    if (newPassword && newPassword.length < 6) {
        return res.status(400).send({ message: "Password must be at least 6 characters long." });
    }

    const entry = resetStore.get(token);

    const email = entry?.email;
    const account_type = entry?.account_type;

    // Helper to send notification email
    const sendEmail = async (subject, message) => {
        if (!email) return;
        await transporter.sendMail({
            to: email,
            subject,
            html: `<p>${message}</p>`
        });
    };

    // Helper: send WhatsApp notification   //Keep aside first
    // const sendWhatsApp = async (message) => {
    //     if (!contact_no) return;
    //     const to = `whatsapp:+${contact_no.replace(/^0/, "60")}`; // Convert to international format
    //     await twilioClient.messages.create({
    //         from: whatsappFrom,
    //         to,
    //         body: message
    //     });
    // };

    try {
        // Validate token
        if (!entry || entry.expiry < Date.now()) {
            await sendEmail("Password Reset Attempt Failed", "Your password reset link was invalid or expired.");
            //await sendWhatsApp("Password reset failed: invalid or expired link."); //Keep aside first
            return res.status(400).send({ message: "Invalid or expired token." });
        }

        let account;

        if (account_type === "port") {
            // Find account by email - Port Account first
            account = await PortAccount.findOne({ where: { port_account_email: email } });
            if (!account) {
                await sendEmail("Password Reset Attempt Failed", "Your port account could not be found.");
                // await sendWhatsApp("Password reset failed: account not found.");  //Keep aside first
                return res.status(404).send({ message: "Account not found." });
            }

            // Update password
            account.port_account_password = bcrypt.hashSync(newPassword, 8);
        } else {
            // If PortAccount not found
            account = await UserAccount.findOne({ where: { account_email: email } });

            if (!account) {
                await sendEmail("Password Reset Attempt Failed", "Your user account could not be found.");
                // await sendWhatsApp("Password reset failed: account not found.");  //Keep aside first
                return res.status(404).send({ message: "Account not found." });
            }

            // Update password
            account.account_password = bcrypt.hashSync(newPassword, 8);
        }

        await account.save();
        resetStore.remove(token); // Invalidate token

        // Send Success Notification
        await sendEmail("Password Reset Successful", "Your password has been reset successfully.");
        //await sendWhatsApp("Your password has been reset successfully.");  //Keep aside first
        res.send({ message: "Password has been reset successfully." });
    } catch (err) {
        // Send Failed Notification
        await sendEmail("Password Reset Attempt Failed", "An error occurred during your password reset attempt.");
        //await sendWhatsApp("Password reset failed due to a system error."); //Keep aside first
        res.status(500).send({ message: "Error resetting password.", error: err.message });
    }
};
