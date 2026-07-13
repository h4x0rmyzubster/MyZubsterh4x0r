# 🧩 MyZubster

**MyZubster** is a platform for managing orders and cryptocurrency payments (Monero/XMR), featuring a modern React frontend and a Node.js backend.

---

## 🌐 Live Site

The project is currently live at:

👉 **[https://my-zubster-app.vercel.app](https://my-zubster-app.vercel.app)**

> **Note:** The backend is currently running locally. For full functionality from any device, the backend needs to be deployed to a cloud platform (Render, Cyclic.sh, etc.).

---

## 📋 Features

- ✅ **JWT Authentication** (Register / Login)
- ✅ **Order Management** (Full CRUD)
- ✅ **Mock Payments** (Auto-confirm after 3 seconds)
- ✅ **Fee Calculation** (Configurable)
- ✅ **User Dashboard** (Order history and status)
- ✅ **Modern UI** (React + CSS + Toast Notifications)

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend** | React 18, Axios, React Toastify |
| **Backend** | Node.js, Express, JWT, Bcrypt |
| **Database** | MongoDB (Atlas Cloud) |
| **Deploy** | Vercel (Frontend) |
| **Authentication** | JWT (JSON Web Tokens) |

---

## 🚀 Local Development

### Prerequisites
- Node.js (v18+)
- MongoDB (local or Atlas)
- npm or yarn

### Backend
```bash
cd backend
npm install
node server.js
The backend will be available at http://localhost:5000
Frontend
bash

cd web-dashboard
npm install
npm start

The frontend will be available at http://localhost:3000
🌍 Project URLs
Environment	URL
Frontend (Production)	https://my-zubster-app.vercel.app
Backend (Local)	http://localhost:5000
API Health Check	http://localhost:5000/api/health
📌 Roadmap

    Deploy Backend to Render / Cyclic.sh

    Real Monero Payment Integration

    Admin Panel for order management

    WebSocket for real-time notifications

📝 License

This project is distributed under the MIT License.

Built with ❤️ by Danielloni-creator