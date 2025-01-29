const redis = require('../config/redis');
const mqtt = require('mqtt');
const { v4: uuidv4 } = require('uuid');
const { Order } = require('../models/Order');
const { Trade } = require('../models/Trade');
require('dotenv').config();

class MatchingEngine {
  constructor() {
    this.mqttBroker = process.env.MARKET_DATA_MQTT_BROKER;
    this.tradeTopic = process.env.MARKET_DATA_MQTT_TOPIC;
    this.client = mqtt.connect(this.mqttBroker);

    this.client.on('connect', () => {
      console.log(`✅ Connected to MQTT broker: ${this.mqttBroker}`);
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error.message);
    });
  }

  /**
   * Adds an order to the order book stored in Redis
   * @param {object} orderData - Order object
   */
  async addOrder(orderData) {
    const { type, symbol, price, quantity, userId } = orderData;
    const orderId = uuidv4();
    const order = {
      id: orderId,
      type,
      symbol,
      price,
      quantity,
      userId,
      timestamp: Date.now(),
    };

    await redis.zadd(`orders:${symbol}:${type}`, price, JSON.stringify(order));
    console.log(`📌 Order added to book: ${JSON.stringify(order)}`);
    return order;
  }

  /**
   * Retrieves orders from Redis (sorted by price)
   * @param {string} symbol - Stock symbol
   * @param {string} type - Order type ('buy' or 'sell')
   * @returns {Array} - List of orders
   */
  async getOrders(symbol, type) {
    const orders = await redis.zrange(`orders:${symbol}:${type}`, 0, -1);
    return orders.map((order) => JSON.parse(order));
  }

  /**
   * Matches incoming orders against the order book and executes trades
   * @param {object} incomingOrder - The new order to be matched
   */
  async matchOrder(incomingOrder) {
    const { type, symbol, price, quantity, userId } = incomingOrder;
    const oppositeType = type === 'buy' ? 'sell' : 'buy';
    const bookOrders = await this.getOrders(symbol, oppositeType);

    let remainingQuantity = quantity;

    for (const order of bookOrders) {
      if ((type === 'buy' && price >= order.price) || (type === 'sell' && price <= order.price)) {
        const tradeQuantity = Math.min(remainingQuantity, order.quantity);
        const trade = await this.executeTrade(order, incomingOrder, tradeQuantity);

        console.log(`✅ Trade executed: ${JSON.stringify(trade)}`);
        this.publishTrade(trade);

        remainingQuantity -= tradeQuantity;

        if (remainingQuantity === 0) break;
      }
    }

    if (remainingQuantity > 0) {
      incomingOrder.quantity = remainingQuantity;
      await this.addOrder(incomingOrder);
    }
  }

  /**
   * Executes a trade and saves it in the database
   * @param {object} order - Matched order
   * @param {object} incomingOrder - Incoming order
   * @param {number} tradeQuantity - Quantity of the trade
   * @returns {object} - Trade details
   */
  async executeTrade(order, incomingOrder, tradeQuantity) {
    const tradePrice = order.price;
    const trade = await Trade.create({
      buyerId: incomingOrder.type === 'buy' ? incomingOrder.userId : order.userId,
      sellerId: incomingOrder.type === 'sell' ? incomingOrder.userId : order.userId,
      symbol: order.symbol,
      price: tradePrice,
      quantity: tradeQuantity,
      timestamp: new Date(),
    });

    await this.removeOrder(order.id, order.symbol, order.type);

    return trade;
  }

  /**
   * Removes an order from the order book in Redis
   * @param {string} orderId - Order ID
   * @param {string} symbol - Stock symbol
   * @param {string} type - Order type ('buy' or 'sell')
   */
  async removeOrder(orderId, symbol, type) {
    const orders = await this.getOrders(symbol, type);
    const updatedOrders = orders.filter((order) => order.id !== orderId);
    await redis.del(`orders:${symbol}:${type}`);
    updatedOrders.forEach(async (order) => {
      await redis.zadd(`orders:${symbol}:${type}`, order.price, JSON.stringify(order));
    });
  }

  /**
   * Publishes trade execution data to MQTT
   * @param {object} trade - Trade object
   */
  publishTrade(trade) {
    this.client.publish(this.tradeTopic, JSON.stringify(trade), { qos: 1 }, (err) => {
      if (err) console.error('❌ MQTT Publish Error:', err.message);
      else console.log(`📤 Trade published: ${JSON.stringify(trade)}`);
    });
  }
}

module.exports = new MatchingEngine();
