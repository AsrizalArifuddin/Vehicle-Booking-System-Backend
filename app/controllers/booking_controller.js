const db = require("../models");

const Driver = db.Driver;
const Booking = db.Booking;
//const QRCode = db.QRCode; // later use
const notificationService = require("../services/sendNotification");

exports.getDriverList = async (req, res) => {
    try {
        const userId = req.accountId;
        //const accountType = req.user?.account_type;

        // Token already block out the not user - reference only
        // if (![0, 1].includes(accountType)) {
        //     return res.status(403).send({ message: "Unauthorized: Only agent or company can view drivers." });
        // }

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
    try {
        const userId = req.accountId;
        //const accountType = req.user?.account_type;

        // Token already block out the not user - reference only
        // if (![0, 1].includes(accountType)) {
        //     return res.status(403).send({ message: "Unauthorized: Only agent or company can create bookings." });
        // }

        // Input data needed
        const { driver_id, booking_date, booking_type } = req.body;

        // Validate booking details
        if (!driver_id || !booking_date || booking_type === undefined) {
            return res.status(400).send({ message: "Invalid booking details. Please fill all required fields." });
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

exports.updateBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { driver_id, booking_date, booking_type } = req.body;

        // Check booking pending status
        const booking = await Booking.findByPk(bookingId);
        if (booking.booking_status !== 0) {
            return res.status(403).send({ message: "Only pending bookings can be updated." });
        }

        // Update booking
        if(driver_id) booking.driver_id = driver_id;
        if(booking_date) booking.booking_date = booking_date;
        if(booking_type !== undefined) booking.booking_type = booking_type;

        await booking.save();

        // Notify port staff/admin
        // await notificationService.sendEmail(
        // "port_staff_admin",  // need to ask .............................................
        // "Booking Updated",
        // `Booking ID ${bookingId} has been updated by ${req.user?.account_email || "an agent/company"}.`
        // );

        res.status(200).send({ message: "Booking updated successfully.", data: booking });
    } catch (err) {
        res.status(500).send({ message: "Failed to update booking.", error: err.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;

        // Check booking pending status
        const booking = await Booking.findByPk(bookingId);
        if (booking.booking_status !== 0) {
            return res.status(403).send({ message: "Only pending bookings can be canceled." });
        }

        // Delete booking
        await booking.destroy();

        // Notify port staff/admin
        // await notificationService.sendEmail(
        //     "port@example.com",
        //     "Booking Canceled",
        //     `Booking ID ${bookingId} has been canceled by ${req.user?.account_email || "an agent/company"}.`
        // );

        res.status(200).send({ message: "Booking canceled successfully." });
    } catch (err) {
        res.status(500).send({ message: "Failed to cancel booking.", error: err.message });
    }
};




