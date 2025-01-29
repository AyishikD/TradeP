const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database'); 
const User = require('./User'); // Import User model
const Order = require('./Order'); // Import Order model

/**
 * Trade model definition
 */
class Trade extends Model {}

Trade.init(
  {
    id: {
      type: DataTypes.UUID, // Universally Unique Identifier for trades
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    buyOrderId: {
      type: DataTypes.UUID, // ID of the buy order involved in the trade
      allowNull: false,
    },
    sellOrderId: {
      type: DataTypes.UUID, // ID of the sell order involved in the trade
      allowNull: false,
    },
    buyerId: {
      type: DataTypes.UUID, // ID of the user who placed the buy order
      allowNull: false,
    },
    sellerId: {
      type: DataTypes.UUID, // ID of the user who placed the sell order
      allowNull: false,
    },
    matchedPrice: {
      type: DataTypes.FLOAT, // Price at which the trade was executed
      allowNull: false,
      validate: {
        min: 0, // Price must be non-negative
      },
    },
    matchedQuantity: {
      type: DataTypes.FLOAT, // Quantity that was traded
      allowNull: false,
      validate: {
        min: 0.01, // Minimum quantity traded
      },
    },
  },
  {
    sequelize,
    tableName: 'trades',
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

// Associations

// A trade involves a buy order
Trade.belongsTo(Order, {
  foreignKey: 'buyOrderId',
  as: 'buyOrder',
  onDelete: 'CASCADE', // Delete trade if the associated buy order is deleted
});

// A trade involves a sell order
Trade.belongsTo(Order, {
  foreignKey: 'sellOrderId',
  as: 'sellOrder',
  onDelete: 'CASCADE', // Delete trade if the associated sell order is deleted
});

// A trade references the buyer (user)
Trade.belongsTo(User, {
  foreignKey: 'buyerId',
  as: 'buyer',
  onDelete: 'CASCADE', // Delete trade if the associated buyer is deleted
});

// A trade references the seller (user)
Trade.belongsTo(User, {
  foreignKey: 'sellerId',
  as: 'seller',
  onDelete: 'CASCADE', // Delete trade if the associated seller is deleted
});

module.exports = Trade;
