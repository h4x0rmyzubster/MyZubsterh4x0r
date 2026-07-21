# 🚀 MyZubsterGateway

**MyZubsterGateway** is the open-source backend for **MyZubster** – a privacy-first, self-hosted skills and services exchange platform with **Monero (XMR) payments**, **Tor onion service**, and a fully decentralized architecture.

Built with Node.js, Express, MongoDB, Nginx, and Cloudflare.

---

## 🔗 Live & Community

| Platform | Link |
| :--- | :--- |
| **🌐 Clearnet Site** | [https://myzubster.com](https://myzubster.com) |
| **🧅 Tor Onion** | `http://olqcnbdlt35k2stmmwvzhvuetu2fc4us2jnn5wg6y6wlcddihfmdomid.onion` |
| **📦 GitHub** | [https://github.com/DanielIoni-creator/MyZubsterGateway](https://github.com/DanielIoni-creator/MyZubsterGateway) |
| **📝 Dev.to** | [https://dev.to/danielioni](https://dev.to/danielioni) |
| **💼 LinkedIn** | [https://linkedin.com/in/danielioni](https://linkedin.com/in/danielioni) |
| **🐦 Twitter / X** | [https://twitter.com/DanielIoni](https://twitter.com/DanielIoni) |

---

## 📖 Read More

| Article | Link |
| :--- | :--- |
| **Vision** – *MyZubster: The Open-Source Platform That Could Change the Financial Era* | [Read](https://dev.to/danielioni/myzubster-the-open-source-platform-that-could-change-the-financial-era-5hlp) |
| **Deployment Guide** – *From Zero to Production: Deploying a Node.js App with Nginx, Cloudflare, systemd, and Tor* | [Read](https://dev.to/danielioni/from-zero-to-production-deploying-a-nodejs-app-with-nginx-cloudflare-systemd-and-tor-596l) |
| **Experience** – *The Long Night of Deployment: How We Tamed DNS, Nginx, Tor, and a Rebel Firewall* | [Read](https://dev.to/danielioni/the-long-night-of-deployment-how-we-tamed-dns-nginx-tor-and-a-rebel-firewall-...) |
| **Monero Integration** – *Integrating Monero Payments into a Node.js App: A Complete Guide* | [Read](https://dev.to/danielioni/integrating-monero-payments-into-a-nodejs-app-a-complete-guide-...) |
| **Seraphis Migration** – *Monero's Seraphis Migration & FCMP++: A Technical Deep Dive* | [Read](https://dev.to/danielioni/moneros-seraphis-migration-fcmp-a-technical-deep-dive-4ih) |
| **State of the Project** – *MyZubster: The Current State of the Project* | [Read](https://dev.to/danielioni/myzubster-the-current-state-of-the-project-...) |

---

## ✨ Features

- **🔐 Monero (XMR) Payments** – Private, untraceable, and censorship-resistant.
- **🧅 Tor Onion Service** – Access your platform anonymously.
- **💻 Self-Hosted** – Full control over your data and infrastructure.
- **⚡ Node.js + Express** – Fast, scalable, and modern backend.
- **📦 MongoDB** – Flexible and reliable database.
- **🛡️ Nginx + Let's Encrypt** – Secure reverse proxy with SSL.
- **🌐 Cloudflare DNS** – Fast and secure DNS management.
- **🔁 systemd** – Automatic startup and crash recovery.

---

## 🧰 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js + Express |
| **Database** | MongoDB |
| **Reverse Proxy** | Nginx + Let's Encrypt |
| **DNS** | Cloudflare |
| **Process Management** | systemd |
| **Privacy** | Tor onion service |
| **Payments** | Monero (XMR) – testnet / mainnet |
| **Frontend** | React + Vite + Tailwind |
| **Version Control** | Git + GitHub (SSH) |

---

## 📦 Installation & Setup

### Prerequisites

- Ubuntu 20.04 / 22.04 VPS
- Node.js 20+
- MongoDB
- Nginx
- Monero CLI tools (for wallet RPC)
- Tor (optional, for onion service)

### Clone the repository

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterGateway.git
cd MyZubsterGateway

Install dependencies
bash

npm install

Configure environment
bash

cp .env.example .env
nano .env

Set your MongoDB URI, JWT secret, Monero RPC URL, and other variables.
Start the server
bash

node server.js

Production (systemd)
bash

sudo cp myzubster-gateway.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable myzubster-gateway
sudo systemctl start myzubster-gateway

🔐 Monero Integration
Wallet RPC Setup

    Download Monero CLI tools:
    bash

    wget https://downloads.getmonero.org/cli/linux64 -O monero-linux64.tar.bz2
    tar -xjf monero-linux64.tar.bz2
    mv monero-x86_64-linux-gnu-v* monero
    cd monero

    Create a wallet (testnet):
    bash

    ./monero-wallet-cli --generate-new-wallet /root/monero-wallet/myzubster-wallet \
      --password MyStrongPassword123 \
      --testnet \
      --daemon-address testnet.community:28081

    Start the wallet RPC:
    bash

    nohup ./monero-wallet-rpc \
      --wallet-file /root/monero-wallet/myzubster-wallet \
      --password MyStrongPassword123 \
      --rpc-bind-port 18083 \
      --daemon-address testnet.community:28081 \
      --testnet \
      --disable-rpc-login \
      --log-level 0 \
      > /root/monero-wallet-rpc.log 2>&1 &

    Update .env:
    text

    MONERO_RPC_URL=http://127.0.0.1:18083/json_rpc
    MONERO_WALLET_ADDRESS=YOUR_PRIMARY_ADDRESS
    MONERO_NETWORK=testnet
    PAYMENT_MODE=monero

🌐 Deployment Architecture
text

┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │    (DNS + SSL)  │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Nginx (Port 80/443) │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Node.js App    │
                    │  (Port 3000)    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   MongoDB       │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Monero Wallet  │
                    │  RPC (18083)    │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  Tor Onion      │
                    │  Service        │
                    └─────────────────┘

🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

    Fork the repository

    Create your feature branch (git checkout -b feature/AmazingFeature)

    Commit your changes (git commit -m 'Add some AmazingFeature')

    Push to the branch (git push origin feature/AmazingFeature)

    Open a Pull Request

📄 License

This project is licensed under the GPLv3 License – see the LICENSE file for details.
💬 Connect with Me

    Website: https://myzubster.com

    Tor: http://olqcnbdlt35k2stmmwvzhvuetu2fc4us2jnn5wg6y6wlcddihfmdomid.onion

    GitHub: https://github.com/DanielIoni-creator

    Dev.to: https://dev.to/danielioni

    LinkedIn: https://linkedin.com/in/danielioni

    Twitter: https://twitter.com/DanielIoni

⭐ Support

If you like this project, please give it a star ⭐ on GitHub and share it with others!

Built with ❤️ for privacy, freedom, and decentralization.
