## 🤝 Contributing

We welcome contributions! 

- 🟣 [**Good First Issues**](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/labels/good%20first%20issue) - Perfect for newcomers
- 🟢 [**Help Wanted**](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/labels/help%20wanted) - Need extra help

Check our [Contributing Guide](CONTRIBUTING.md) to get started!

[![Good First Issues](https://img.shields.io/github/issues/h4x0rmyzubster/MyZubsterh4x0r/good%20first%20issue.svg)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/labels/good%20first%20issue)
[![Help Wanted](https://img.shields.io/github/issues/h4x0rmyzubster/MyZubsterh4x0r/help%20wanted.svg)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/labels/help%20wanted)

---

# 🧩 MyZubster: Skill Exchange Platform

**MyZubster** is an open-source platform that connects people to exchange skills and services — from plumbing and hairdressing to tutoring and tech support. With a complete booking system, profiles, reviews, and community features, it's designed for peer-to-peer collaboration without intermediaries.

[![License](https://img.shields.io/badge/License-MIT%20%7C%20GPLv3-blue?style=flat)](LICENSE)
[![Android](https://img.shields.io/badge/Platform-Android-brightgreen)](https://developer.android.com/)
[![Kotlin](https://img.shields.io/badge/Kotlin-1.9-purple)](https://kotlinlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/actions)
[![Open Source](https://img.shields.io/badge/Open%20Source-%E2%9D%A4-red)](https://opensource.org/)

## 🏷️ Badges

[![GitHub stars](https://img.shields.io/github/stars/h4x0rmyzubster/MyZubsterh4x0r.svg?style=social)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/h4x0rmyzubster/MyZubsterh4x0r.svg?style=social)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/network/members)
[![GitHub issues](https://img.shields.io/github/issues/h4x0rmyzubster/MyZubsterh4x0r.svg)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/h4x0rmyzubster/MyZubsterh4x0r.svg)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/pulls)
[![License](https://img.shields.io/github/license/h4x0rmyzubster/MyZubsterh4x0r.svg)](LICENSE)
[![Contributors](https://img.shields.io/github/contributors/h4x0rmyzubster/MyZubsterh4x0r.svg)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/h4x0rmyzubster/MyZubsterh4x0r.svg)](https://github.com/h4x0rmyzubster/MyZubsterh4x0r/commits/main)

---

## 🚀 What is MyZubster?

MyZubster is a hyperlocal skill-sharing platform. It lets people in the same neighborhood offer services, request help, chat, book appointments, and send quotes — all in a community-driven environment.

**The goal** is to empower communities to collaborate directly, bypassing centralized platforms and building local connections.

---

## ✨ Key Features

### Core Features
- 🧑‍💼 **User Profiles** — Showcase skills you offer and list what you need.
- 💬 **Messaging** — Communicate safely with neighbors before confirming a transaction.
- 📍 **Location-Based Search** — Find services close to you.
- ⭐ **Reputation System** — Two-way reviews build trust in the community.
- 🛡️ **Community Guidelines** — A safe and respectful environment for everyone.

### Advanced Features
- 📅 **Booking System** — Schedule appointments with calendar and time slot selection.
- 📝 **Quotes & Estimates** — Professionals can send quotes; clients can accept or reject them.
- 📋 **Complete Work History** — Track all completed jobs with detailed information.
- 🔔 **Notifications** — Push notifications for messages, quotes, and booking updates.
- 🛠️ **Admin Panel** — Moderation tools for reports, users, skills, and activity logs.
- ✅ **Automated Testing** — Unit tests for Kotlin (Android), API tests for Node.js backend, and CI/CD with GitHub Actions.
- 🌍 **Internationalization** — Full English UI and documentation, with support for additional languages.
- 🔄 **Dual Licensing** — MIT and GPLv3 licenses for maximum flexibility.

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Mobile** | Kotlin, Android SDK, Retrofit, Material Design |
| **Backend** | Node.js, Express, MongoDB, JWT, bcrypt |
| **Bookings** | Calendar-based scheduling with time slots |
| **Quotes** | Professional-client estimate system |
| **Notifications** | Firebase FCM / UnifiedPush (optional) |
| **AI (optional)** | Groq, Gemini (for skill descriptions) |
| **Testing** | JUnit (Android), Jest (Backend) |
| **CI/CD** | GitHub Actions (tests & build at every commit) |
| **Admin Panel** | React + Material-UI (optional) |
| **Web Dashboard** | React (for public interface) |

---

## 📱 Installation Guide

### Prerequisites
- Android Studio (latest)
- Node.js 16+
- MongoDB

### Clone the repository
```bash
git clone https://github.com/h4x0rmyzubster/MyZubsterh4x0r.git
cd MyZubsterh4x0r
Backend Setup
bash

cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and API keys.
npm start
# The backend will run on http://localhost:5000

Android App
bash

# Open the project in Android Studio
# Sync Gradle and build the APK
# Install the APK on your device (or use an emulator)

Web Dashboard (Optional)
bash

cd web-dashboard
npm install
npm start
# Runs on http://localhost:3000

Admin Panel (Optional)
bash

cd admin-panel
npm install
npm start
# Runs on http://localhost:3001

🧪 Testing
bash

# Backend tests
cd backend
npm test

# Android tests (in Android Studio or terminal)
./gradlew test

# All tests with GitHub Actions (automated on every push)

📅 Booking System

MyZubster includes a complete booking system:
Feature	Description
Calendar View	Select available dates for services
Time Slots	Choose from predefined time slots
Booking Status	Track status: pending, confirmed, in_progress, completed, cancelled
Automatic Scheduling	Prevent double bookings with conflict detection

Flow:

    Client selects a service and views available slots

    Client chooses a date and time

    Booking is created with status 'pending'

    Professional receives notification and can confirm

📝 Quotes & Estimates System
Feature	Description
Send Quote	Professionals can send an amount and description for a service
Accept/Reject	Clients can accept or reject quotes
Automatic Booking Update	Accepted quotes automatically confirm the booking
Quote History	Track all sent and received quotes

Flow:

    Professional sends a quote with amount and description

    Client receives notification and reviews the quote

    Client accepts or rejects the quote

    Booking status updates accordingly

📋 Work History
Feature	Description
Complete History	View all completed jobs
Infinite Scroll	Load more history as you scroll
Job Details	See service title, category, professional, amount, and date
Filtering	Filter by category and status
🛠️ Admin Panel
Feature	Description	Role
Reports	View and manage user reports	Moderator
Users	List, filter, suspend/activate users	Admin
Skills	Approve or reject skill listings	Moderator
Stats	Dashboard with platform statistics	Moderator
Logs	Audit trail of all moderation actions	Admin
🤝 How to Contribute

We welcome contributors of all experience levels!

    Fork the repository

    Create a feature branch

    Make your changes and test them

    Submit a Pull Request with a clear description of your work

See CONTRIBUTING.md for detailed guidelines.
🛡️ Security & Privacy

    Backend uses environment variables for sensitive data; never commit .env files

    All communication between client and server is encrypted via HTTPS

    Push notifications support Firebase FCM

    Admin Panel uses role-based access control (Admin/Moderator)

If you find a security issue, please contact the maintainer privately.
📄 License

This project is licensed under either the MIT License or the GNU General Public License v3.0, at your option.

SPDX-License-Identifier: MIT OR GPL-3.0-or-later
🙏 Acknowledgments

    All open-source libraries and contributors who make this project possible

    The community for feedback and support

🚀 Ready to join the community?

Explore the code, report issues, or start contributing today!

Made with ❤️ by the MyZubster community