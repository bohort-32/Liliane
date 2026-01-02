Voici une version améliorée de votre README avec une meilleure structure, des formulations plus claires et des éléments visuels pour faciliter la compréhension. J'ai également ajouté des badges pour les technologies utilisées et une section pour les contributeurs.

---

# **Lil-IA-ne** 🎓
*Un assistant d'orientation intelligent pour le **BTS SIO** du lycée Saint-Louis (Châteaulin)*

[![Ollama](https://img.shields.io/badge/Ollama-3.2-ff69b4?logo=ollama)](https://ollama.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## **📌 Présentation**
**Lil-IA-ne** est un **LLM (Large Language Model)** spécialisé pour répondre aux questions sur le **BTS SIO** (Options **SISR** et **SLAM**) du lycée Saint-Louis à Châteaulin.

### **Architecture**
Le projet se compose de deux parties principales :
1. **LLM** : Configuration du modèle de langage (réflexion, connaissances sur la formation).
2. **WebChat** : Interface web pour discuter avec l'assistant.

---

## **⚙️ Prérequis**
Avant de lancer le projet, assurez-vous d'avoir installé :

| Outil | Lien | Version requise |
|--------|------|------------------|
| **Ollama** | [Site officiel](https://ollama.com/) | Dernière version |
| **Modèle Llama 3.2** | [Ollama Library](https://ollama.com/library/llama3.2) | *(Modifiable)* |
| **Python 3.10+** | [Téléchargement](https://www.python.org/downloads/) | + `pandas` (`pip install pandas`) |
| **Node.js 18+** | [Téléchargement](https://nodejs.org/en) | + `express` (`npm i express`) |

---

## **📂 Structure du projet**
```
Lil-IA-ne/
├── BTS_SIO_Infos.xlsx       # Base de connaissances (à modifier)
├── generate_data.py        # Script de compilation du LLM
├── WebChat/
│   ├── public/             # Fichiers statiques (images, CSS, JS)
│   │   └── images/         # Dossier pour les images (locaux, schémas...)
│   ├── config/             # Configuration du chat
│   │   └── system-prompt.txt # Fichier généré par generate_data.py
│   ├── server.js           # Serveur Node.js
│   └── ...                 # Autres fichiers front/back
└── README.md               # Ce fichier
```

---

## **🛠️ Configuration du LLM**
Les informations sur le BTS SIO sont stockées dans **`BTS_SIO_Infos.xlsx`**, organisé en **onglets thématiques** :

| Onglet | Description |
|--------|-------------|
| **Présentation Générale** | Description globale du BTS SIO. |
| **Option SISR** | Contenu pédagogique de l'option **Solutions d'Infrastructure, Systèmes et Réseaux**. |
| **Option SLAM** | Contenu pédagogique de l'option **Solutions Logicielles et Applications Métiers**. |
| **Admission** | Critères et modalités d'inscription. |
| **Stages** | Organisation et missions des périodes de stage. |
| **Débouchés** | Métiers et poursuites d'études possibles. |
| **Equipements** | Locaux et matériel disponibles. |
| **Emploi du temps** | Exemple d'emploi du temps en 1ère année. |
| **Vie étudiante** | Événements organisés par le BDE. |
| **Contact** | Coordonnées (mails, réseaux, portes ouvertes...). |
| **Images** | Liste des images référencées (voir ci-dessous). |

### **Ajouter une image**
1. Placez votre image dans **`/WebChat/public/images/`**.
2. Remplissez l'onglet **"Images"** dans `BTS_SIO_Infos.xlsx` avec :
   - **Nom du fichier** (ex: `salle_info.jpg`)
   - **Description** (ex: *"Salle de TP réseaux équipée de routeurs Cisco"*).

⚠️ **Format supporté** : `.jpg`, `.png`, `.svg` (optimisez la taille pour le web).

---

## **🔄 Compilation du LLM**
Pour appliquer vos modifications :
1. Exécutez le script de génération :
   ```bash
   python generate_data.py
   ```
2. Le fichier **`system-prompt.txt`** est généré dans **`/WebChat/config/`**.

✅ **Le modèle est prêt !**
*(Les étapes ci-dessus ne sont nécessaires que pour mettre à jour les informations.)*

---

## **🚀 Lancement du serveur**
1. **Ouvrez un terminal** et placez-vous dans `/WebChat`.
2. **Lancez Ollama** (dans un terminal séparé) :
   ```bash
   ollama run llama3.2
   ```
3. **Démarrez le serveur Node.js** :
   ```bash
   npm start
   ```
4. **Accédez à l'interface** :
   👉 [http://localhost:3000](http://localhost:3000)

---