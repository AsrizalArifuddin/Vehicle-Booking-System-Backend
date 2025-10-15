const db = require("../models");

const PortAccount = db.PortAccount;

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


const verifyRoleOrID = {
    verifyPortRole,
    verifyCorrectPortID
};

module.exports = verifyRoleOrID;