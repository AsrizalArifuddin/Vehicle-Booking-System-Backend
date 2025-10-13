module.exports = (sequelize, DataTypes) => {
    const Agent = sequelize.define("Agent", {
        agent_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        agent_fullname: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        id_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: ID card, 1: Passport"
        },
        id_no: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        contact_no: {
            type: DataTypes.STRING(15),
            allowNull: false
        },
        address: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        state: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        postcode: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        city: {
            type: DataTypes.STRING(50),
            allowNull: false
        }
    }, {
        tableName: "agent",
        timestamps: false
    });

    return Agent;
};
