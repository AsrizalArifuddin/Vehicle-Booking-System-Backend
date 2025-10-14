module.exports = (sequelize, DataTypes) => {
    const QRCode = sequelize.define("QRCode", {
        qr_code_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        qr_code_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: active, 1: entered, 2: exited, 3: expired"
        },
        qr_code_image_path: {
            type: DataTypes.STRING(200),
            allowNull: false
        }
    }, {
        tableName: "qr_code",
        timestamps: false
    });

    return QRCode;
};
