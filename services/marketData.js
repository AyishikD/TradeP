const mqtt = require('mqtt');
const axios = require('axios');
require('dotenv').config();

class MarketDataService {
  constructor() {
    this.alphaVantageUrl = process.env.MARKET_DATA_API_URL;
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.mqttBroker = process.env.MARKET_DATA_MQTT_BROKER;
    this.mqttTopic = process.env.MARKET_DATA_MQTT_TOPIC;
    this.client = mqtt.connect(this.mqttBroker);
    this.connected = false;

    this.client.on('connect', () => {
      console.log(`✅ Connected to MQTT broker: ${this.mqttBroker}`);
      this.connected = true;
      this.client.subscribe(this.mqttTopic, (err) => {
        if (err) console.error('❌ MQTT Subscription error:', err.message);
      });
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT Error:', error.message);
      this.connected = false;
    });

    this.client.on('message', (topic, message) => {
      console.log(`📩 Received market data from ${topic}: ${message.toString()}`);
    });
  }

  /**
   * Fetches market data from Alpha Vantage
   * @param {string} symbol - Stock symbol (e.g., AAPL, TSLA)
   */
  async fetchMarketData(symbol) {
    try {
      const url = `${this.alphaVantageUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`;
      const response = await axios.get(url);
      const stockData = response.data['Global Quote'];

      if (!stockData || !stockData['05. price']) {
        throw new Error('Invalid response from Alpha Vantage');
      }

      return {
        symbol,
        price: stockData['05. price'],
        volume: stockData['06. volume'],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`❌ Error fetching market data for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Publishes market data to the MQTT topic
   * @param {object} data - Market data object
   */
  publishMarketData(data) {
    if (this.connected) {
      this.client.publish(this.mqttTopic, JSON.stringify(data), { qos: 1 }, (err) => {
        if (err) console.error('❌ MQTT Publish Error:', err.message);
        else console.log(`📤 Published market data: ${JSON.stringify(data)}`);
      });
    } else {
      console.warn('⚠️ MQTT is not connected. Unable to publish data.');
    }
  }

  /**
   * Fetches and publishes market data for a given stock symbol every X seconds
   * @param {string} symbol - Stock symbol (e.g., AAPL)
   * @param {number} interval - Fetch interval in milliseconds
   */
  startMarketDataFeed(symbol, interval = 5000) {
    console.log(`🚀 Starting market data feed for ${symbol} every ${interval / 1000} seconds...`);
    setInterval(async () => {
      const data = await this.fetchMarketData(symbol);
      if (data) this.publishMarketData(data);
    }, interval);
  }
}

module.exports = new MarketDataService();
