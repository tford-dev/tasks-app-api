"use strict";
const { Model, DataTypes } = require("sequelize");
const bcrypt = require("bcrypt");

//Schema for User table
//Most validation for User data in held within this file
module.exports = (sequelize) => {
    class User extends Model {}
    User.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        firstName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        lastName: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        emailAddress: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: {
                msg: "The email address you entered already exists."
            },
            validate: {
                notNull: {
                msg: 'An email address is required.'
                },
                isEmail: {
                msg: "Please provide a valid email address."
                }
            }
        },

        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notNull: {
                    msg: 'A password is required.'
                },
                notEmpty: {
                    msg: "Please provide a password."
                },
            },
        },
    }, {sequelize});

    //Data association with Task model
    User.associate = (models) => {
        User.hasMany(models.Task, {
            as: 'task-manager',
            foreignKey: {
                fieldName: 'userId',
                allowNull: false,
                },
        });
    };

    return User;
};