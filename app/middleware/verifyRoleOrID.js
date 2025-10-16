const db = require("../models");

const PortAccount = db.PortAccount;
const Driver = db.Driver;

const verifyPortRole = async(req, res, next) => {
    try{
        // Check requester's role
        const requesterRole = req.user?.port_account_role;

        // Only allow admin and superadmin access
        if (![2, 3].includes(requesterRole)) {
            return res.status(403).send({ message: "Unauthorized: Only admin or superadmin to access." });
        }

        next();
    } catch (err) {
        return res.status(500).send({ message: "Error validating port role.", error: err.message });
    }
};

const verifyCorrectPortID = async(req, res, next) => {
    try{
        const accountId = req.params.id;

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
        const driverId = req.params.id;

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


const verifyRoleOrID = {
    verifyPortRole,
    verifyCorrectPortID,
    verifyCorrectDriverID
};

module.exports = verifyRoleOrID;