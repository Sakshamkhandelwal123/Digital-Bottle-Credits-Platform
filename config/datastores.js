/**
 * Datastores
 * (sails.config.datastores)
 *
 * MySQL: default datastore for relational data (Users, BottlePlans, Wallets, QrTokens)
 * MongoDB: secondary datastore for append-only transaction ledger
 */

module.exports.datastores = {

  default: {
    adapter: 'sails-mysql',
    url: process.env.MYSQL_URL || 'mysql://root:password@localhost:3306/bottle_credits',
  },

  mongoDb: {
    adapter: 'sails-mongo',
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/bottle_credits',
  },

};
