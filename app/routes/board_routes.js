//Reference Only - May use in future

const { authToken } = require("../middleware");
const controller = require("../controllers/board_controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // User Routes
    app.get(
        "/api/board/user",
        [authToken.verifyToken, authToken.isSuperAdmin, authToken.isUserAccount],
        controller.userView
    );


    // Port Routes
    app.get(
        "/api/board/port",
        [authToken.verifyToken, authToken.isPortAccount],
        controller.portView
    );
};