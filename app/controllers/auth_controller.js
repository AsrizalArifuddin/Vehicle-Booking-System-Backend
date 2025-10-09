const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const resetStore = require("../services/resetTokenStore");
const db = require("../models");
const config = require("../config/auth_config");
const twilio = require("twilio");
const { Op } = require("sequelize");

//const User = db.UserAccount; // Disabled for now - Reference only
const PortAccount = db.PortAccount;

const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

// Login
exports.signin = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Disabled for now - Reference only
        // Try user login first
        // let account = await User.findOne({ where: { id } });
        // let accountType = "user";

        // If above not found, try port login
        //if (!account) {
        let account = await PortAccount.findOne({
            where: {
                [Op.or]: [
                    { port_account_username: identifier },
                    { port_account_email: identifier }
                ]
            }
        });
        //}

        // If still not found, return error
        if (!account) {
            return res.status(404).send({ message: "Account not found." });
        }

        // Check password // Reference only
        // const hashedPassword = accountType === "user" ? account.password : account.port_account_password;
        // const passwordIsValid = bcrypt.compareSync(password, hashedPassword);

        const passwordIsValid = bcrypt.compareSync(password, account.port_account_password);

        // If password is not valid
        if (!passwordIsValid) {
            return res.status(401).send({ message: "Invalid Password!" });
        }

        // Map role to type - For PortAccount only
        const roleMap = {
            1: "staff",
            2: "admin",
            3: "superadmin"
        };

        // Determine account type - for port accounts only
        const accountType = roleMap[account.port_account_role] || "unknown";

        // Get ID and generate token with type
        //const accountId = accountType === "user" ? account.id : account.port_account_id;
        const token = jwt.sign({ id: account.port_account_id, type: accountType }, config.secret, {
            algorithm: 'HS256',
            allowInsecureKeySizes: true,
            expiresIn: 86400 // 24 hours
        });

        req.session.token = token; // Store token in session - JWT is Session based

        // Build response // later need to change to include user side
        const response = {
            id: account.port_account_id,
            username: account.port_account_username,
            email: account.port_account_email,
            role: account.port_account_role,
            //token: token  //If want to check token
        };

        return res.status(200).send(response);
    } catch (error) {
        return res.status(500).send({ message: error.message });
    }
};

// Logout
exports.signout = async (req, res) => {
    try {
        // If token is missing or invalid, req.user will be undefined
        if (!req.user) {
            return res.status(401).send({ message: "Unauthorized: You must be signed in to log out." });
        }

        console.log("User signed out:", req.user?.port_account_email);

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

    // Check if email exists
    const emailAccount = await PortAccount.findOne({ where: { port_account_email: email } });
    if (!emailAccount) {
        return res.status(404).send({ message: "Email not found." });
    }

    const contact_no = emailAccount.port_contact_no;

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes

    //resetStore.set(email, token, expiry);
    resetStore.set(token, { email, contact_no, expiry });

    const resetLink = `http://localhost:8080/api/auth/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "eddykoh2003@gmail.com",
            pass: "izhx twka tvsb qomb"
        }
    });

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

    const entry = resetStore.get(token);

    const email = entry?.email;
    const contact_no = entry?.contact_no;

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "eddykoh2003@gmail.com",
            pass: "izhx twka tvsb qomb"
        }
    });

    // Helper to send notification email
    const sendNotification = async (subject, message) => {
        if (!email) return;
        await transporter.sendMail({
            to: email,
            subject,
            html: `<p>${message}</p>`
        });
    };

    // Helper: send WhatsApp notification
    const sendWhatsApp = async (message) => {
        if (!contact_no) return;
        const to = `whatsapp:+${contact_no.replace(/^0/, "60")}`; // Convert to international format
        await twilioClient.messages.create({
            from: whatsappFrom,
            to,
            body: message
        });
    };

    try {
        // Validate token
        if (!entry || entry.expiry < Date.now()) {
            await sendNotification("Password Reset Attempt Failed", "Your password reset link was invalid or expired.");
            await sendWhatsApp("Password reset failed: invalid or expired link.");
            return res.status(400).send({ message: "Invalid or expired token." });
        }

        // Find account by email
        const account = await PortAccount.findOne({ where: { port_account_email: email } });
        if (!account) {
            await sendNotification("Password Reset Attempt Failed", "Your account could not be found during password reset.");
            await sendWhatsApp("Password reset failed: account not found.");
            return res.status(404).send({ message: "Account not found." });
        }

        // Update password
        account.port_account_password = bcrypt.hashSync(newPassword, 8);
        await account.save();

        resetStore.remove(token); // Invalidate token

        // Send Success Notification
        await sendNotification("Password Reset Successful", "Your password has been reset successfully.");
        await sendWhatsApp("Your password has been reset successfully.");
        res.send({ message: "Password has been reset successfully." });
    } catch (err) {
        // Send Failed Notification
        await sendNotification("Password Reset Attempt Failed", "An error occurred during your password reset attempt.");
        await sendWhatsApp("Password reset failed due to a system error.");
        res.status(500).send({ message: "Error resetting password.", error: err.message });
    }
};
