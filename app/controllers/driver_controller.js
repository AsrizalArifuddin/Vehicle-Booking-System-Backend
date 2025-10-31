const db = require("../models");
const { Op } = require("sequelize");

const UserAccount = db.UserAccount;
const Driver = db.Driver;
const EventLog = db.EventLog;

exports.addDriver = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const {
            driver_name,
            driver_id_type,
            driver_id_no,
            driver_contact_no,
            truck_lpn
        } = req.body;

        if(!driver_name || driver_id_type === undefined || !driver_id_no || !driver_contact_no || !truck_lpn){
            return res.status(400).send({ message: "All fields are required." });
        }

        const newDriver = await Driver.create({
            user_account_id: userId,
            driver_name,
            driver_id_type,
            driver_id_no,
            driver_contact_no,
            truck_lpn
        });

        const now = new Date(); // Get current date-time

        // Create event log
        await EventLog.create({
            created_at: now,
            desc_log: `User Account ${userId} has added a new driver (ID: ${newDriver.driver_id}).`,
            user_type: 0, // Not Port
            user_id: userId,
            event_type: 2 // creation
        });

        res.status(201).send({ message: "Driver added successfully.", data: newDriver });
    } catch (err) {
        res.status(500).send({ message: "Error adding driver.", error: err.message });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const {
            driver_name,
            driver_id_type,
            driver_id_no,
            driver_contact_no,
            truck_lpn
        } = req.body;

        const driverId = req.params.driverId;
        const driver = await Driver.findOne({ where: { driver_id: driverId } });
        await driver.update({
            driver_name,
            driver_id_type,
            driver_id_no,
            driver_contact_no,
            truck_lpn
        });

        res.status(200).send({ message: "Driver information updated successfully.", data: driver });
    } catch (err) {
        res.status(500).send({ message: "Error updating driver.", error: err.message });
    }
};

exports.deleteDriver = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const driverId = req.params.driverId;
        const driver = await Driver.findOne({ where: { driver_id: driverId } });
        await driver.destroy();

        res.status(200).send({ message: "Driver deleted successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error deleting driver.", error: err.message });
    }
};

exports.viewDriver = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const driverId = req.params.driverId;
        const driver = await Driver.findOne({where: {driver_id: driverId}});

        const plain = driver.get({ plain: true });

        // Map ID type
        plain.driver_id_type = plain.driver_id_type === 0 ? "ID Card" : "Passport";

        res.status(200).send({ message: "Driver information retrieved successfully.", data: plain });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving driver info.", error: err.message });
    }
};

exports.searchDriver = async (req, res) => {
    try {
        const userId = req.accountId;
        const account = await UserAccount.findByPk(userId);
        if (!account) {  //Should not come out if already sign in as user
            return res.status(404).send({ message: "Your account was not found." });
        }

        const keyword = req.query.keyword?.trim();

        // Validate input
        if (!keyword) {
            return res.status(400).send({ message: "Please provide a search keyword." });
        }

        const results = await Driver.findAll({
            where: {
                user_account_id: userId,
                [Op.or]: [
                { driver_name: { [Op.like]: `%${keyword}%` } },
                { driver_id_no: { [Op.like]: `%${keyword}%` } }
                ]
            }
        });

        if (results.length === 0) {
        return res.status(200).send({ message: "No matching drivers found.", data: [] });
        }

        const mapped = results.map(driver => {
            const plain = driver.get({ plain: true });
            plain.driver_id_type = plain.driver_id_type === 0 ? "ID Card" : "Passport";
            return plain;
        });

        res.status(200).send({ message: "Matching drivers retrieved successfully.", data: mapped });
    } catch (err) {
        res.status(500).send({ message: "Error searching for drivers.", error: err.message });
    }
};