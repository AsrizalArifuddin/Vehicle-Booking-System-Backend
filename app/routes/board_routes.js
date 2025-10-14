//Reference Only - May use in future

const { authJwt } = require("../middleware");
const controller = require("../controllers/board_controller");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // app.get(
    //     "/api/type/user",
    //     [authJwt.verifyToken],
    //     controller.userView
    // );


    // Port routes
    app.get(
        "/api/board/port",
        [authJwt.verifyToken, authJwt.isPortAccount],
        controller.portView
    );
};