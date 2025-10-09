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

// Define associations
db.PortAccount.hasMany(db.PortNotification, {
    foreignKey: "port_account_id",
    as: "port_notifications"
});

db.PortNotification.belongsTo(db.PortAccount, {
    foreignKey: "port_account_id",
    as: "port_account"
});

module.exports = db;
