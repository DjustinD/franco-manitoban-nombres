# Français-Nombres 🇨🇦

Un outil interactif pour apprendre les nombres en français (Canada) de 1 à 100.

This interactive web application is designed to help learners master French numbers through auditory, oral, and written practice. It is specifically optimized for **French-Canadian (fr-CA)** phonetics and the regional counting standards used in Québec and Manitoba.

## 🚀 Fonctionnalités (Features)

L'application propose trois modules d'apprentissage dynamiques :

1.  **Écouter (Listen):** Le système prononce le nombre pour une immersion auditive, puis utilise la reconnaissance vocale pour s'assurer que vous le répétez correctement afin de valider l'engagement.
2.  **Lire (Read):** Un test de lecture à voix haute. Identifiez les chiffres et prononcez-les pour passer au nombre suivant.
3.  **Épeler (Spell):** Un test d'orthographe (Dictée). Écoutez le nombre et tapez-le correctement. Comprend un bouton **"Montrer"** (Reveal) si vous avez besoin d'aide avec l'orthographe.

### Nouvelles fonctionnalités :
* **Sélecteur de Difficulté :** Choisissez entre Facile (1-20), Moyen (1-50) ou Difficile (1-100).
* **Suivi du Score :** Suivez votre progression avec un compteur de bonnes réponses et une barre de "Streak" (série de succès).
* **Bouton Passer (Skip) :** Si un nombre est trop difficile, utilisez le bouton **"Passer"** pour continuer sans bloquer votre session.
* **Indicateur Micro :** Un indicateur visuel vous indique exactement quand le système est en attente de votre voix.

## 🛠️ Technologies

* **HTML5 / CSS3** : Interface moderne avec des animations de feedback visuel.
* **JavaScript (ES6+)** : Logique asynchrone pour gérer les cycles de parole et d'écoute.
* **Web Speech API** : 
    * `SpeechSynthesis` : Sortie vocale native fr-CA.
    * `SpeechRecognition` : Validation de la prononciation en temps réel.

## 🌍 Utilisation (Usage)

Cette application est optimisée pour **GitHub Pages**.

1.  Ouvrez l'application dans un navigateur moderne (**Chrome** ou **Edge** recommandés).
2.  Autorisez l'accès au **microphone** (nécessaire pour les modules Écouter et Lire).
3.  Sélectionnez votre niveau de difficulté et commencez à pratiquer !

## 🇨🇦 Contexte Régional (Franco-Manitobain)

Contrairement au français européen, cet outil utilise exclusivement :
* Le système de comptage canadien : **soixante-dix** (70) et **quatre-vingt-dix** (90).
* Des voix système configurées sur `fr-CA` pour une prononciation authentique.

---
*Développé pour soutenir la communauté franco-manitobaine et les apprenants du français au Canada.*
