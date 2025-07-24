const express = require('express');
const {MongoClient, ObjectId} = require("mongodb");
const cors =require("cors");
const dotenv=require("dotenv");
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: '127.0.0.1',
  database: 'lootopia',
  password: 'root',
  port: 5432,
});

dotenv.config();

const app = express();
const port = 3334;
const mongoUri = "mongodb://127.0.0.1:27017";
const bcrypt = require('bcrypt');

app.use(express.json());
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

app.post("/signup",async (req,res) => {
    const { nickname,login,password,tel } = req.body;

    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(password, saltRounds);

        const result = await pool.query(
            'INSERT INTO compte (nickname,login,password,password_crypted,tel,is_partner) VALUES ($1, $2,$3,$4,$5,$6) RETURNING *',
            [nickname,login,password,hash,tel,false]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send('Erreur lors de l\'insertion');
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

app.post("/inscription/:participant/:chasse",async (req,res) => {
    const {participant,chasse} = req.params
    try {

    } catch (e) {
        console.error(err);
        res.status(500).send('Erreur lors de l\'inscription');
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
    const { titre,description,organisateur,monde,fin,nbreparticipantsmax,montant, delai } = req.body;

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
            "INSERT INTO chasse (titre,description,organisateur,monde,datefin,nbreparticipantsmax,montant,delai,statut,datecreation,nbclicks,nbvues) VALUES ($1, $2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *",
            [titre,description,rows.id,monde,fin,nbreparticipantsmax,montant,delai,"Actif",t,0,0]
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
      reqSQL ="SELECT ch.id,titre,description,organisateur,monde,datefin,nbreparticipantsmax,montant,delai,statut,nbclicks,nbvues FROM chasse ch join compte co on (organisateur = co.id)";
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

app.listen(port, () => {
    console.log(`Serveur backend sur http://localhost:${port}`)
})