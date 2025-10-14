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
db.Driver = require("./driver")(sequelize, Sequelize);

// Define associations
db.PortAccount.hasMany(db.PortNotification, {
    foreignKey: "port_account_id",
    as: "port_notifications"
});

db.PortNotification.belongsTo(db.PortAccount, {
    foreignKey: "port_account_id",
    as: "port_account"
});

db.UserAccount.hasOne(db.Agent, {
    foreignKey: "user_account_id",
    as: "agent"
});

db.Agent.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

db.UserAccount.hasOne(db.Company, {
    foreignKey: "user_account_id",
    as: "company"
});

db.Company.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

db.UserAccount.hasOne(db.UserNotification, {
    foreignKey: "user_account_id",
    as: "notification"
});

db.UserNotification.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "user"
});

db.UserAccount.hasMany(db.Driver, {
    foreignKey: "user_account_id",
    as: "drivers"
});

db.Driver.belongsTo(db.UserAccount, {
    foreignKey: "user_account_id",
    as: "owner"
});

module.exports = db;