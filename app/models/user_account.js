module.exports = (sequelize, DataTypes) => {
    const UserAccount = sequelize.define("UserAccount", {
        user_account_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        account_type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: agent, 1: company"
        },
        account_email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            }
        },
        account_password: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        account_status: {
            type: DataTypes.INTEGER,
            allowNull: false,
            comment: "0: pending approval, 1: approved, 2: rejected, 3: deleted"
        }
    }, {
        tableName: "user_account",
        timestamps: false
    });

    return UserAccount;
};
