const { authJwt, verifyRoleOrID, verifyInput } = require("../middleware");
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
        [authJwt.verifyToken, authJwt.isSuperAdmin, authJwt.isUserAccount],
        controller.getDriverList);

    // Create booking request
    app.post("/api/booking/create",
        [authJwt.verifyToken, authJwt.isSuperAdmin, authJwt.isUserAccount,
            verifyInput.verifyBookingDetails],
        controller.createBooking);

    // Update booking
    app.put("/api/booking/update/:id",
        [authJwt.verifyToken, authJwt.isSuperAdmin, authJwt.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID, verifyInput.verifyBookingDetails],
        controller.updateBooking);

    // Cancel Booking
    app.delete("/api/booking/cancel/:id",
        [authJwt.verifyToken, authJwt.isSuperAdmin, authJwt.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID],
        controller.cancelBooking);

};
