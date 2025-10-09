const jwt = require("jsonwebtoken");
const config = require("../config/auth_config");
const db = require("../models");

//const UserAccount = db.UserAccount;
const PortAccount = db.PortAccount;

// Verify token and extract account type
const verifyToken = async(req, res, next) => {
    let token = req.session.token || req.headers["authorization"];
    if (!token) {
        return res.status(403).send({ message: "No token provided. You cannot access the system." });
    }

    // Remove "Bearer " word
    if (token.startsWith("Bearer ")) {
        token = token.slice(7);
    }

    try {
        const decoded = jwt.verify(token, config.secret);
        req.accountId = decoded.id;

        const user = await PortAccount.findByPk(decoded.id);
        if (!user) return res.status(404).send({ message: "User not found." });

        req.user = user; // Attach user to request
        next();
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized." });
    }
};

// Middleware for user_account access (Disabled for now) - Reference only
// const isUserAccount = async (req, res, next) => {
//     if (req.accountType !== "user") {
//         return res.status(403).send({ message: "Access denied. Not a user account." });
//     }

//     try {
//         const user = await UserAccount.findByPk(req.accountId);
//         if (!user || user.account_status !== 1) {
//             return res.status(403).send({ message: "User account inactive or not found." });
//         }

//         next();
//     } catch (error) {
//         return res.status(500).send({ message: "Error validating user account." });
//     }
// };

// Middleware for port_account access
const isPortAccount = async (req, res, next) => {
    try {
        const port = await PortAccount.findByPk(req.accountId);

        if (!port) {
            return res.status(404).send({ message: "Port account not found." });
        }

        const validRoles = [1, 2, 3]; // Staff, Admin, SuperAdmin
        if (!validRoles.includes(port.port_account_role)) {
            return res.status(403).send({ message: "Access denied. Invalid port role." });
        }

        // Attach role info for downstream use
        req.portAccount = port;
        req.portRole = port.port_account_role;

        next();
    } catch (error) {
        return res.status(500).send({ message: "Error validating port account." });
    }
};

const authJwt = {
    verifyToken,
    //isUserAccount,
    isPortAccount
};

module.exports = authJwt;
