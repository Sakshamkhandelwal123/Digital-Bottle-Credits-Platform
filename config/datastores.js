/**
 * Datastores
 * (sails.config.datastores)
 *
 * MySQL: default datastore for relational data (Users, BottlePlans, Wallets, QrTokens)
 * MongoDB: secondary datastore for append-only transaction ledger
 */

const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/bottle_credits';
const isLocalMongo = mongoUrl.includes('localhost') || mongoUrl.includes('127.0.0.1');

// Build MongoDB datastore config
const mongoConfig = {
  adapter: 'sails-mongo',
};

if (!isLocalMongo) {
  // For cloud MongoDB (Atlas, Railway, etc.):
  // 1. Inject tls=true directly into the URL to guarantee the driver sees it
  // 2. Also pass TLS options at the config level as a safety net
  let cloudUrl = mongoUrl;
  if (!cloudUrl.includes('tls=') && !cloudUrl.includes('ssl=')) {
    cloudUrl += (cloudUrl.includes('?') ? '&' : '?') + 'tls=true';
  }
  mongoConfig.url = cloudUrl;
  mongoConfig.tls = true;
  mongoConfig.tlsInsecure = true;
  mongoConfig.serverSelectionTimeoutMS = 30000;
  mongoConfig.connectTimeoutMS = 30000;
} else {
  mongoConfig.url = mongoUrl;
}

module.exports.datastores = {

  default: {
    adapter: 'sails-mysql',
    url: process.env.MYSQL_URL || 'mysql://root:password@localhost:3306/bottle_credits',
  },

  mongoDb: mongoConfig,

};
