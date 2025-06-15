const express = require('express');
const {MongoClient, ObjectId} = require("mongodb");
const cors =require("cors");
const dotenv=require("dotenv");

dotenv.config();

const app = express();
const port = 3334;
const mongoUri = "mongodb://127.0.0.1:27017";

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

app.get("/data/:database/:collection",
    async (req,res) => {
        const {database,collection} = req.params;
        try{
            const db = client.db(database);
            const coll = db.collection(collection);
            const data = await coll.find().toArray();
            res.json(data);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }
);

// Ajouter un document dans une collection
app.post("/data/:database/:collection", async (req, res) => {
    const { database, collection } = req.params;
    const newDocument = req.body; // Le document à insérer

    try {
        const db = client.db(database);
        const coll = db.collection(collection);
        const result = await coll.insertOne(newDocument);
        res.status(201).json({ succes: true, message: "Document ajouté", insertedId: result.insertedId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Modifier un document
app.put("/data/:database/:collection", async (req, res) => {
    const { database, collection } = req.params;
    const { whil, updatedDocument} = req.body; // Le document à insérer

    console.log("modif")
    try {
        const db = client.db(database);
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
app.patch("/data/:database/:collection/remove-field", async (req, res) => {
    const { database, collection} = req.params;
    const { where, field } = req.body; // champ à supprimer

    if (!where || !field) {
        return res.status(400).json({ success: false, message: "Filtre et champ requis." });
    }

    try {
        const db = client.db(database);
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


// Modifier un document par son ID
app.put("/data/:database/:collection/:id", async (req, res) => {
    const { database, collection, id } = req.params;
    const updatedDocument = req.body; // Données mises à jour
    console.log("supp",updatedDocument+" "+id)

    try {
        const db = client.db(database);
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

// Supprimer un document par son ID
app.delete("/data/:database/:collection/:id", async (req, res) => {
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