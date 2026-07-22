# 🚀 MyZubster Gateway

**A Full‑Stack Decentralized Marketplace for Tokenizing Real‑World Assets**  
with **Monero** payments, **Kali Linux** security, **DeepSeek AI** dispute resolution, **Tari** programmable assets, and **Tor** privacy.

🔗 **Live Demo:** [https://myzubster.com](https://myzubster.com)  
📦 **GitHub:** [DanielIoni-creator/MyZubsterGateway](https://github.com/DanielIoni-creator/MyZubsterGateway)

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Configuration](#-configuration)
  - [Monero Wallet RPC](#-monero-wallet-rpc)
  - [Kali Linux + DeepSeek AI Bot](#-kali-linux--deepseek-ai-bot)
  - [Tari (Programmable Sidechain)](#-tari-programmable-sidechain)
  - [SSL & HTTPS](#-ssl--https)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [Social & Community](#-social--community)
- [License](#-license)

---

## ✨ Features

- **Tokenization** – Create fungible tokens (real estate, art, equity, commodities) with full metadata.
- **Monero Payments** – Private, untraceable payments with subaddress generation and automatic order completion.
- **Self‑Defending Security** – Autonomous bot that scans with Kali Linux tools (`nmap`, `nikto`, `sqlmap`) and analyses threats with DeepSeek AI (local).
- **AI Dispute Resolution** – DeepSeek acts as an impartial mediator for escrow disputes, deciding release, refund, or escalation.
- **Tari Integration** – On‑chain multisig escrow, programmable NFTs with royalties, and smart contracts.
- **Reputation System** – Points earned per trade (seller +10/token, buyer +5/token) inform AI decisions.
- **Tor Onion Service** – Censorship‑resistant access (migrating to a dedicated VPS).
- **HTTPS** – Let’s Encrypt SSL certificate for secure clearnet access.
- **Admin Dashboard** – (Coming soon) Real‑time statistics, user management, and transaction logs.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcrypt |
| Payments | Monero (XMR) – stagenet / mainnet |
| Security | Kali Linux tools + DeepSeek AI (Ollama) |
| Programmable Assets | Tari (Rust node & wallet) |
| Frontend | React + Vite |
| Reverse Proxy | Nginx |
| SSL | Let’s Encrypt (Certbot) |
| Privacy | Tor (onion service) |
| Deployment | Ubuntu 24.04 VPS + Systemd |

---

## 🏗️ Architecture

┌─────────────────────────────────────────────────────────────────────

│ MyZubster │
├─────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│ │ Tokenization │ │ Monero │ │ Kali Linux + AI Bot │ │
│ │ (Fungible) │ │ Payments │ │ (Security & Automation)│ │
│ └──────────────┘ └──────────────┘ └──────────────────────────┘ │
│ │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│ │ Tari + NFTs │ │ Escrow │ │ DeepSeek (Local AI) │ │
│ │ (Smart) │ │ (Multisig) │ │ (Dispute Resolution) │ │
│ └──────────────┘ └──────────────┘ └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
text


---

## 🔧 Installation

### 1. Clone the repository

```bash
git clone https://github.com/DanielIoni-creator/MyZubsterGateway.git
cd MyZubsterGateway

2. Install Node.js dependencies
bash

npm install

3. Set up environment variables

Create a .env file in the root directory with the following:
env

# Server
PORT=3000
NODE_ENV=production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/myzubster

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# Monero RPC
MONERO_WALLET_RPC_URL=http://localhost:18083/json_rpc
MONERO_DAEMON_RPC_URL=http://localhost:18081/json_rpc
MONERO_NETWORK=stagenet

# Tari RPC
TARI_RPC_URL=http://localhost:12810/json_rpc
TARI_WALLET_RPC=http://localhost:12820/json_rpc
TARI_NETWORK=testnet

# Frontend URL
FRONTEND_URL=https://myzubster.com

4. Start MongoDB
bash

systemctl start mongod
systemctl enable mongod

⚙️ Configuration
🔐 Monero Wallet RPC
1. Start the Monero daemon (stagenet)
bash

cd ~/monero
./monerod --stagenet --detach

2. Start the wallet RPC
bash

./monero-wallet-rpc \
  --rpc-bind-port 18083 \
  --daemon-address node.moneroworld.com:38081 \
  --wallet-file ./myzubster_wallet \
  --password 'YourPassword' \
  --disable-rpc-login \
  --trusted-daemon \
  --stagenet

3. Verify
bash

curl -X POST http://localhost:18083/json_rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' | jq '.'

🤖 Kali Linux + DeepSeek AI Bot
1. Install Kali tools
bash

apt update
apt install nmap nikto sqlmap -y

2. Install Ollama and pull DeepSeek
bash

curl -fsSL https://ollama.com/install.sh | sh
ollama pull deepseek-r1:1.5b

3. The security bot script (/root/security_bot.py)
python

#!/usr/bin/env python3
import subprocess
import requests
import json

MYZUBSTER_API = "http://localhost:3000/api"
TOKEN = ""

def login():
    resp = requests.post(f"{MYZUBSTER_API}/auth/login",
                         json={"email":"test@example.com","password":"Test123!"})
    return resp.json().get('token')

def ask_deepseek(prompt):
    resp = requests.post(
        f"{MYZUBSTER_API}/ai/ask",
        json={"prompt": prompt},
        headers={'Authorization': f'Bearer {TOKEN}'}
    )
    return resp.json().get('response')

def scan_gateway():
    return subprocess.run(['nmap', '-p', '3000,80,443', 'localhost'], capture_output=True, text=True).stdout

4. Automate with cron (every hour)
bash

crontab -e
# Add:
0 * * * * /usr/bin/python3 /root/security_bot.py >> /var/log/security_bot.log 2>&1

🌐 Tari (Programmable Sidechain)
1. Install Rust and Tari
bash

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

git clone https://github.com/tari-project/tari.git
cd tari
cargo build --release --bin minotari_node
cargo build --release --bin minotari_console_wallet

2. Start Tari node and wallet
bash

nohup ~/tari/target/release/minotari_node \
  --network testnet \
  --base-path ~/tari-data \
  > ~/tari_node.log 2>&1 &

nohup ~/tari/target/release/minotari_console_wallet \
  --network testnet \
  --password myzubster \
  --wallet-file ~/tari-wallet \
  > ~/tari_wallet.log 2>&1 &

3. Verify RPC
bash

curl -X POST http://localhost:12820/json_rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' | jq '.'

🔒 SSL & HTTPS (Let's Encrypt)
bash

apt install certbot python3-certbot-nginx -y
certbot --nginx -d myzubster.com -d www.myzubster.com

Auto‑renewal:
bash

certbot renew --dry-run

🌐 API Endpoints
Method	Endpoint	Description	Auth
POST	/api/auth/register	Register a new user	No
POST	/api/auth/login	Login, get JWT token	No
GET	/api/tokens	List active tokens	No
POST	/api/tokens	Create a token	Yes
GET	/api/tokens/holdings	User holdings	Yes
POST	/api/marketplace/sell	Create a sell order	Yes
POST	/api/marketplace/buy/:orderId	Buy from an order	Yes
GET	/api/marketplace/orders/:tokenId	List open orders	No
POST	/api/payments	Initiate a Monero payment	Yes
GET	/api/payments/:id	Check payment status	Yes
POST	/api/ai/ask	Query DeepSeek AI	Yes
POST	/api/escrow	Create an escrow	Yes
POST	/api/escrow/:id/dispute	Open a dispute	Yes
POST	/api/tari/nft/mint	Mint an NFT on Tari	Yes
POST	/api/tari/escrow	Create a Tari multisig escrow	Yes
GET	/api/health	Health check	No
🤝 Contributing

We welcome contributions of all kinds!

    Fork the repository.

    Create a new branch (git checkout -b feature/amazing-feature).

    Commit your changes (git commit -m 'Add some amazing feature').

    Push to the branch (git push origin feature/amazing-feature).

    Open a Pull Request.

🌍 Social & Community

    Live Demo: https://myzubster.com

    GitHub: DanielIoni-creator/MyZubsterGateway

    X (Twitter): @myzubster

    LinkedIn: Daniel Ioni

    DEV.to: @danielioni

    TikTok: @h4x0r_23

📄 License

This project is licensed under the MIT License – see the LICENSE file for details.

Built with ❤️ by the MyZubster team.
