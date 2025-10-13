module.exports = (sequelize, DataTypes) => {
    const UserNotification = sequelize.define("UserNotification", {
        un_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        un_created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        un_desc: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        un_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: unread, 1: read"
        }
    }, {
        tableName: "user_notification",
        timestamps: false
    });

    return UserNotification;
};
