const express = require('express');
const {MongoClient, ObjectId} = require("mongodb");
const cors =require("cors");
const dotenv=require("dotenv");
const { Pool } = require('pg');
const fs = require("fs")
const path = require("path");
const Stripe = require('stripe');

dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
  user: process.env.PG_USER,
  host: '127.0.0.1',
  database: 'lootopia',
  password: process.env.PG_PWD,
  port: 5432,
});

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY)
const port = 3334;
const mongoUri = "mongodb://127.0.0.1:27017";
const bcrypt = require('bcrypt');

app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next(); // Ne pas parser en JSON ici
  } else {
    express.json()(req, res, next); // OK pour les autres routes
  }
});
app.use(cors());

const client = new MongoClient(mongoUri);

async function connecter() {
    try{
        await client.connect();
        console.log("Connexion réussie");
    } catch (error) {
        console.error("Echec de connexion :",error);
    }
}

connecter();

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Erreur de signature webhook', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ Gérer les événements ici
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('💰 Paiement réussi :', paymentIntent.id);
      // -> Mettre à jour ta BDD, envoyer un email, etc.
      break;
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      console.log('❌ Paiement échoué :', failedIntent.last_payment_error.message);
      break;
    // ... ajoute d’autres cas si besoin
    default:
      console.log(`📬 Événement non géré : ${event.type}`);
  }

  res.status(200).send(); // Stripe attend un 200 OK
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // en centimes, par exemple 1099 = 10.99 €
      currency,
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/data/mongodb/:collection",
    async (req,res) => {
        const {collection} = req.params;
        try{
            const db = client.db(process.env.BDD);
            const coll = db.collection(collection);
            const data = await coll.find().toArray();
            res.json(data);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
);

// Ajouter un document dans une collection
app.post("/data/mongodb/:collection", async (req, res) => {
    const { collection } = req.params;
    const newDocument = req.body; // Le document à insérer

    try {
        const db = client.db(process.env.BDD);
        const coll = db.collection(collection);
        const result = await coll.insertOne(newDocument);
        res.status(201).json({ succes: true, message: "Document ajouté", insertedId: result.insertedId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Modifier un document
app.put("/data/mongodb/:collection", async (req, res) => {
    const { collection } = req.params;
    const { whil, updatedDocument} = req.body; // Le document à insérer

    console.log("modif")
    try {
        const db = client.db(process.env.BDD);
        const coll = db.collection(collection);
        const result = await coll.updateOne(
            whil, 
            { $set: updatedDocument }
        );
        console.log(result)

        if (result.matchedCount === 0) {
            return res.status(404).json({ succes: false, message: "Document non trouvé" });
        }

        res.json({ succes: true, message: "Document mis à jour" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Supprimer un champ (attribut) d’un document par son ID
app.patch("/data/mongodb/:collection/remove-field", async (req, res) => {
    const { collection} = req.params;
    const { where, field } = req.body; // champ à supprimer

    if (!where || !field) {
        return res.status(400).json({ success: false, message: "Filtre et champ requis." });
    }

    try {
        const db = client.db(process.env.BDD);
        const coll = db.collection(collection);
        const result = await coll.updateOne(
            where,
            { $unset: { [field]: "" } }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ success: false, message: "Document non trouvé" });
        }

        res.json({ success: true, message: `Champ '${field}' supprimé.` });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post("/marketplace/send/:compte", async (req,res) => {
    const {compte} = req.params;
    const {nom,marque,sousmarque,type,effectif} = req.body;
    try {
        const r = await pool.query("INSERT INTO article (nom,marque,sousmarque,type_monnaie,nombre_monnaie,vendeur) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",[nom,marque,sousmarque,type,effectif,compte])
        res.json({ success: true, message: "Article vendu avec succès."});
    } catch (error) {
        console.error(error);
        res.status(500).send({success: false,message :'Erreur lors de la vente'});
    }
})

app.put("/marketplace/buy/:compte/:article", async (req,res) => {
    const {compte,article} = req.params;
    try {
        const result = await pool.query("SELECT nom,marque,sousmarque,type_monnaie,nombre_monnaie FROM article WHERE id="+article)
        const r = result.rows[0]
        const result0 = await pool.query("SELECT effectif FROM credit_compte WHERE compte="+compte+" AND type_monnaie='"+r.type_monnaie+"'")
        const r0 = result0.rows[0]
        if (r0.effectif < r.nombre_monnaie){
            res.status(403).json({success:false,message: "Pas assez d'argent pour acheter cette article"})
        }
        const r1 = await pool.query("UPDATE credit_compte SET effectif = effectif - "+r.nombre_monnaie+" WHERE compte="+compte+" AND type_monnaie='"+r.type_monnaie+"'")
        const r2 = await pool.query("INSERT INTO article_achete (article,acheteur) VALUES ($1,$2) RETURNING *",[article,compte])
        res.status(200).json({ success: true, message: "Article acheté avec succès."});
    } catch (error) {
        console.error(error);
        res.status(500).send({success: false,message :"Erreur lors de l'achat"});
    }
})

app.post("/email/search",async (req,res) => {
    const { login } = req.body;

    try {
        // Récupérer l'utilisateur par email
        const r = await pool.query(
            'SELECT * FROM compte WHERE login = $1',
            [login]
        );

        if (r.rows.length == 0 || r.rows[0].is_deleted == true) {
            return res.status(404).send({success: false,message :'Compte non trouvé'});
        }
        res.status(200).send({success: true,message: 'Compte trouvé'});
    } catch (err) {
        console.error(err);
        res.status(500).send({success: false,message :err.message});
    }
})

app.post("/:email/password/update",async (req,res) => {
    const { pwd } = req.body;
    const { email } = req.params;

    try {
        // Récupérer l'utilisateur par email
        const saltRounds = 10;
        const hash = await bcrypt.hash(pwd, saltRounds);
        const r = await pool.query(
            'UPDATE compte SET password = $1, password_crypted=$2 WHERE login = $3',
            [pwd,hash,email]
        );
        res.status(200).send({success: true,message :"Mot de passe modifié avec succès"});
    } catch (err) {
        console.error(err);
        res.status(500).send({success: false,message :err.message});
    }
})

app.post("/signup",async (req,res) => {
    const { nickname,login,password,tel } = req.body;

    try {
        // Récupérer l'utilisateur par email
        const r = await pool.query(
            'SELECT * FROM compte WHERE login = $1 OR nickname = $2',
            [login,nickname]
        );

        console.log(r.rows.length)

        if (r.rows.length != 0 && r.rows[0].is_deleted == false) {
            return res.send({success: false,message :'Compte déjà existant'});
        }

        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        let result;
        if (r.rows.length == 0){
          result = await pool.query(
              'INSERT INTO compte (nickname,login,password,password_crypted,tel,is_partner) VALUES ($1, $2,$3,$4,$5,$6) RETURNING *',
              [nickname,login,password,hash,tel,false]
          );
        }else {
          result = await pool.query("UPDATE compte SET is_deleted = false, nickname = '"+nickname+"', password = '"+password+"', password_crypted='"+hash+"', tel='"+tel+"' WHERE id = "+r.rows[0].id+" WHERE login = '"+login+"' RETURNING *")
        }

        const result0 = await pool.query(
            "SELECT id from compte where nickname='"+nickname+"'"
        );
        const idc = result0.rows[0]
        
        const r2 = await fetch ("http://127.0.0.1:3334/data/mongodb/monnaie")
        const ro2 = await r2.json()
          if (r.rows.length == 0){
        ro2.forEach(async m => {
                let result = await pool.query(
                    'INSERT INTO credit_compte (compte,type_monnaie) VALUES ($1, $2) RETURNING *',
                    [idc.id , m.nom]
                );
          })
              }
        res.status(200).send({success: true,result: result.rows[0]});
    } catch (err) {
        console.error(err);
        res.status(500).send({success: false,message :'Erreur lors de l\'insertion'});
    }
})

app.put("/modify/:acc", async (req, res) => {
    const{acc} = req.params
    const {nickname,login,password,tel} = req.body;
    try{
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            "UPDATE compte SET nickname = '"+nickname+"', login = '"+login+"', password = '"+password+"', password_crypted='"+hash+"', tel='"+tel+"' WHERE id = "+acc+" RETURNING *"
        );
        res.status(200).send({success: true,message :'Modification du compte réussie'});
    }catch (error){
        console.error(error);
        res.status(500).send({success: false,message :'Erreur lors de la modification du compte'});
    }
})

app.put("/shop/pay/:compte", async (req, res) => {
    const { monnaie, effectif} = req.body;
    const {compte} = req.params;
    try {
        const rdm = await fetch("http://127.0.0.1:3334/data/mongodb/monnaie")
        const rdmj = await rdm.json()
        const indexm = rdmj.findIndex(obj => obj.nom == monnaie)
        const prixtotal = rdmj[indexm].montant * effectif

        const rdmp = await pool.query("UPDATE credit_compte SET effectif = effectif + "+effectif+" WHERE compte="+compte+" AND type_monnaie = '"+monnaie+"'")

        const rhis = await pool.query("INSERT INTO transaction (compte, monnaie, effectif, prixUnite,prixtotal) VALUES ($1,$2,$3,$4,$5) RETURNING *",[compte,monnaie, effectif,rdmj[indexm].montant,prixtotal])
        res.status(200).json({success: true, message: "Transaction success"})
    }catch (error){
        res.status(500).json({success: false, message: "Transaction failed : "+error})
    }
})

app.post('/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    // Récupérer l'utilisateur par email
    const result = await pool.query(
      'SELECT * FROM compte WHERE login = $1',
      [login]
    );

    if (result.rows.length === 0) {
      return res.status(401).send({success: false,message :'Email non trouvé'});
    }

    const utilisateur = result.rows[0];

    // Comparer les mots de passe
    const estValide = await bcrypt.compare(password, utilisateur.password_crypted);

    if (!estValide) {
      return res.status(401).send({success: false,message :'Mot de passe incorrect'});
    }

    if (result.rows[0].is_deleted == true) {
      return res.status(401).send({success: false,message :'Compte supprimé'});
    }

    // Connexion réussie
    return res.status(200).send({success: true,message:"Connexon réussie"});
  } catch (err) {
    return res.status(500).send({success: false,message :err})
  }
});

// Modifier un document par son ID
app.put("/data/mongodb/:collection/:id", async (req, res) => {
    const { collection, id } = req.params;
    const updatedDocument = req.body; // Données mises à jour
    console.log("supp",updatedDocument+" "+id)

    try {
        const db = client.db(process.env.BDD);
        const coll = db.collection(collection);
        const result = await coll.updateOne(
            { ID: id }, 
            { $set: updatedDocument }
        );
        console.log(result)

        if (result.matchedCount === 0) {
            return res.status(404).json({ succes: false, message: "Document non trouvé" });
        }

        res.json({ succes: true, message: "Document mis à jour" });
    } catch (error) {
        res.status(500).json({ succes: false, error: error.message });
    }
});

app.get("/inscription/:participant/:chasse",async (req,res) => {
    const {participant,chasse} = req.params
    try {
        const result = await pool.query("INSERT INTO participation (joueur,chasse) VALUES ($1,$2) RETURNING *",[participant,chasse]);
        res.status(201).json({success:true,message:"Inscription réussie"})
    } catch (e) {
        res.status(500).json({success:false,message:"Inscription échouée : "+e})
    }
})

app.put("/chasse/:id/click",async(req,res) => {
    const {id} = req.params;
    try{
        const reqSQL = "UPDATE chasse SET nbclicks = nbclicks + 1 WHERE id="+id
        const result = await pool.query(reqSQL);
        res.status(201).json({succes:true,message:"Incrémentation réussie"})
    } catch (erreur) {
        res.status(500).json({succes:false,message:"Echec de l'incrémentation : "+erreur})
    }
})

app.put("/chasse/:id/vues",async(req,res) => {
    const {id} = req.params;
    try{
        const reqSQL = "UPDATE chasse SET nbvues = nbvues + 1 WHERE id="+id
        const result = await pool.query(reqSQL);
        res.status(201).json({succes:true,message:"Incrémentation réussie"})
    } catch (erreur) {
        res.status(500).json({succes:false,message:"Echec de l'incrémentation : "+erreur})
    }
})

app.post("/chasse",async (req,res) => {
    const { titre,description,organisateur,monde,fin,nbreparticipantsmax,montant, delai,marque,banniere,latitude,longitude } = req.body;

    try {
        const reqSQL ="SELECT id FROM compte where login='"+organisateur+"'";
      const result0 = await pool.query(reqSQL);
      const rows = result0.rows[0];

        const d = new Date()
        let month,day;
            if (d.getMonth() + 1 < 10){
                month = "0"+(d.getMonth()+1).toString()
            } else {
                month = (d.getMonth()+1).toString()
            }

            if (d.getDate() < 10){
                day = "0"+d.getDate().toString()
            } else {
                day = d.getDate().toString()
            }
        const t = d.getFullYear()+"-"+month+"-"+day
        console.log(t)
        console.log("datefin",fin)

        const result = await pool.query(
            "INSERT INTO chasse (titre,description,organisateur,monde,datefin,nbreparticipantsmax,montant,delai,statut,datecreation,nbclicks,nbvues,brand,url_banniere,latitude,longitude) VALUES ($1, $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *",
            [titre,description,rows.id,monde,fin,nbreparticipantsmax,montant,delai,"Actif",t,0,0,marque,banniere,latitude,longitude]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de l\'ajout de la chasse');
    }
})

app.get("/chasse/:id/nbreparticipants",async (req,res) => {
    const {id} = req.params;
    let nb = 0;
    try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM participation WHERE chasse = $1',
      [id]
    );
    const nb = parseInt(result.rows[0].count, 10);
    return res.status(200).json({ nombre: nb });
  } catch (error) {
    console.error("Erreur de base de données :", error);
    return res.status(500).json({ nombre: 0 });
  }
})

app.get('/data/postgresql/:table', async (req, res) => {
    const { table } = req.params;
  try {
    let reqSQL;
    if (table == "chasse") {
      reqSQL ="SELECT ch.id,titre,description,organisateur,monde,datefin,nbreparticipantsmax,montant,delai,statut,nbclicks,nbvues,datecreation,brand,url_banniere,latitude,longitude FROM chasse ch join compte co on (organisateur = co.id)";
      const result = await pool.query(reqSQL);
      const rows = result.rows;

      // On remplace l'ID de l'organisateur par le compte complet
      const rowsWithOrganisateur = await Promise.all(rows.map(async (row) => {
        const compteResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.organisateur]);
        row.organisateur = compteResult.rows[0]; // Remplace l'ID par l'objet compte
        return row;
      }));

      res.json(rowsWithOrganisateur);
    } else if (table == "participation"){
        reqSQL = 'SELECT * FROM participation';
        const result = await pool.query(reqSQL);
        const rows = result.rows;

        const rowsWithRelations = await Promise.all(rows.map(async (row) => {
            // Remplacement de joueur
            const joueurResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.joueur]);
            row.joueur = joueurResult.rows[0];

            // Remplacement de chasse
            const chasseResult = await pool.query('SELECT * FROM chasse WHERE id = $1', [row.chasse]);
            row.chasse = chasseResult.rows[0];

            return row;
        }));

        res.json(rowsWithRelations);
    } else if (table == "article_achete") {
        reqSQL = 'SELECT * FROM article_achete';
        const result = await pool.query(reqSQL);
        const rows = result.rows;

        const rowsWithRelations = await Promise.all(rows.map(async (row) => {
            // Remplacement de joueur
            const acheteurResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.acheteur]);
            row.acheteur = acheteurResult.rows[0];

            // Remplacement de chasse
            const articleResult = await pool.query('SELECT * FROM article WHERE id = $1', [row.article]);
            row.article = articleResult.rows[0];

            const vResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.article.vendeur]);
            row.article.vendeur = acheteurResult.rows[0];

            return row;
        }));

        res.json(rowsWithRelations);
    } else if (table == "article") {
        reqSQL ="SELECT a.id,nom,marque,sousmarque,type_monnaie,nombre_monnaie,vendeur FROM article a join compte co on (vendeur = co.id)";
      const result = await pool.query(reqSQL);
      const rows = result.rows;

      const rowsWithVendeur = await Promise.all(rows.map(async (row) => {
        const compteResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.vendeur]);
        row.vendeur = compteResult.rows[0]; // Remplace l'ID par l'objet compte
        return row;
      }));

      res.json(rowsWithVendeur)
    } else if (table == "credit_compte") {
        reqSQL ="SELECT compte,type_monnaie,effectif FROM credit_compte";
      const result = await pool.query(reqSQL);
      const rows = result.rows;

      const rowsWithCC = await Promise.all(rows.map(async (row) => {
        const compteResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.compte]);
        row.compte = compteResult.rows[0]; // Remplace l'ID par l'objet compte
        return row;
      }));

      res.json(rowsWithCC)
    } else if (table == "transaction") {
        reqSQL ="SELECT * FROM transaction";
      const result = await pool.query(reqSQL);
      const rows = result.rows;

      const rowsWithCT = await Promise.all(rows.map(async (row) => {
        const compteResult = await pool.query('SELECT * FROM compte WHERE id = $1', [row.compte]);
        row.compte = compteResult.rows[0]; // Remplace l'ID par l'objet compte
        return row;
      }));

      res.json(rowsWithCT)
    } else {
      reqSQL = 'SELECT * FROM ' + table;
      const result = await pool.query(reqSQL);
      res.json(result.rows);
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur lors de la récupération des données');
  }
});


