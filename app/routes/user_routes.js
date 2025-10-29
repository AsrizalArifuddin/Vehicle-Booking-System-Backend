const { authToken, verifyInput } = require("../middleware");
const controller = require("../controllers/user_controller");
const uploadFile = require("../middleware/uploadFile");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // View Profile
    app.get("/api/user/accountprofile",
        [authToken.verifyToken, authToken.isUserAccount],
        controller.viewProfile
    );

    // Update Profile
    app.put("/api/user/accountprofile",
        [authToken.verifyToken, authToken.isUserAccount,
            uploadFile.single("attc_registration"), verifyInput.verifyUserDetails],
        controller.updateProfile
    );
};