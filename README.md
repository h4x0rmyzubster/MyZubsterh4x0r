# MyZubster 🏦

**Self-hosted Monero payment gateway**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Monero](https://img.shields.io/badge/Monero-0.18.x-orange.svg)](https://www.getmonero.org/)
[![Docker](https://img.shields.io/badge/Docker-ready-blue.svg)](https://www.docker.com/)

---

## 📖 What is MyZubster?

MyZubster is a **self-hosted Monero payment gateway** designed to be modular and easily integrable into any application.

**Key features:**
- ✅ **Self-hosted** — no third-party services, full control
- ✅ **Unique subaddresses** — each order gets its own Monero address
- ✅ **Real-time exchange rate** — XMR/USD via CoinGecko API
- ✅ **Automatic payment monitoring** — checks for incoming payments every 60 seconds
- ✅ **JWT Authentication** — secure API access with JSON Web Tokens
- ✅ **PostgreSQL persistence** — orders survive server restarts
- ✅ **Docker ready** — one-command deployment

---

## 🚀 Quick Start with Docker

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterAPP.git
cd MyZubsterAPP/backend
cp .env.example .env
docker-compose up -d
he API will be available at http://localhost:3000
🔧 API Endpoints
Method	Endpoint	Description
POST	/api/auth/login	Login and get JWT token
POST	/api/orders	Create a new order
GET	/api/orders	Get all orders
GET	/api/orders/:id	Get order by ID
GET	/api/orders/status/:status	Get orders by status
GET	/api/health	Health check
🔗 Related Projects

    MyZubster-Marketplace — Example skills marketplace that uses this gateway → GitHub

    MyZubster-App — Android app for the marketplace → GitHub

📄 License

MIT License

Built with ❤️ for the Monero community 🏘️