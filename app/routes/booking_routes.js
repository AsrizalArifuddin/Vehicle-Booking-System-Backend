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
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount],
        controller.createBooking);

    // Update booking
    app.put("/api/booking/update/:id",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID],
        controller.updateBooking);

    // Cancel Booking
    app.put("/api/booking/cancel/:id",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID],
        controller.cancelBooking);

    // Port get pending booking requests
    app.get("/api/booking/pending",
        [authToken.verifyToken, authToken.isPortAccount],
        controller.getPendingBookings);

    // Port approve or reject booking request
    app.post("/api/booking/approval",
        [authToken.verifyToken, authToken.isPortAccount],
        controller.approveOrRejectBooking);

    // User get booking list
    app.get("/api/booking/list",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount],
        controller.getBookingList);

    // User get booking details
    app.get("/api/booking/details/:id",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID],
        controller.getBookingDetails);

    // Search bookings
    app.get("/api/booking/search",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount],
        controller.searchBookings);

    // Download booking QR code
    app.get("/api/booking/:id/:driverId/download-qr",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount,
            verifyRoleOrID.verifyCorrectBookingID],
        controller.downloadQRCode);
};