// Supprimer un document par son ID
app.delete("/data/mongodb/:database/:collection/:id", async (req, res) => {
    const { database, collection, id } = req.params;

    try {
        const db = client.db(database);
        const coll = db.collection(collection);
        const result = await coll.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ succes: false, message: "Document non trouvé" });
        }

        res.json({ succes: true, message: "Document supprimé" });
    } catch (error) {
        res.status(500).json({succes: false,  error: error.message });
    }
});

const sendEmail = require("./mailService");

// Route pour envoyer un e-mail
app.post("/send-email", async (req, res) => {
    const { from, to, subject, text } = req.body;
    console.log({ from, to, subject, text });

    if (!to || !subject || !text) {
        return res.status(400).json({ success: false, message: "Tous les champs sont obligatoires" });
    }

    const response = await sendEmail(from, to, subject, text);
    res.json(response);
});

app.use('/partenaires', express.static(path.join(__dirname, '../public/partenaires')))

app.get('/partenaires/images/extensions', (req, res) => {
  const dirPath = path.join(__dirname, '../public/partenaires')

  // Vérifie si le dossier existe
  if (!fs.existsSync(dirPath)) {
    return res.status(404).send('Dossier non trouvé')
  }

  // Filtre les images
  const files = fs.readdirSync(dirPath).filter(file =>
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
  )

  // Construit les URLs accessibles depuis le front
  const urls = files.map(file => file)

  res.json(urls)
})

app.get('/partenaires/images', (req, res) => {
  const dirPath = path.join(__dirname, '../public/partenaires')

  if (!fs.existsSync(dirPath)) {
    return res.status(404).send('Dossier non trouvé')
  }

  const files = fs.readdirSync(dirPath).filter(file =>
    /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
  )

  // Retire les extensions des noms
  const imageNames = files.map(file => path.parse(file).name)

  res.json(imageNames)
})

app.listen(port, () => {
    console.log(`Serveur backend sur http://localhost:${port}`)
})