const db = require("../models");
const { Op } = require("sequelize");

const EventLog = db.EventLog;

exports.viewEventLogs = async (req, res) => {
    try {
        const logs = await EventLog.findAll({
            order: [["created_at", "DESC"]],
            // limit: 100 // adjust or remove limit as needed
        });

        if (!logs || logs.length === 0) {
            return res.status(404).json({ message: "No event logs found." });
        }

        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve event logs.", error: err.message });
    }
};

exports.searchEventLogs = async (req, res) => {
    try {
        const { user_type, event_type, date } = req.query;
        const whereClause = {};

        // Validate and filter by user_type (0 = user, 1 = port)
        if (user_type !== undefined) {
            const parsedType = parseInt(user_type);
            if (isNaN(parsedType) || ![0, 1].includes(parsedType)) {
                return res.status(400).json(
                    { message: "Invalid user_type. Must be 0 (user) or 1 (port)." });
            }
            whereClause.user_type = parsedType;
        }

        // Validate and filter by event_type (0 = auth, 1 = approval, 2 = creation)
        if (event_type !== undefined) {
            const parsedEvent = parseInt(event_type);
            if (isNaN(parsedEvent) || ![0, 1, 2].includes(parsedEvent)) {
                return res.status(400).json(
                    { message: "Invalid event_type. Must be 0 (authentication), 1 (approval) or 2 (creation)." });
            }
            whereClause.event_type = parsedEvent;
        }

        // Validate and filter by date (YYYY-MM-DD)
        if (date) {
            const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateFormat.test(date)) {
                return res.status(400).json({ message: "Invalid date format. Use YYYY-MM-DD." });
            }

            const start = new Date(date + "T00:00:00");
            const end = new Date(date + "T23:59:59");
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: "Invalid date value. Unable to parse date." });
            }

            whereClause.created_at = { [Op.between]: [start, end] };
        }

        const logs = await EventLog.findAll({
            where: whereClause,
            order: [["created_at", "DESC"]],
        });

        if (logs.length === 0) {
            return res.status(404).json({ message: "No matching event logs found." });
        }

        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ message: "Failed to search event logs.", error: err.message });
    }
};