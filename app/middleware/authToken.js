const jwt = require("jsonwebtoken");
const config = require("../config/auth_config");
const db = require("../models");

const UserAccount = db.UserAccount;
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

        if (decoded.type === "port") {
            const port = await PortAccount.findByPk(decoded.id);
            if (port) {
                req.user = port;
                req.userType = "port";
                return next();
            }
        } else if (decoded.type === "user") {
            const user = await UserAccount.findOne({ where: { user_account_id: decoded.id } });
            if (user) {
                req.user = user;
                req.userType = "user";
                return next();
            }
        }

        return res.status(403).send({ message: "Access denied. Account not recognized." });
    } catch (err) {
        return res.status(401).send({ message: "Unauthorized." });
    }
};

// Middleware for user_account access (Disabled for now)
const isUserAccount = async (req, res, next) => {
    try {
        // SuperAdmin bypass
        if (req.superAdmin) return next();

        if (!req.accountId) {
            return res.status(401).send({ message: "Unauthorized: No account ID found." });
        }

        const user = await UserAccount.findByPk(req.accountId);

        if (!user) {
            return res.status(403).send({
                message: "Access denied. This route is only available to registered agents or companies."
            });
        }

        // Optional: restrict to active accounts only - Reference only
        // if (user.account_status !== 1) {
        // return res.status(403).send({ message: "Access denied. Your account is not approved yet." });
        // }

        req.userAccount = user;
        next();
    } catch (error) {
        return res.status(500).send({ message: "Error validating user account.", error: error.message });
    }
};


// Middleware for port_account access
const isPortAccount = async (req, res, next) => {
    try {
        if (!req.accountId) {
            return res.status(401).send({ message: "Unauthorized: No account ID found." });
        }

        const port = await PortAccount.findByPk(req.accountId);

        if (!port) {
            return res.status(404).send({ message: "Access denied. This route is only available to port officers." });
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
        return res.status(500).send({ message: "Error validating port account.", error: error.message });
    }
};

// Middleware for superadmin access
const isSuperAdmin = async (req, res, next) => {
    try {
        if (!req.accountId) {
            return res.status(401).send({ message: "Unauthorized: No account ID found." });
        }

        const superAdmin = await PortAccount.findByPk(req.accountId);

        // SuperAdmin bypass flag
        if(superAdmin && superAdmin.port_account_role === 3){
            req.superAdmin = true;
        }

        next();
    } catch (error) {
        return res.status(500).send({ message: "Error validating SuperAdmin account.", error: error.message });
    }
};

const authToken = {
    verifyToken,
    isUserAccount,
    isPortAccount,
    isSuperAdmin
};

module.exports = authToken;
