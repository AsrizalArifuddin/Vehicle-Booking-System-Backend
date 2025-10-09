const db = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const PortAccount = db.PortAccount;

// Add Port Account
exports.addPortAccount = async (req, res) => {
    // Extract data from request body
    const {
        port_account_username,
        port_account_email,
        port_account_password,
        port_contact_no,
        port_account_role
    } = req.body;

    try {
        // Check requester's role
        const requesterRole = req.user?.port_account_role;

        // Only allow admin and superadmin to create port accounts
        if (![2, 3].includes(requesterRole)) {
            return res.status(403).send({ message: "Unauthorized: Only admin or superadmin can create port accounts." });
        }

        // Check for duplicate username
        const existingName = await PortAccount.findOne({ where: { port_account_username } });
        if (existingName) {
            return res.status(400).send({ message: "Username already exists." });
        }

        // Check for duplicate email
        const existingEmail = await PortAccount.findOne({ where: { port_account_email } });
        if (existingEmail) {
            return res.status(400).send({ message: "Email already exists." });
        }

        // Validate username length
        if (port_account_username && port_account_username.length > 20) {
            return res.status(400).send({ message: "Username must not exceed 20 characters." });
        }

        // Validate email format
        if (port_account_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(port_account_email)) {
            return res.status(400).send({ message: "Invalid email format." });
        }

        // Validate password length
        if (port_account_password && port_account_password.length < 6) {
            return res.status(400).send({ message: "Password must be at least 6 characters long." });
        }

        // Validate contact number (basic check: digits only, 8–15 characters)
        if (port_contact_no && !/^\d{8,15}$/.test(port_contact_no)) {
            return res.status(400).send({ message: "Invalid contact number format." });
        }

        // Validate role value
        if (port_account_role !== undefined && ![1, 2, 3].includes(port_account_role)) {
            return res.status(400).send({ message: "Invalid role value. Must be 1, 2 or 3." });
        }

        // Hash password
        const hashedPassword = bcrypt.hashSync(port_account_password, 8);

        // Create new port account
        const newAccount = await PortAccount.create({
            port_account_username,
            port_account_email,
            port_account_password: hashedPassword, // or port_account_password (not hashed)
            port_contact_no,
            port_account_role
        });

        res.status(201).send({ message: "Port account created successfully.", data: newAccount });
    } catch (err) {
        res.status(500).send({ message: "Error creating account.", error: err.message });
    }
};

// Update Port Account
exports.updatePortAccount = async (req, res) => {
    const accountIdToUpdate = req.params.id;

    // Extract data from request body
    const {
        port_account_username,
        port_account_email,
        port_account_password,
        port_contact_no,
        port_account_role
    } = req.body;

    try {
        // Check requester's role
        const requesterRole = req.user?.port_account_role;
        if (![2, 3].includes(requesterRole)) {
            return res.status(403).send({ message: "Unauthorized: Only admin or superadmin can update port accounts." });
        }

        // Account not found
        const account = await PortAccount.findByPk(accountIdToUpdate);
        if (!account) {
            return res.status(404).send({ message: "Port account not found." });
        }

        // Optional: prevent username change (if needed)
        // if (port_account_username && port_account_username !== account.port_account_username) {
        //      return res.status(400).send({ message: "Username cannot be changed." });
        // }

        if (port_account_username){
            // Check for duplicate username
            const existingName = await PortAccount.findOne({ where: { port_account_username } });
            if (existingName) {
                return res.status(400).send({ message: "Username already exists." });
            }
        }

        // Validate username length
        if (port_account_username && port_account_username.length > 20) {
            return res.status(400).send({ message: "Username must not exceed 20 characters." });
        }

        if (port_account_email){
            // Check for duplicate email
            const existingEmail = await PortAccount.findOne({ where: { port_account_email } });
            if (existingEmail) {
                return res.status(400).send({ message: "Email already exists." });
            }
        }

        // Validate email format
        if (port_account_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(port_account_email)) {
            return res.status(400).send({ message: "Invalid email format." });
        }

        // Validate password length
        if (port_account_password && port_account_password.length < 6) {
            return res.status(400).send({ message: "Password must be at least 6 characters long." });
        }

        // Validate contact number (basic check: digits only, 8–15 characters)
        if (port_contact_no && !/^\d{8,15}$/.test(port_contact_no)) {
            return res.status(400).send({ message: "Invalid contact number format." });
        }

        // Validate role value
        if (port_account_role !== undefined && ![1, 2, 3].includes(port_account_role)) {
            return res.status(400).send({ message: "Invalid role value. Must be 1, 2 or 3." });
        }

        // Update fields if provided
        if (port_account_username) account.port_account_username = port_account_username;
        if (port_account_email) account.port_account_email = port_account_email;
        if (port_account_password) account.port_account_password = require("bcryptjs").hashSync(port_account_password, 8);
        if (port_contact_no) account.port_contact_no = port_contact_no;
        if (port_account_role !== undefined) account.port_account_role = port_account_role;

        // Save updates
        await account.save();

        res.status(200).send({ message: "Port account updated successfully.", data: account });
    } catch (err) {
        res.status(500).send({ message: "Error updating account.", error: err.message });
    }
};

