'use strict'

const Env = use('Env')

module.exports = {
  connection: Env.get('MONGO_URI', 'mongodb://localhost:27017/mon_database')
}
