/**
 * Datastores
 * (sails.config.datastores)
 *
 * MySQL: default datastore for relational data (Users, BottlePlans, Wallets, QrTokens)
 * MongoDB: secondary datastore for append-only transaction ledger
 */

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/bottle_credits';
const isLocalMongo = mongoUrl.includes('localhost') || mongoUrl.includes('127.0.0.1');

module.exports.datastores = {

  default: {
    adapter: 'sails-mysql',
    url: process.env.MYSQL_URL || 'mysql://root:password@localhost:3306/bottle_credits',
  },

  mongoDb: {
    adapter: 'sails-mongo',
    url: mongoUrl,
    // Cloud MongoDB (Atlas, Render, Railway) requires SSL/TLS.
    // Automatically enable it when not connecting to localhost.
    ...(!isLocalMongo && {
      ssl: true,
    }),
  },

};
