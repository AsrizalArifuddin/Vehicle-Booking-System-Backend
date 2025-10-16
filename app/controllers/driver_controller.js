const db = require("../models");
const { Op } = require("sequelize");

const Driver = db.Driver;

exports.addDriver = async (req, res) => {
    try {
        const {
            driver_name,
            driver_id_type,
            driver_id_no,
            driver_contact_no,
            truck_lpn
        } = req.body;
        const userId = req.accountId;

        // Should not come out as already has middleware(isUserAccount)
        // Only agent/company can add drivers
        const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
        if (![0, 1].includes(accountType)) {
            return res.status(403).send({ message: "Unauthorized: Only agent or company can add drivers." });
        }

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

        res.status(201).send({ message: "Driver added successfully.", data: newDriver });
    } catch (err) {
        res.status(500).send({ message: "Error adding driver.", error: err.message });
    }
};

exports.updateDriver = async (req, res) => {
    try {
        const {
            driver_name,
            driver_id_type,
            driver_id_no,
            driver_contact_no,
            truck_lpn
        } = req.body;

        // Should not come out as already has middleware(isUserAccount)
        // Only agent/company can update drivers
        const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
        if (![0, 1].includes(accountType)) {
            return res.status(403).send({ message: "Unauthorized: Only agent or company can update drivers." });
        }

        const driverId = req.params.id;
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
        const driverId = req.params.id;
        // Should not come out as already has middleware(isUserAccount)
        // Only agent/company can delete drivers
        const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
        if (![0, 1].includes(accountType)) {
            return res.status(403).send({ message: "Unauthorized: Only agent or company can delete drivers." });
        }

        const driver = await Driver.findOne({ where: { driver_id: driverId } });
        await driver.destroy();

        res.status(200).send({ message: "Driver deleted successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error deleting driver.", error: err.message });
    }
};

exports.viewDriver = async (req, res) => {
    try {
        // Should not come out as already has middleware(isUserAccount)
        // Only agent/company can view drivers
        const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
        if (![0, 1].includes(accountType)) {
            return res.status(403).send({ message: "Unauthorized: Only agent or company can view drivers." });
        }

        const driverId = req.params.id;
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
        const keyword = req.query.keyword?.trim();

        // Should not come out as already has middleware(isUserAccount)
        // Only agent/company can search drivers
        const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
        if (![0, 1].includes(accountType)) {
            return res.status(403).send({ message: "Unauthorized: Only agent or company can search drivers." });
        }

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