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
        validate: {
          len: [8, 100], 
        },
      },      
    },
    {
            sequelize, 
            modelName: 'User',
            tableName: 'users',
            timestamps: true,
    }
  );
  
/**
 * Hash the payment pin and password before saving the user
 */
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10); // Hash the password before saving it
  }
});
/**
 * Method to check if the provided password matches the stored hash
 * @param {string} password - The password to check
 * @returns {boolean} - Returns true if the password matches, otherwise false
 */
User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.password); // Compare the given password with the hashed password
};

module.exports = User;
