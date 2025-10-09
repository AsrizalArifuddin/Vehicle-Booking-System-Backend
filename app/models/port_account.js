module.exports = (sequelize, DataTypes) => {
    const PortAccount = sequelize.define('PortAccount', {
        port_account_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        port_account_username: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        port_account_email: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        port_account_password: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        port_contact_no: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        port_account_role: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: '1: Staff, 2: Admin, 3: SuperAdmin(developer)'
        },
    }, {
        tableName: 'port_account',
        timestamps: false
    });

    return PortAccount;
};
