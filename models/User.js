const {  Sequelize, Model, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/database'); 

class User extends Model {}

User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      balance: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
            sequelize, 
            modelName: 'User',
            tableName: 'users',
            timestamps: true,
    }
  );
module.exports = User;
