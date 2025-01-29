const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const User = require('./User');

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.UUID, // Universally Unique Identifier for orders
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('buy', 'sell'), // Buy or sell order
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'filled', 'partially_filled', 'cancelled'), // Order status
      defaultValue: 'open',
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT, // Price per unit of the asset
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    quantity: {
      type: DataTypes.FLOAT, // Quantity of the asset to buy/sell
      allowNull: false,
      validate: {
        min: 0.01, // Minimum quantity to avoid invalid orders
      },
    },
    filledQuantity: {
      type: DataTypes.FLOAT, // Quantity that has already been filled
      defaultValue: 0,
    },
    remainingQuantity: {
      type: DataTypes.FLOAT, // Automatically calculated remaining quantity
      allowNull: false,
      defaultValue: function () {
        return this.quantity - this.filledQuantity;
      },
    },
    userId: {
      type: DataTypes.UUID, // Foreign key to link the order to a user
      allowNull: false,
    },
  },
  {
    sequelize, // This line should pass the sequelize instance correctly
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  }
);

// Associations
Order.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE', // Delete orders when the associated user is deleted
});

module.exports = Order;
