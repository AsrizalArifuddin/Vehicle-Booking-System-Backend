module.exports = (sequelize, DataTypes) => {
    const Container = sequelize.define("Container", {
        container_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        booking_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        driver_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        container_number: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        container_size: {
            type: DataTypes.STRING(10),
            allowNull: false
        },
        container_type: {
            type: DataTypes.STRING(10),
            allowNull: false
        }
    }, {
        tableName: "container",
        timestamps: false
    });

    return Container;
};
