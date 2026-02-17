/**
 * Transaction.js
 *
 * Append-only ledger of all credit operations.
 * Stored in MongoDB for scalability and immutability.
 */

module.exports = {

  datastore: 'mongoDb',

  attributes: {

    id: { type: 'string', columnName: '_id' },

    walletId: {
      type: 'number',
      required: true,
    },

    userId: {
      type: 'number',
      required: true,
      description: 'The customer who owns the wallet',
    },

    staffId: {
      type: 'number',
      allowNull: true,
      description: 'The staff member who performed the redemption (null for CREDIT type)',
    },

    barId: {
      type: 'number',
      required: true,
    },

    type: {
      type: 'string',
      isIn: ['CREDIT', 'DEBIT'],
      required: true,
    },

    amount: {
      type: 'number',
      required: true,
      isInteger: true,
      min: 1,
      description: 'Number of credits credited or debited',
    },

    pegSize: {
      type: 'number',
      allowNull: true,
      description: 'Peg size in ml (30/60/90) — only for DEBIT transactions',
    },

    brandName: {
      type: 'string',
      required: true,
    },

    balanceBefore: {
      type: 'number',
      required: true,
      description: 'Wallet balance before this transaction',
    },

    balanceAfter: {
      type: 'number',
      required: true,
      description: 'Wallet balance after this transaction',
    },

    note: {
      type: 'string',
      allowNull: true,
      defaultsTo: '',
    },

  },

};
