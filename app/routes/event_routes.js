const { authToken } = require("../middleware");
const controller = require("../controllers/event_controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // View Event Logs - Port Account only
    app.get("/api/port/viewlogs",
        [authToken.verifyToken, authToken.isPortAccount],
        controller.viewEventLogs
    );

    // Search Event Logs - Port Account only
    app.get("/api/port/viewlogs/search",
        [authToken.verifyToken, authToken.isPortAccount],
        controller.searchEventLogs
    );
};