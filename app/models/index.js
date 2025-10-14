const config = require("../config/db_config.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(
    config.DB,
    config.USER,
    config.PASSWORD,
    {
        host: config.HOST,
        dialect: config.dialect,
    }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;


db.PortAccount = require("./port_account.js")(sequelize, Sequelize);
db.PortNotification = require("./port_notification.js")(sequelize, Sequelize);
db.UserAccount = require("./user_account.js")(sequelize, Sequelize);
db.Agent = require("./agent.js")(sequelize, Sequelize);
db.Company = require("./company.js")(sequelize, Sequelize);
db.UserNotification = require("./user_notification.js")(sequelize, Sequelize);
db.Driver = require("./driver.js")(sequelize, Sequelize);
db.Booking = require("./booking.js")(sequelize, Sequelize);
db.Container = require("./container.js")(sequelize, Sequelize);
db.QRCode = require("./qr_code.js")(sequelize, Sequelize);
db.EventLog = require("./event_log.js")(sequelize, Sequelize);

// Define associations
// Port Account → Port Notification (1:M)
db.PortAccount.hasMany(db.PortNotification, {
    foreignKey: "port_account_id",
    as: "port_notifications"
});
db.PortNotification.belongsTo(db.PortAccount, {
    foreignKey: "port_account_id",
    as: "port_account"
});

// User Account → Agent (1:1)
db.UserAccount.hasOne(db.Agent, {
    foreignKey: "user_account_id",
    as: "agent"
});
db.Agent.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

// User Account → Company (1:1)
db.UserAccount.hasOne(db.Company, {
    foreignKey: "user_account_id",
    as: "company"
});
db.Company.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

// User Account → User Notification (1:1)
db.UserAccount.hasOne(db.UserNotification, {
    foreignKey: "user_account_id",
    as: "notification"
});
db.UserNotification.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

// User Account → Driver (1:M)
db.UserAccount.hasMany(db.Driver, {
    foreignKey: "user_account_id",
    as: "drivers"
});
db.Driver.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "owner"
});

// User Account → Booking (1:1)
db.UserAccount.hasOne(db.Booking, {
    foreignKey: "user_account_id",
    as: "booking"
});
db.Booking.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

// Booking → Container (1:M)
db.Booking.hasMany(db.Container, {
    foreignKey: "booking_id",
    as: "containers"
});
db.Container.belongsTo(db.Booking, {
    foreignKey: "booking_id",
    as: "booking"
});

// Driver → Container (1:M)
db.Driver.hasMany(db.Container, {
    foreignKey: "driver_id",
    as: "containers"
});
db.Container.belongsTo(db.Driver, {
    foreignKey: "driver_id",
    as: "driver"
});

// Booking → QRCode (1:M)
db.Booking.hasMany(db.QRCode, {
    foreignKey: "booking_id",
    as: "qr_codes"
});
db.QRCode.belongsTo(db.Booking, {
    foreignKey: "booking_id",
    as: "booking"
});

// Driver → QRCode (1:M)
db.Driver.hasMany(db.QRCode, {
    foreignKey: "driver_id",
    as: "qr_codes"
});
db.QRCode.belongsTo(db.Driver, {
    foreignKey: "driver_id",
    as: "driver"
});

module.exports = db;