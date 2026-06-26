# MyZubster 🤝

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Android CI](https://img.shields.io/badge/Android%20CI-passing-brightgreen)](https://developer.android.com/studio/) // Placeholder for actual CI badge

MyZubster è un'applicazione Android open-source progettata per favorire un'economia iper-locale connettendo vicini per lo scambio di competenze e servizi. Costruito con una forte enfasi sulla privacy e sulla decentralizzazione, MyZubster consente agli utenti di offrire e richiedere servizi, pagando in modo sicuro con Monero (XMR).

---

## 👋 About MyZubster

MyZubster mira a creare un vivace marketplace guidato dalla comunità, dove gli individui possono sfruttare le proprie competenze e trovare assistenza locale. Che tu sia un idraulico, un parrucchiere, un tutor o abbia bisogno di aiuto con l'IT, MyZubster è la tua piattaforma per connetterti con le persone nelle vicinanze.

---

## 🌟 Funzionalità Principali

*   🔐 **Pagamenti Monero (XMR) Non-Custodial:** Tutte le transazioni sono private e sicure, con gli utenti che mantengono il pieno controllo delle proprie chiavi private.
*   👤 **Profili Utente Dettagliati:** Mostra le tue competenze offerte (es. tuttofare, stilista, tecnico) e elenca i servizi che cerchi.
*   💬 **Chat Criptata End-to-End:** Comunica direttamente e in modo sicuro con i tuoi vicini per concordare i dettagli del servizio.
*   📍 **Geolocalizzazione di Vicinato:** Scopri competenze e servizi disponibili proprio nella tua zona locale.
*   ⭐ **Sistema di Recensioni a Doppio Senso:** Costruisci fiducia e reputazione all'interno della community lasciando e ricevendo feedback onesto.
*   🛡️ **Integrazione Consigliata con Mullvad VPN:** Per un livello avanzato di privacy online.
*   ⛏️ **Mining Opzionale di Monero:** Contribuisci alla rete Monero e potenzialmente guadagna ricompense.
*   💰 **Commissione Trasparente del 2% sulle Transazioni:** Una piccola e chiara commissione supporta la manutenzione e la crescita della piattaforma.

---

## 🏗️ Architettura

MyZubster è costruito utilizzando un'architettura moderna e robusta:

*   **Frontend:** Android (Kotlin) con il pattern architetturale MVVM (Model-View-ViewModel) per manutenibilità e scalabilità.
*   **Backend:** Un server Node.js robusto che utilizza Express.js per il routing delle API e MongoDB come database.
*   **Pagamenti:** Integrazione con `monero-merchant` per transazioni Monero sicure e private.
*   **API:** Design di API RESTful per una comunicazione fluida tra frontend e backend.

---

## 🚀 Installazione e Configurazione

Segui questi passaggi per mettere MyZubster in funzione:

### 1. Clona il Repository
Inizia clonando il progetto sulla tua macchina locale:
```bash
git clone https://github.com/tuo-username/MyZubster.git
cd MyZubster