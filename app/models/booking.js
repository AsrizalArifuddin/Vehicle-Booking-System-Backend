module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define("Booking", {
        booking_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        booking_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        booking_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: pending approval, 1: approved, 2: rejected, 3: cancelled"
        },
        booking_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: import, 1: export"
        },
        booking_created_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: "booking",
        timestamps: false
    });

    return Booking;
};
