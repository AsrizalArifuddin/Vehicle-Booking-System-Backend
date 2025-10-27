const controller = require("../controllers/auth_controller");
const { authToken, verifyInput } = require("../middleware");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // Authentication and Registration Routes
    app.post("/api/auth/signup", verifyInput.verifyUserDetails, controller.registerUser);
    app.post("/api/auth/signin/user", controller.signinUser);
    app.post("/api/auth/signin/port", controller.signinPort);
    app.get("/api/auth/signout", authToken.verifyToken, controller.signout);

    // Password reset routes
    app.post("/api/auth/request-reset", controller.requestReset);
    app.post("/api/auth/reset-password/:token", controller.resetPassword);
};