const mongoose = require('mongoose')
const Config = use('Config')

mongoose.connect(Config.get('mongodb.connection'), {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB connecté avec succès !')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Erreur de connexion MongoDB :', err)
})
