const { authJwt } = require("../middleware");
const controller = require("../controllers/booking_controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // Get driver list for booking form
    app.get("/api/booking/drivers",
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.getDriverList);

    // Create booking request
    app.post("/api/booking/create",
        [authJwt.verifyToken, authJwt.isUserAccount],
        controller.createBooking);
};
