module.exports = (sequelize, DataTypes) => {
    const PortNotification = sequelize.define('PortNotification', {
        pn_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        port_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        pn_created_at: {
            type: DataTypes.DATE,
            allowNull: false
        },
        pn_desc: {
            type: DataTypes.STRING(200),
            allowNull: false
        },
        pn_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '0: unread, 1: read'
        }
    }, {
        tableName: 'port_notification',
        timestamps: false
    });

    return PortNotification;
};
