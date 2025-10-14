const db = require("../models");

const Driver = db.Driver;
const Booking = db.Booking;
//const QRCode = db.QRCode; // later use
const notificationService = require("../services/sendNotification");

exports.getDriverList = async (req, res) => {
    const userId = req.accountId;
    const accountType = req.user?.account_type;

    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can view drivers." });
    }

    try {
        const drivers = await Driver.findAll({
        where: { user_account_id: userId },
            attributes: ["driver_id", "driver_name"] //Display id and name only
        });

        // No driver found/ added before
        if (drivers.length === 0) {
            return res.status(200).send({ message: "No drivers found under your account.", data: [] });
        }

        res.status(200).send({ message: "Driver list retrieved successfully.", data: drivers });
    } catch (err) {
        res.status(500).send({ message: "Error retrieving driver list.", error: err.message });
    }
};

exports.createBooking = async (req, res) => {
    const userId = req.accountId;
    const accountType = req.user?.account_type;

    if (![0, 1].includes(accountType)) {
        return res.status(403).send({ message: "Unauthorized: Only agent or company can create bookings." });
    }

    // Input data needed
    const { driver_id, booking_date, booking_type } = req.body;

    // Validate booking details
    if (!driver_id || !booking_date || ![0, 1].includes(booking_type)) {
        return res.status(400).send({ message: "Invalid booking details. Please fill all required fields." });
    }

    try {
        // Check if driver belongs to user
        const driver = await Driver.findOne({
            where: {
                driver_id,
                user_account_id: userId
            }
        });

        if (!driver) {
            return res.status(404).send({ message: "Selected driver not found under your account." });
        }

        const newBooking = await Booking.create({
            user_account_id: userId,
            booking_date,
            booking_type,
            booking_status: 0, // pending approval
            booking_created_at: new Date()
        });

        // Trigger notification to Port Staff/Admin
        // await notificationService.sendEmail(
        //     "port_staff_admin",  // need to ask .............................................
        //     "New Booking Request",
        //     `A new booking has been submitted by ${req.user?.account_name || "Agent/Company"} for ${booking_date}.`
        // );

        res.status(201).send({ message: "Booking request submitted successfully.", data: newBooking });
    } catch (err) {
        res.status(500).send({ message: "Failed to save booking.", error: err.message });
    }
};

