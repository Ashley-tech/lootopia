// start/hooks.js
const mongoose = require('mongoose')
require('dotenv').config() // Charge les variables .env

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lootopia'

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connecté à :', mongoUri)
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur de connexion MongoDB :', err)
})
