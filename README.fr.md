\# 🌐 MyZubster – L'Écosystème Open Source pour l'Échange de Services



\*\*MyZubster\*\* est plus qu'une simple passerelle de paiement ou un marché. C'est un écosystème complet, auto‑hébergé pour l'échange de services, de compétences et de valeur – propulsé par Monero, construit avec la confidentialité et conçu pour la liberté.



> \*\*"Possédez vos compétences. Possédez vos paiements. Possédez votre avenir."\*\*



\---



\## 📖 Mon Histoire – Pourquoi J'ai Construit Ce Projet



Je suis un développeur qui croit en la \*\*liberté financière\*\* et la \*\*souveraineté personnelle\*\*. Pendant des années, j'ai vu des plateformes centralisées prendre une part de chaque transaction, contrôler les données des utilisateurs et dicter les règles. Je voulais construire quelque chose de différent.



Quelque chose qui redonne le pouvoir aux gens.



\*\*MyZubster est cette vision.\*\* C'est une plateforme où tout le monde peut :

\- Offrir ses compétences à un public mondial

\- Recevoir des paiements instantanés en Monero – sans banques, sans frontières

\- Garder ses données privées et sous son propre contrôle

\- Gagner de l'argent avec son propre marché en fixant ses propres frais



J'ai construit cela parce que je crois en l'\*\*échange pair‑à‑pair\*\*. Je crois que la valeur devrait circuler librement entre les personnes, pas par l'intermédiaire d'intermédiaires. Et je crois que l'open source est le seul moyen de construire la confiance.



C'est ma contribution à un monde plus libre et plus privé.



\---



\## 🧩 L'Écosystème



MyZubster est composé de trois composants indépendants mais intégrés :

┌─────────────────────────────────────────────────────────────┐

│ ÉCOSYSTÈME MYZUBSTER │

├─────────────────────────────────────────────────────────────┤

│ │

│ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐ │

│ │ Monero │ │ Core │ │ Marketplace │ │

│ │ Wallet │──▶│ Gateway │──▶│ (Compétences, │ │

│ │ RPC │ │ (Node.js) │ │ Utilisateurs, │ │

│ └─────────────┘ └─────────────┘ │ Commandes) │ │

│ └──────────┬──────────┘ │

│ │ │

│ ▼ │

│ ┌─────────────────────┐ │

│ │ App Mobile │ │

│ │ (Android/React │ │

│ │ Native) │ │

│ └─────────────────────┘ │

└─────────────────────────────────────────────────────────────┘



\### 1️⃣ Core Gateway (`gateway/`)

Le moteur de paiement – gère toutes les interactions Monero :

\- Génère des sous‑adresses uniques par commande

\- Surveille les paiements en temps réel

\- Envoie des webhooks au marché

\- Authentification JWT



\### 2️⃣ Marketplace (`marketplace/`)

La couche commerciale – où la valeur est créée :

\- Les utilisateurs s'inscrivent et deviennent vendeurs

\- Les compétences sont listées avec des prix

\- Les commandes sont créées et suivies

\- Les avis construisent la confiance

\- Les commissions sont gagnées



\### 3️⃣ App Mobile (`app/`)

L'interface utilisateur – pour les acheteurs et les vendeurs :

\- Parcourir les compétences

\- Créer des commandes

\- Suivre l'état des paiements

\- Gérer le profil



\---



\## 💡 Qu'est‑ce qui Rend Ce Projet Différent ?



| Fonctionnalité | MyZubster | Plateformes Centralisées |

|----------------|-----------|--------------------------|

| \*\*Propriété\*\* | Vous possédez tout | Ils possèdent vos données |

| \*\*Frais\*\* | Vous les fixez (0,5–5%) | 10–30% (imposés) |

| \*\*Confidentialité\*\* | Monero + auto‑hébergement | KYC + vente de données |

| \*\*Censure\*\* | Impossible | Vous pouvez être banni |

| \*\*Liberté\*\* | Contrôle total | Vous êtes un produit |

| \*\*Transparence\*\* | Open source | Code fermé |

| \*\*Paiements\*\* | Monero instantané | Jours ou semaines |



\---



\## 🚀 Démarrage Rapide



```bash

\# Clonez l'écosystème complet

git clone https://github.com/DanielIoni-creator/MyZubster.git

cd MyZubster

git submodule update --init --recursive



\# Démarrez la passerelle

cd gateway

npm install

cp .env.example .env

node app.js



\# Démarrez le marché (dans un autre terminal)

cd ../marketplace

npm install

cp .env.example .env

node server.js



\# Démarrez l'application (dans un autre terminal)

cd ../app

npm install

npx expo start

📄 Licence



MIT License

👨‍💻 À Propos de l'Auteur



Daniel Ioni – Développeur Autodidacte \& Monero Advocate



Je suis un développeur italien de 38 ans, basé à Rimini, avec une profonde passion pour la confidentialité, la liberté financière et la technologie open source.



Mon parcours a commencé avec le minage de Bitcoin et a évolué vers un engagement profond avec la communauté Monero. J'ai fondé "Monero Italia" sur Facebook, un groupe dédié à la sensibilisation aux cryptomonnaies axées sur la vie privée en Italie. Au fil des ans, j'ai acquis de l'expérience dans le minage, le trading et la création de marketplaces, toujours avec un accent sur la décentralisation et la souveraineté de l'utilisateur.



Au‑delà du code, j'aime les animaux – j'ai une petite compagne nommée Chanel qui me tient compagnie pendant les sessions de programmation nocturnes. 🐱



Ma vision pour MyZubster est simple : créer un écosystème libre, ouvert et accessible où chacun peut échanger des services et des compétences sans intermédiaires. Je crois que la technologie devrait donner du pouvoir aux gens, pas les contrôler. C'est pourquoi MyZubster est 100% open source – n'importe qui peut l'utiliser, y contribuer, le modifier ou construire son propre business dessus.



La seule règle ? Utilisez‑le pour le bien. Pas d'activités illégales. Tout le reste est permis.



J'espère que MyZubster pourra évoluer vers une plateforme mondiale où la liberté, la vie privée et l'échange pair‑à‑pair deviendront la nouvelle norme. C'est ma contribution à un monde plus ouvert et plus équitable.



&#x20;   🌐 Basé à Rimini, Italie



&#x20;   💻 Développeur Full‑Stack Autodidacte (Node.js, React, React Native, Android)



&#x20;   🔒 Monero Advocate \& Passionné de Vie Privée



&#x20;   📱 Fondateur de "Monero Italia" (groupe Facebook)



&#x20;   🐱 Papa de Chanel



&#x20;   📫 GitHub: DanielIoni-creator



Réalisé avec ❤️ pour la communauté Monero.

