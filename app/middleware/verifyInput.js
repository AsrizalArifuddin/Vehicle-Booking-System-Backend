const db = require("../models");

const UserAccount = db.UserAccount;
const PortAccount = db.PortAccount;

const verifyPortDetails = async(req, res, next) => {
    try{
        const {
            port_account_username,
            port_account_email,
            port_account_password,
            port_contact_no,
            port_account_role
        } = req.body;

        if(port_account_username){
            // Check for duplicate username
            const existingName = await PortAccount.findOne({ where: { port_account_username } });
            if (existingName) {
                return res.status(400).send({ message: "Username already exists." });
            }

            // Validate username length
            if (port_account_username.length > 20) {
                return res.status(400).send({ message: "Username must not exceed 20 characters." });
            }
        }

        if(port_account_email){
            // Check for duplicate email
            const existingEmail = await PortAccount.findOne({ where: { port_account_email } });
            if (existingEmail) {
                return res.status(400).send({ message: "Email already exists." });
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(port_account_email)) {
                return res.status(400).send({ message: "Invalid email format." });
            }
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

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating port input.", error: err.message });
    }
};

const verifyUserDetails = async(req, res, next) => {
    try{
        const {
            account_email,
            account_password,
            account_type, // 0 = agent, 1 = company
            //agent_fullname,
            id_type,
            //id_no,
            contact_no,
            address,
            state,
            postcode,
            city//,
            //company_name,
            //registration_no,
            //sst_no,
            //attc_registration
        } = req.body;

        if(account_email){
            // Check for duplicate email
            const existingEmail = await UserAccount.findOne({ where: { account_email } });
            if (existingEmail) {
                return res.status(400).send({ message: "Email already exists." });
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account_email)) {
                return res.status(400).send({ message: "Invalid email format." });
            }
        }

        // Validate password length
        if (account_password && account_password.length < 6) {
            return res.status(400).send({ message: "Password must be at least 6 characters long." });
        }

        // Account Type must be 0 or 1
        if (account_type && ![0, 1].includes(account_type)) {
            return res.status(400).send({ message: "Invalid account type. Must be 0 (agent) or 1 (company)." });
        }

        // ID Type must be 0 or 1
        if (id_type && ![0, 1].includes(id_type)) {
            return res.status(400).send({ message: "Invalid id type. Must be 0 (ID Card) or 1 (Passport)." });
        }

        // Validate contact number (basic check: digits only, 8–15 characters)
        if (contact_no && !/^\d{8,15}$/.test(contact_no)) {
            return res.status(400).send({ message: "Invalid contact number format." });
        }

        // Validate postcode
        if (postcode && !/^\d{5}$/.test(String(postcode))) {
            return res.status(400).send({ message: "Postcode must be exactly 5 digits." });
        }

        // Validate city
        if (city && !/^[A-Za-z\s]{1,50}$/.test(city)) {
            return res.status(400).send({ message: "City must contain only letters and spaces (max 50 chars)." });
        }

        // Validate state
        if (state && !/^[A-Za-z\s]{1,50}$/.test(state)) {
            return res.status(400).send({ message: "State must contain only letters and spaces (max 50 chars)." });
        }

        // Validate address
        if(address){
            if (address.length === 0 || address.length > 100) {
                return res.status(400).send({
                    message: address.length === 0
                        ? "Address is required."
                        : "Address must not exceed 100 characters."
                });
            }
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating user input.", error: err.message });
    }
};

const verifyInput = {
    verifyPortDetails,
    verifyUserDetails
};

module.exports = verifyInput;