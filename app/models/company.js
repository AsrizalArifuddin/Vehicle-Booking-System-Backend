module.exports = (sequelize, DataTypes) => {
    const Company = sequelize.define("Company", {
        company_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        user_account_id: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        company_name: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        registration_no: {
            type: DataTypes.STRING(20),
            allowNull: false
        },
        sst_no: {
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
        },
        attc_registration: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
    }, {
        tableName: "company",
        timestamps: false
    });

    return Company;
};
