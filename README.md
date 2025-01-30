# 🚀 PTrade - Backend-Only Trading Engine

PTrade is a high-performance, backend-only trading engine built with **Node.js, Express.js, and PostgreSQL (via Supabase)**. It features real-time order matching, market data processing, and caching using **Redis (Upstash)** and **MQTT** for real-time communication.

---

## ⚡ Features

- **User Management** (Registration, Authentication, Balance Management)
- **Order Matching Engine** (Buy/Sell Order Processing)
- **Real-Time Market Data Feed** (Using MQTT & External API)
- **Trade Execution & Transaction Logging**
- **Database: PostgreSQL (Supabase)**
- **Caching & Queues: Redis (Upstash)**
- **Real-time Communication: MQTT**
- **High Performance & Scalability**

---

## 🛠 Installation & Setup

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/yourusername/ptrade.git
cd ptrade
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Set Up Environment Variables
Create a `.env` file in the root directory and configure it:
```ini
PORT=3000
DATABASE_URL=your_supabase_postgresql_url
REDIS_URL=your_upstash_redis_url
MQTT_BROKER_URL=mqtt://broker.hivemq.com
```
### 5️⃣ Start the Server
```sh
npm start
```

---

## 🔥 API Endpoints

### 🟢 User Management
| Method | Endpoint       | Description         |
|--------|--------------|---------------------|
| POST   | /api/register | Register a new user |
| POST   | /api/login    | Authenticate user   |
| GET    | /api/balance  | Get user balance    |

### 🔵 Trading
| Method | Endpoint         | Description                  |
|--------|-----------------|------------------------------|
| POST   | /api/order       | Place a new buy/sell order  |
| GET    | /api/orders      | View open orders            |
| GET    | /api/transactions| View executed transactions  |

---

## 🤝 Contributing
1. Fork the project
2. Create a new feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Added new feature'`)
4. Push to branch (`git push origin feature-name`)
5. Open a Pull Request 🚀

---

