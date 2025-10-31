const db = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");

const PortAccount = db.PortAccount;
const EventLog = db.EventLog;

// Add Port Account
exports.addPortAccount = async (req, res) => {
    try {
        const {
            port_account_username,
            port_account_email,
            port_account_password,
            port_contact_no,
            port_account_role
        } = req.body;

        if (!port_account_username || !port_account_email || !port_account_password
            || !port_contact_no || port_account_role === undefined) {
            return res.status(400).send({ message: "All fields are required." });
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

        const now = new Date(); // Get current date-time

        // Create event log
        await EventLog.create({
            created_at: now,
            desc_log: `${req.user.port_account_username} has added a new port account (Name: ${newAccount.port_account_username}).`,
            user_type: 1, // Port
            user_id: req.accountId,
            event_type: 2 // creation
        });

        res.status(201).send({ message: "Port account created successfully.", data: newAccount });
    } catch (err) {
        res.status(500).send({ message: "Error creating account.", error: err.message });
    }
};

// Update Port Account
exports.updatePortAccount = async (req, res) => {
    try {
        const {
            port_account_username,
            port_account_email,
            port_account_password,
            port_contact_no,
            port_account_role
        } = req.body;

        // Optional: prevent username change (if needed)
        // if (port_account_username && port_account_username !== account.port_account_username) {
        //      return res.status(400).send({ message: "Username cannot be changed." });
        // }

        const accountId = req.params.portId;
        const account = await PortAccount.findByPk(accountId);
        // Update fields if provided
        if (port_account_username) account.port_account_username = port_account_username;
        if (port_account_email) account.port_account_email = port_account_email;
        if (port_account_password) account.port_account_password = require("bcryptjs").hashSync(port_account_password, 8);
        if (port_contact_no) account.port_contact_no = port_contact_no;
        if (port_account_role !== undefined) account.port_account_role = port_account_role;

        await account.save();  // Save updates

        res.status(200).send({ message: "Port account updated successfully.", data: account });
    } catch (err) {
        res.status(500).send({ message: "Error updating account.", error: err.message });
    }
};

// Delete Port Account
exports.deletePortAccount = async (req, res) => {
    try {
        const accountId = parseInt(req.params.portId);
        const account = await PortAccount.findByPk(accountId);

        // Prevent self-deletion
        if (accountId === req.accountId) {
            return res.status(403).send({ message: "Unauthorized: You cannot delete your own account." });
        }

        await account.destroy(); // Delete account

        res.status(200).send({ message: "Port account deleted successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error deleting account.", error: err.message });
    }
};

// Search Port Account
exports.searchPortAccount = async (req, res) => {
    try {
        const { keyword } = req.query;

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

        // Map role values to readable labels
        const mappedResults = results.map(account => {
            const plain = account.get({ plain: true });
            plain.port_account_role =
                plain.port_account_role === 1 ? "Staff" :
                plain.port_account_role === 2 ? "Admin" :
                plain.port_account_role === 3 ? "Superadmin" :
                "Unknown";
            return plain;
        });

        res.status(200).send({ message: "Search completed.", data: mappedResults });
    } catch (err) {
        res.status(500).send({ message: "Error searching port accounts.", error: err.message });
    }
};

//Get Port Account List
exports.getPortAccountList = async (req, res) => {
    try {
        const portList = await PortAccount.findAll({
            attributes: ["port_account_id", "port_account_username", "port_account_role"],
            order: [["port_account_id", "ASC"]]
        });

        if (portList.length === 0) {
            return res.status(200).send({ message: "No port accounts found." });
        }

        res.status(200).send({ message: "Port account list retrieved successfully.", data: portList});
    } catch (err) {
        res.status(500).send({ message: "Error retrieving port accounts.", error: err.message });
    }
};

// View Port Account
exports.viewPortAccount = async (req, res) => {
    try {
        const accountId = req.params.portId;
        const account = await PortAccount.findByPk(accountId, {
            // Only return these fields
            attributes: ["port_account_username", "port_account_email", "port_contact_no", "port_account_role"]
        });

        // Convert to plain object and map role
        const plain = account.get({ plain: true });
        plain.port_account_role =
            plain.port_account_role === 1 ? "Staff" :
            plain.port_account_role === 2 ? "Admin" :
            plain.port_account_role === 3 ? "Superadmin" :
            "Unknown";

        res.status(200).send({ message: "Port account details retrieved successfully.", data: plain });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving account details.", error: err.message });
    }
};

// View Account Profile
exports.viewAccountProfile = async (req, res) => {
    try {
        const accountId = req.accountId;
        const account = await PortAccount.findByPk(accountId, {
            // Only return these fields
            attributes: ["port_account_username", "port_account_email", "port_contact_no", "port_account_role"]
        });

        // Account not found (should not happen if authenticated)
        if (!account) {
            return res.status(404).send({ message: "Your account profile could not be found." });
        }

        // Convert to plain object and map role
        const plain = account.get({ plain: true });
        plain.port_account_role =
            plain.port_account_role === 1 ? "Staff" :
            plain.port_account_role === 2 ? "Admin" :
            plain.port_account_role === 3 ? "Superadmin" :
            "Unknown";

        res.status(200).send({ message: "Your account profile retrieved successfully.", data: plain });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving your profile.", error: err.message });
    }
};

// Update Account Profile
exports.updateAccountProfile = async (req, res) => {
    try {
        const accountId = req.accountId;
        const {
            port_account_username,
            port_account_email,
            port_account_password,
            port_contact_no,
            port_account_role
        } = req.body;

        // Account not found (should not happen if authenticated)
        const account = await PortAccount.findByPk(accountId);
        if (!account) {
            return res.status(404).send({ message: "Your account was not found." });
        }

        // Optional: prevent username change (if needed)
        // if (port_account_username && port_account_username !== account.port_account_username) {
        //      return res.status(400).send({ message: "Username cannot be changed." });
        // }

        // Prevent role change
        if (port_account_role && port_account_role !== account.port_account_role) {
            return res.status(400).send({ message: "Role cannot be changed." });
        }

        // Apply updates
        if (port_account_username) account.port_account_username = port_account_username;
        if (port_account_email) account.port_account_email = port_account_email;
        if (port_account_password) account.port_account_password = bcrypt.hashSync(port_account_password, 8);
        if (port_contact_no) account.port_contact_no = port_contact_no;

        await account.save(); // Save updates

        res.status(200).send({ message: "Your profile has been updated successfully.", data: account });
    } catch (err) {
        res.status(500).send({ message: "Error updating your profile.", error: err.message });
    }
};