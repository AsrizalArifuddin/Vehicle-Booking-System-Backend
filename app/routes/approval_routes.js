const ApprovalController = require("../controllers/approval_controller");
const { authToken } = require("../middleware");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    // Get pending registration
    app.get(
        "/api/approval/pending",
        [authToken.verifyToken, authToken.isPortAccount],
        ApprovalController.getPendingUsers
    );

    // Registration Approval
    app.post(
        "/api/approval/decision",
        [authToken.verifyToken, authToken.isPortAccount],
        ApprovalController.processDecision
    );
};