module.exports = (sequelize, DataTypes) => {
    const Driver = sequelize.define("Driver", {
        driver_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        driver_name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        driver_id_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: ID card, 1: Passport"
        },
        driver_id_no: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        driver_contact_no: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        truck_lpn: {
            type: DataTypes.STRING(10),
            allowNull: false
        }
    }, {
        tableName: "driver",
        timestamps: false
    });

    return Driver;
};