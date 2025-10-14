const { authJwt } = require("../middleware");
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
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.addDriver);

    // Update driver info
    app.put("/api/driver/update/:id",
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.updateDriver);

    // Delete driver info
    app.delete("/api/driver/delete/:id",
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.deleteDriver);

    // View driver info
    app.get("/api/driver/view/:id",
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.viewDriver);

    // Search driver
    app.get("/api/driver/search",
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.searchDriver);
};