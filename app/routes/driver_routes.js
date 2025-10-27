const { authToken, verifyInput, verifyRoleOrID } = require("../middleware");
const controller = require("../controllers/driver_controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // Add driver info (accessible only to agent/company)
    app.post("/api/driver/add",
        [authToken.verifyToken, authToken.isUserAccount,
            verifyInput.verifyDriverDetails],
        controller.addDriver
    );

    // Update driver info
    app.put("/api/driver/update/:driverId",
        [authToken.verifyToken, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectDriverID, verifyInput.verifyDriverDetails],
        controller.updateDriver
    );

    // Delete driver info
    app.delete("/api/driver/delete/:driverId",
        [authToken.verifyToken, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectDriverID],
        controller.deleteDriver
    );

    // View driver info
    app.get("/api/driver/view/:driverId",
        [authToken.verifyToken, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectDriverID],
        controller.viewDriver
    );

    // Search driver
    app.get("/api/driver/search",
        [authToken.verifyToken, authToken.isUserAccount],
        controller.searchDriver
    );
};