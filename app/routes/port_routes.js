const { authToken, verifyRoleOrID, verifyInput } = require("../middleware");
const controller = require("../controllers/port_controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // Add Port Account
    app.post(
        "/api/port/account/add",
        [authToken.verifyToken, authToken.isPortAccount,
            verifyRoleOrID.verifyPortRole, verifyInput.verifyPortDetails],
        controller.addPortAccount
    );

    // Update Port Account
    app.put("/api/port/account/:id",
        [authToken.verifyToken, authToken.isPortAccount,
            verifyRoleOrID.verifyPortRole, verifyRoleOrID.verifyCorrectPortID,
            verifyInput.verifyPortDetails],
        controller.updatePortAccount
    );

    // Delete Port Account
    app.delete("/api/port/account/:id",
        [authToken.verifyToken, authToken.isPortAccount,
            verifyRoleOrID.verifyPortRole, verifyRoleOrID.verifyCorrectPortID],
        controller.deletePortAccount
    );

    // Search Port Account
    app.get("/api/port/account/search",
        [authToken.verifyToken, authToken.isPortAccount,
            verifyRoleOrID.verifyPortRole],
        controller.searchPortAccount
    );

    // View Port Account
    app.get("/api/port/account/:id",
        [authToken.verifyToken, authToken.isPortAccount,
            verifyRoleOrID.verifyCorrectPortID],
        controller.viewPortAccount
    );

    // View Account Profile
    app.get("/api/port/accountprofile",
        [authToken.verifyToken, authToken.isPortAccount],
        controller.viewAccountProfile
    );

    // Update Account Profile
    app.put("/api/port/accountprofile",
        [authToken.verifyToken, authToken.isPortAccount,
            verifyInput.verifyPortDetails],
        controller.updateAccountProfile
    );
};