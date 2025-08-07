git clone http://github.com/Ashley-tech/lootopia.git
cd lootopia
npm install
cd back (pour accéder au projet back-end)
npm install

1) Pour démarrer le projet back-end : node server.js
2) Pour démarrer le projet : npm start ou node server.js
3) Pour démarrer le projet backlog : cd backlog && php -S 127.0.0.1:3332

PostgreSQL :
Créer la base de données "lootopia" et importe le script datas/postgres/script_create.sql. Les identifiants de connexion sont dans back/.env.local

MongoDB :
Créer la base de données "lootopia" avec comme collections : "cache","monnaie","plan","recompense"

API Key Map :
Lien vidéo : https://www.youtube.com/watch?v=OY60sAsPqos
ou
Instructions :
1) Aller sur le site de Google Cloud
2) Si tu n'es pas connecté à un compte, tu peux utiliser ton compte Google.
3) Va dans la rubrique Console
4) Crée toi un nouveau projet en cliquant sur le bouton du nom de projet à côté du logo de Google Cloud en haut à gauche de l'écran
5) Options (icône des 3 barres horizontales tout en haut à gauche) > API et Services > API et Services activés
6) Clique sur le bouton "+ Activer les APIs et les services"
7) Sélectionne Maps JavaScript API et active-le si ce n'est pas déjà fait
8) Options > API et Services > Identifiants
9) Clique sur le bouton "+ Créer des identifiants" > Clé API
10) Cela t'ouvre une fenêtre et t'affiche une clé API
11) N'oublie surtout pas de copier cette clé
12) Définir MAP_API_KEY avec cette clé dans .env du front

Stripe :
1) Se connecter à Stripe
2) Dans la barre latéral gauche, "Développeurs" -> "Clés API" -> Récupérer la clé secret 'sk_test_...' et la clé publique 'pk_test_...' pour les affecter à process.env.STRIPE_SECRET_KEY et process.env.STRIPE_PUBLISHABLE_KEY
3) Ensuite, aller sur https://stripe.com/docs/stripe-cli pour télcharger Stripe CLI
4) stripe login -> Une clé spécifique pour ton ordinateur sera générée
5) stripe listen --forward-to [hote]:[port]/webhook
6) Une clé commencant par 'whsec...' est générée et affecte le à process.env.STRIPE_WEBHOOK_SECRET
