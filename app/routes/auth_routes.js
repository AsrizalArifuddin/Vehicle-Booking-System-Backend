//const { verifySignUp } = require("../middleware");
const controller = require("../controllers/auth_controller");
const { authJwt } = require("../middleware");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // Authentication routes
    app.post("/api/auth/signup", controller.registerUser);
    app.post("/api/auth/signin", controller.signin);
    app.get("/api/auth/signout", authJwt.verifyToken, controller.signout);

    // Password reset routes
    app.post("/api/auth/request-reset", controller.requestReset);
    app.post("/api/auth/reset-password/:token", controller.resetPassword);
};