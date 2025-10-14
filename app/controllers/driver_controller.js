const db = require("../models");
const { Op } = require("sequelize");

const Driver = db.Driver;

exports.addDriver = async (req, res) => {
    const userId = req.accountId;
    const accountType = req.user?.account_type; // 0 = Agent, 1 = Company

    // Only agent/company can add drivers
    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can add drivers." });
    }

    const {
        driver_name,
        driver_id_type,
        driver_id_no,
        driver_contact_no,
        truck_lpn
    } = req.body;

    // Validation
    if (!driver_name || driver_name.length > 50) {
        return res.status(400).send({ message: "Driver name is required and must be under 50 characters." });
    }

    if (![0, 1].includes(driver_id_type)) {
        return res.status(400).send({ message: "Driver ID type must be 0 (ID Card) or 1 (Passport)." });
    }

    if (!driver_id_no || driver_id_no.length > 20) {
        return res.status(400).send({ message: "Driver ID number is required and must be under 20 characters." });
    }

    if (!driver_contact_no || !/^\d{8,15}$/.test(String(driver_contact_no))) {
        return res.status(400).send({ message: "Driver contact number must be 8-15 digits." });
    }

    if (!truck_lpn || truck_lpn.length > 10 || !/^[A-Za-z0-9]+$/.test(truck_lpn)) {
        return res.status(400).send({
            message: "Truck license plate number must be alphanumeric and under 10 characters."
        });
    }

    try {
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
    const userId = req.accountId;
    const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
    const driverId = req.params.id;

    // Only agent/company can update drivers
    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can update drivers." });
    }

    const {
        driver_name,
        driver_id_type,
        driver_id_no,
        driver_contact_no,
        truck_lpn
    } = req.body;

    // Validation
    if (driver_name && driver_name.length > 50) {
        return res.status(400).send({ message: "Driver name must be a string under 50 characters." });
    }

    if (driver_id_type !== undefined && ![0, 1].includes(driver_id_type)) {
        return res.status(400).send({ message: "Driver ID type must be 0 (ID Card) or 1 (Passport)." });
    }

    if (driver_id_no && driver_id_no.length > 20) {
        return res.status(400).send({ message: "Driver ID number must be a string under 20 characters." });
    }

    if (driver_contact_no && !/^\d{8,15}$/.test(String(driver_contact_no))) {
        return res.status(400).send({ message: "Driver contact number must be 8-15 digits." });
    }

    if (truck_lpn && (truck_lpn.length > 10 || !/^[A-Za-z0-9]+$/.test(truck_lpn))) {
        return res.status(400).send({ message: "Truck license plate must be alphanumeric and under 10 characters." });
    }

    try {
        const driver = await Driver.findOne({
            where: {
                driver_id: driverId,
                user_account_id: userId // Ensures ownership
            }
        });

        if (!driver) {
            return res.status(404).send({ message: "Driver not found or not owned by your account." });
        }

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
    const userId = req.accountId;
    const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
    const driverId = req.params.id;

    // Only agent/company can delete drivers
    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can delete drivers." });
    }

    try {
        const driver = await Driver.findOne({
            where: {
                driver_id: driverId,
                user_account_id: userId // Ensures ownership
            }
        });

        if (!driver) {
            return res.status(404).send({ message: "Driver not found or not owned by your account." });
        }

        await driver.destroy();

        res.status(200).send({ message: "Driver deleted successfully." });
    } catch (err) {
        res.status(500).send({ message: "Error deleting driver.", error: err.message });
    }
};

exports.viewDriver = async (req, res) => {
    const userId = req.accountId;
    const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
    const driverId = req.params.id;

    // Only agent/company can view drivers
    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can view drivers." });
    }

    try {
        const driver = await Driver.findOne({
            where: {
                driver_id: driverId,
                user_account_id: userId // Ensures ownership
            }
        });

        if (!driver) {
            return res.status(404).send({ message: "Driver not found or not owned by your account." });
        }

        const plain = driver.get({ plain: true });

        // Map ID type
        plain.driver_id_type = plain.driver_id_type === 0 ? "ID Card" : "Passport";

        res.status(200).send({ message: "Driver information retrieved successfully.", data: plain });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving driver info.", error: err.message });
    }
};

exports.searchDriver = async (req, res) => {
    const userId = req.accountId;
    const accountType = req.user?.account_type; // 0 = Agent, 1 = Company
    const { name, id_no } = req.query;

    // Only agent/company can search drivers
    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can search drivers." });
    }

    // Validate input
    if (!name && !id_no) {
        return res.status(400).send({ message: "Please provide at least one search criteria: name or ID number." });
    }

    const whereClause = {
        user_account_id: userId,
        [Op.and]: []
    };

    if (name) {
        whereClause[Op.and].push({
            driver_name: { [Op.like]: `%${name}%` }
        });
    }

    if (id_no) {
        whereClause[Op.and].push({
            driver_id_no: { [Op.like]: `%${id_no}%` }
        });
    }

    try {
        const results = await Driver.findAll({
            where: whereClause
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