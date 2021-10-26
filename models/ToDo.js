const {Model, DataTypes} = require("sequelize");

//Schema for Tasks table
module.exports = (sequelize) => {
    class Task extends Model {};
    Task.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        title: {
            type: DataTypes.STRING,
            allowNull: false
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },

        time: {
            type: DataTypes.STRING,
            allowNull: false
        },

    }, {sequelize});

    //Data association with User table
    Task.associate = (models) => {
        Task.belongsTo(models.User, {
            as: "task-manager",
            foreignKey: {
                fieldName: "userId",
                allowNull: false,
            },
        });
    };

    return Task;
};