// Delete Port Account
exports.deletePortAccount = async (req, res) => {
    const accountIdToDelete = parseInt(req.params.id);
    const requesterId = req.accountId;
    const requesterRole = req.user?.port_account_role;

    try {
        // Only allow admin and superadmin to delete
        if (![2, 3].includes(requesterRole)) {
            return res.status(403).send({ message: "Unauthorized: Only admin or superadmin can delete port accounts." });
        }

        // Prevent self-deletion
        if (accountIdToDelete === requesterId) {
            return res.status(403).send({ message: "Unauthorized: You cannot delete your own account." });
        }

        // Account not found
        const account = await PortAccount.findByPk(accountIdToDelete);
        if (!account) {
            return res.status(404).send({ message: "Port account not found." });
        }

        // Delete account
        await account.destroy();

        res.status(200).send({ message: "Port account deleted successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error deleting account.", error: err.message });
    }
};

// Search Port Account
exports.searchPortAccount = async (req, res) => {
    const requesterRole = req.user?.port_account_role;
    const { keyword } = req.query;

    try {
        // Only allow admin and superadmin to search
        if (![2, 3].includes(requesterRole)) {
            return res.status(403).send({ message: "Unauthorized: Only admin or superadmin can search port accounts." });
        }

        // No keyword provided
        if (!keyword || keyword.trim() === "") {
            return res.status(400).send({ message: "Search keyword is required." });
        }

        const results = await PortAccount.findAll({
            //Only return these fields
            attributes: ["port_account_username", "port_account_email", "port_contact_no", "port_account_role"],

            where: {
                [Op.or]: [
                    { port_account_username: { [Op.like]: `%${keyword}%` } },
                    { port_account_email: { [Op.like]: `%${keyword}%` } },
                    { port_contact_no: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });

        // No results found
        if (results.length === 0) {
            return res.status(200).send({ message: "No matching port accounts found for the given keyword." });
        }

        res.status(200).send({ message: "Search completed.", data: results });
    } catch (err) {
        res.status(500).send({ message: "Error searching port accounts.", error: err.message });
    }
};

// View Port Account
exports.viewPortAccount = async (req, res) => {
    const accountIdToView = req.params.id;

    try {
            const account = await PortAccount.findByPk(accountIdToView, {
            // Only return these fields
            attributes: ["port_account_username", "port_account_email", "port_contact_no", "port_account_role"]
        });

        // Account not found
        if (!account) {
            return res.status(404).send({ message: "Port account not found." });
        }

        res.status(200).send({ message: "Port account details retrieved successfully.", data: account });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving account details.", error: err.message });
    }
};

// View Account Profile
exports.viewAccountProfile = async (req, res) => {
    const accountId = req.accountId;

    try {
        const account = await PortAccount.findByPk(accountId, {
            // Only return these fields
            attributes: ["port_account_username", "port_account_email", "port_contact_no", "port_account_role"]
        });

        // Account not found (should not happen if authenticated)
        if (!account) {
            return res.status(404).send({ message: "Your account profile could not be found." });
        }

        res.status(200).send({ message: "Your account profile retrieved successfully.", data: account });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving your profile.", error: err.message });
    }
};

// Update Account Profile
exports.updateAccountProfile = async (req, res) => {
    const accountId = req.accountId;
    // Extract data from request body
    const {
        port_account_username,
        port_account_email,
        port_account_password,
        port_contact_no,
        port_account_role
    } = req.body;

    try {
        // Account not found (should not happen if authenticated)
        const account = await PortAccount.findByPk(accountId);
        if (!account) {
            return res.status(404).send({ message: "Your account was not found." });
        }

        // Optional: prevent username change (if needed)
        // if (port_account_username && port_account_username !== account.port_account_username) {
        //      return res.status(400).send({ message: "Username cannot be changed." });
        // }

        if (port_account_username){
            // Check for duplicate username
            const existingName = await PortAccount.findOne({ where: { port_account_username } });
            if (existingName) {
                return res.status(400).send({ message: "Username already exists." });
            }
        }

        // Validate username length
        if (port_account_username && port_account_username.length > 20) {
            return res.status(400).send({ message: "Username must not exceed 20 characters." });
        }

        if (port_account_email){
            // Check for duplicate email
            const existingEmail = await PortAccount.findOne({ where: { port_account_email } });
            if (existingEmail) {
                return res.status(400).send({ message: "Email already exists." });
            }
        }

        // Validate email format
        if (port_account_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(port_account_email)) {
            return res.status(400).send({ message: "Invalid email format." });
        }

        // Validate password length
        if (port_account_password && port_account_password.length < 6) {
            return res.status(400).send({ message: "Password must be at least 6 characters long." });
        }

        // Validate contact number (digits only, 8–15 characters)
        if (port_contact_no && !/^\d{8,15}$/.test(port_contact_no)) {
            return res.status(400).send({ message: "Invalid contact number format." });
        }

        // Prevent role change
        if (port_account_role && port_account_role !== account.port_account_role) {
            return res.status(400).send({ message: "Role cannot be changed." });
        }

        // Apply updates
        if (port_account_username) account.port_account_username = port_account_username;
        if (port_account_email) account.port_account_email = port_account_email;
        if (port_account_password) account.port_account_password = bcrypt.hashSync(port_account_password, 8);
        if (port_contact_no) account.port_contact_no = port_contact_no;

        // Save updates
        await account.save();

        res.status(200).send({ message: "Your profile has been updated successfully.", data: account });
    } catch (err) {
        res.status(500).send({ message: "Error updating your profile.", error: err.message });
    }
};
