# Français-Nombres 🇨🇦

Un outil interactif pour apprendre les nombres en français (Canada) de 1 à 100.

This interactive web application is designed to help learners master French numbers through auditory, oral, and written practice. It uses the **Web Speech API** to provide a native French-Canadian (fr-CA) experience, specifically optimized for the regional accents found in Québec and Manitoba.

## 🚀 Fonctionnalités (Features)

L'application est divisée en trois modules d'apprentissage :

1.  **Écouter (Listen):** Le système prononce le nombre 5 fois pour une immersion auditive, puis vous demande de le répéter 5 fois pour pratiquer la prononciation.
2.  **Lire (Read):** Un test de lecture à voix haute. Le système utilise la reconnaissance vocale pour valider votre prononciation.
3.  **Épeler (Spell):** Un test d'orthographe. Écoutez le nombre et tapez-le correctement en toutes lettres.

## 🛠️ Technologies

* **HTML5 / CSS3** : Interface épurée et responsive.
* **JavaScript (ES6+)** : Logique de l'application et gestion des modules.
* **Web Speech API** : 
    * `SpeechSynthesis` pour la sortie vocale (Voix franco-canadienne).
    * `SpeechRecognition` pour l'analyse de la parole en temps réel.

## 🌍 Utilisation (Usage)

Cette application est hébergée sur **GitHub Pages**.

1. Naviguez vers l'URL de votre projet.
2. Autorisez l'accès au **microphone** dans votre navigateur (requis pour les modules "Écouter" et "Lire").
3. Choisissez votre module dans la barre de navigation supérieure.

> **Note :** Pour une expérience optimale, utilisez un navigateur moderne comme **Google Chrome** ou **Microsoft Edge**, qui offrent le meilleur support pour la reconnaissance vocale franco-canadienne.

## 🇨🇦 Contexte Régional

Contrairement aux méthodes d'apprentissage traditionnelles basées sur le français de France, cet outil se concentre sur le **français canadien**. 
* Utilise le système de comptage standard canadien (*soixante-dix*, *quatre-vingt-dix*).
* Priorise les voix système `fr-CA`.

---
*Développé pour l'apprentissage autonome du français au Manitoba.*
