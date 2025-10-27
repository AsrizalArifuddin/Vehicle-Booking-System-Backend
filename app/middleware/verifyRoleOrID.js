const db = require("../models");

const PortAccount = db.PortAccount;
const Driver = db.Driver;
const Booking = db.Booking;

const verifyPortRole = async(req, res, next) => {
    try{
        // Check role - Only allow admin and superadmin access
        if (![2, 3].includes(req.user?.port_account_role)) {
            return res.status(403).send({ message: "Unauthorized: Only admin or superadmin to access." });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating port role.", error: err.message });
    }
};

const verifyCorrectPortID = async(req, res, next) => {
    try{
        const accountId = req.params.portId;

        // Account not found
        const account = await PortAccount.findByPk(accountId);
        if (!account) {
            return res.status(404).send({ message: "Port account not found." });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating port account ID.", error: err.message });
    }
};

const verifyCorrectDriverID = async(req, res, next) => {
    try{
        const userId = req.accountId;
        const driverId = req.params.driverId;

        const driver = await Driver.findOne({
            where: {
                driver_id: driverId,
                user_account_id: userId // Ensures ownership
            }
        });
        if (!driver) {
            return res.status(404).send({ message: "Driver not found or not owned by your account." });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating driver ID.", error: err.message });
    }
};

const verifyCorrectBookingID = async(req, res, next) => {
    try{
        const userId = req.accountId;
        const bookingId = req.params.bookingId;

        const booking = await Booking.findOne({
            where: {
                booking_id: bookingId,
                user_account_id: userId // Ensures ownership
            }
        });
        if (!booking) {
            return res.status(404).send({ message: "Booking not found." });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating booking ID.", error: err.message });
    }
};

const verifyRoleOrID = {
    verifyPortRole,
    verifyCorrectPortID,
    verifyCorrectDriverID,
    verifyCorrectBookingID
};

module.exports = verifyRoleOrID;