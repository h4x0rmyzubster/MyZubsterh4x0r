# MyZubster 🛒🔒

**Self-hosted Monero payment gateway with subaddresses**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Monero](https://img.shields.io/badge/Monero-0.18.x-orange.svg)](https://www.getmonero.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)
[![Docker Pulls](https://img.shields.io/docker/pulls/myzubster/myzubster.svg)](https://hub.docker.com/r/myzubster/myzubster)
[![Status](https://img.shields.io/badge/status-production-green.svg)]()

---

## 📖 What is MyZubster?

MyZubster is a **self-hosted Monero payment gateway** that generates unique **subaddresses** for each order. It's designed to be integrated into e-commerce platforms, SaaS apps, or any web application that wants to accept Monero (XMR) payments without relying on third-party services.

**Key features:**
- ✅ **Self-hosted** — no third-party services, full control
- ✅ **Unique subaddresses** — each order gets its own Monero address
- ✅ **Real-time exchange rate** — XMR/USD via CoinGecko API
- ✅ **Automatic payment monitoring** — checks for incoming payments every 60 seconds
- ✅ **REST API** — simple integration with any frontend
- ✅ **JWT Authentication** — secure API access with JSON Web Tokens
- ✅ **PostgreSQL persistence** — orders survive server restarts
- ✅ **Docker ready** — one-command deployment
- ✅ **Mock mode** — test without Monero RPC
- ✅ **Mainnet ready** — tested and ready for production
- ✅ **Open source** — MIT license

---

## 📦 Docker Hub

The official Docker image is available on Docker Hub:

```bash
docker pull myzubster/myzubster:latest
🐳 Quick Start with Docker (Development)

The easiest way to run MyZubster for development is with Docker Compose.
Prerequisites

    Docker and Docker Compose installed

    Monero Wallet RPC running on your host (optional for mock mode)

1️⃣ Clone and start
bash

git clone https://github.com/DanielIoni-creator/MyZubsterAPP.git
cd MyZubsterAPP/backend

# Create .env from example
cp .env.example .env

# Start with Docker Compose
docker-compose up -d

2️⃣ The API is available at:
text

http://localhost:3000

3️⃣ Stop the containers
bash

docker-compose down

🔐 JWT Authentication

All API endpoints (except /api/auth/login and /api/health) require JWT authentication.
Login
http

POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@myzubster.com",
  "password": "admin123"
}

Response:
json

{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@myzubster.com",
    "role": "admin"
  },
  "expiresIn": "7d"
}

Using the Token

Include the token in the Authorization header for all protected endpoints:
bash

Authorization: Bearer <your_token>

Example with curl:
bash

curl -X GET http://localhost:3000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

🔧 API Endpoints
Authentication (Public)
Method	Endpoint	Description
POST	/api/auth/login	Login and get JWT token
GET	/api/auth/me	Get current user info (requires token)
Orders (Protected - require JWT)
Method	Endpoint	Description
POST	/api/orders	Create a new order
GET	/api/orders	Get all orders
GET	/api/orders/:id	Get order by ID
GET	/api/orders/status/:status	Get orders by status (pending/completed)
Health Check (Public)
Method	Endpoint	Description
GET	/api/health	Check system status
📊 Payment Flow

    Customer places an order → Backend generates a unique Monero subaddress

    Customer sends Monero to the subaddress

    Payment Monitor (runs every 60 seconds) checks get_transfers for incoming payments

    Status updates to completed when payment reaches minimum confirmations (10 by default)

    Customer sees the updated status via the API

🚀 Deploy in Production
1️⃣ Prerequisites

    Docker and Docker Compose installed on the VPS/server

    Domain (optional, for HTTPS)

    Monero Wallet RPC running (or use mock mode)

2️⃣ Setup environment variables

Create a .env.prod file in the backend/ directory:
bash

cp .env.prod.example .env.prod
# Edit .env.prod with your production values

Required variables:
env

DATABASE_URL=postgresql://user:password@postgres:5432/myzubster
JWT_SECRET=your_strong_secret_key
MONERO_RPC_URL=http://your-monero-rpc-host:18083
MONERO_NETWORK=mainnet

3️⃣ Run with production Docker Compose
bash

cd backend
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

4️⃣ Check logs
bash

docker-compose -f docker-compose.prod.yml logs -f

5️⃣ Stop production
bash

docker-compose -f docker-compose.prod.yml down

🔐 Security Notes for Production

    Use strong passwords for PostgreSQL and JWT secret

    Enable HTTPS with a reverse proxy (Nginx, Caddy)

    Set MONERO_NETWORK=mainnet for real payments

    Set MONERO_MIN_CONFIRMATIONS=10 for mainnet

    Use environment variables (never hardcode secrets)

    Keep .env.prod outside of Git (already in .gitignore)

🧪 Testing with Testnet
1️⃣ Get testnet Monero from faucet

    https://cypherfaucet.com/xmr-testnet

    https://faucet.xmr.pt/

2️⃣ Create an order via API (requires JWT token)

First, get a token:
bash

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myzubster.com","password":"admin123"}'

Then create an order:
bash

curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":0.01,"currency":"USD","customerEmail":"test@example.com"}'

3️⃣ Send testnet XMR to the generated subaddress
4️⃣ Wait 60 seconds for the monitor to detect the payment
5️⃣ Check order status
bash

curl -X GET http://localhost:3000/api/orders/1 \
  -H "Authorization: Bearer YOUR_TOKEN"

🔒 Mainnet Configuration

To use MyZubster on Monero mainnet:
1️⃣ Update your .env file:
env

MONERO_NETWORK=mainnet
MONERO_MIN_CONFIRMATIONS=10

2️⃣ Make sure your wallet has mainnet XMR
3️⃣ Start monero-wallet-rpc on mainnet:
bash

monero-wallet-rpc --wallet-file your_wallet --password your_password --rpc-bind-port 18083 --disable-rpc-login

4️⃣ Restart the backend:
bash

docker-compose restart backend

⚠️ Important Notes for Mainnet

    Minimum confirmations: Set MONERO_MIN_CONFIRMATIONS to at least 10 to prevent double-spending attacks

    Test with small amounts first: Test with 0.001 XMR before processing larger payments

    Monitor transactions: Check the logs regularly (docker-compose logs -f backend)

    Network switch: The backend will automatically detect the network from MONERO_NETWORK

🛠️ Tech Stack
Component	Technology
Backend	Node.js + Express
Database	PostgreSQL (via Sequelize ORM)
Wallet RPC	monero-wallet-rpc
Exchange Rate	CoinGecko API
Monitoring	node-cron (every 60 seconds)
Authentication	JWT (jsonwebtoken)
Containerization	Docker + Docker Compose
📁 Project Structure
text

backend/
├── app.js                 # Main application entry point
├── Dockerfile             # Docker image definition
├── docker-compose.yml     # Development Docker Compose
├── docker-compose.prod.yml # Production Docker Compose
├── .dockerignore          # Files excluded from Docker image
├── middleware/
│   └── auth.js            # JWT authentication middleware
├── models/
│   └── index.js           # Sequelize models
├── routes/
│   └── auth.js            # Authentication routes
├── services/
│   ├── exchangeRate.js    # XMR/USD exchange rate
│   └── paymentMonitor.js  # Payment monitoring (cron job)
└── .env.example           # Environment variables template

🐳 Docker Commands
bash

# Development
docker-compose up -d
docker-compose logs -f
docker-compose down

# Production
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
docker-compose -f docker-compose.prod.yml logs -f
docker-compose -f docker-compose.prod.yml down

🤝 Contributing

Contributions are welcome! Feel free to:

    🐛 Report bugs

    💡 Suggest features

    🔧 Submit pull requests

📄 License

This project is licensed under the MIT License — see the LICENSE file for details.
🌟 Support

If you find this project useful, please give it a ⭐ on GitHub!
🔗 Links

    GitHub: https://github.com/DanielIoni-creator/MyZubsterAPP

    Docker Hub: https://hub.docker.com/r/myzubster/myzubster

    Author: DanielIoni-creator

Built with ❤️ for the Monero community