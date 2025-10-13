const ApprovalController = require("../controllers/approval_controller");
const { authJwt } = require("../middleware");

module.exports = function(app) {
    app.use(function(req, res, next) {
        res.header(
            "Access-Control-Allow-Headers",
            "Origin, Content-Type, Accept"
        );
        next();
    });

    app.get(
        "/api/approval/pending",
        [authJwt.verifyToken, authJwt.isPortAccount],
        ApprovalController.getPendingUsers);
    app.post(
        "/api/approval/decision",
        [authJwt.verifyToken, authJwt.isPortAccount],
        ApprovalController.processDecision);
};