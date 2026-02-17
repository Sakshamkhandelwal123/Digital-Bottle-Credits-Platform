/**
 * Default model settings
 * (sails.config.models)
 */

module.exports.models = {

  schema: true,

  migrate: 'alter',

  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true },
    updatedAt: { type: 'number', autoUpdatedAt: true },
    id: { type: 'number', autoIncrement: true },
  },

  dataEncryptionKeys: {
    default: process.env.DATA_ENCRYPTION_KEY || 'eG+6osD23jYy4zv1erEtAd5sUCd1MGcwIo2G6CkvBbE='
  },

  cascadeOnDestroy: true,

};
