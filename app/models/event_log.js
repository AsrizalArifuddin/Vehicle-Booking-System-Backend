module.exports = (sequelize, DataTypes) => {
    const EventLog = sequelize.define("EventLog", {
        log_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        desc_log: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        user_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: Not Port (Agent/Company), 1: Port (Staff/Admin)"
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        event_type: {
            type: DataTypes.INTEGER,
            allowNull: false
        }
    }, {
        tableName: "event_log",
        timestamps: false
    });

    return EventLog;
};
