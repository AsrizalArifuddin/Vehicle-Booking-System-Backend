const { authToken, verifyRoleOrID, verifyInput } = require("../middleware");
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
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount],
        controller.getDriverList);

    // Create booking request
    app.post("/api/booking/create",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyInput.verifyBookingDetails],
        controller.createBooking);

    // Update booking
    app.put("/api/booking/update/:id",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID, verifyInput.verifyBookingDetails],
        controller.updateBooking);

    // Cancel Booking
    app.delete("/api/booking/cancel/:id",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID],
        controller.cancelBooking);

};
