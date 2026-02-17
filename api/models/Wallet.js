/**
 * Wallet.js
 *
 * One wallet per bottle purchase. Credits are 1:1 with ml.
 * Credits are locked to a specific bar and brand.
 * Stored in MySQL (default datastore).
 */

module.exports = {

  attributes: {

    brandName: {
      type: 'string',
      required: true,
      maxLength: 200,
    },

    totalCredits: {
      type: 'number',
      required: true,
      isInteger: true,
      min: 1,
      description: 'Total credits (= total ml of bottle)',
    },

    remainingCredits: {
      type: 'number',
      required: true,
      isInteger: true,
      min: 0,
      description: 'Remaining credits available for redemption',
    },

    status: {
      type: 'string',
      isIn: ['active', 'exhausted'],
      defaultsTo: 'active',
    },

    // Associations
    owner: {
      model: 'user',
      required: true,
    },

    bar: {
      model: 'bar',
      required: true,
    },

    bottlePlan: {
      model: 'bottleplan',
      required: true,
    },

    qrTokens: {
      collection: 'qrtoken',
      via: 'wallet',
    },

  },

};
