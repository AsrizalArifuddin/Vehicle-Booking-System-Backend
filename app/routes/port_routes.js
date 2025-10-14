const { authJwt } = require("../middleware");
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
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.addPortAccount
    );

    // Update Port Account
    app.put("/api/port/account/:id",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.updatePortAccount
    );

    // Delete Port Account
    app.delete("/api/port/account/:id",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.deletePortAccount
    );

    // Search Port Account
    app.get("/api/port/account/search",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.searchPortAccount
    );

    // View Port Account
    app.get("/api/port/account/:id",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.viewPortAccount
    );

    // View Account Profile
    app.get("/api/port/accountprofile",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.viewAccountProfile
    );

    // Update Account Profile
    app.put("/api/port/accountprofile",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.updateAccountProfile
    );
};