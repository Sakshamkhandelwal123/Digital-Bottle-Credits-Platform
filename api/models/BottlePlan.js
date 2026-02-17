/**
 * BottlePlan.js
 *
 * Represents a purchasable bottle plan at a specific bar.
 * Stored in MySQL (default datastore).
 */

module.exports = {

  attributes: {

    brandName: {
      type: 'string',
      required: true,
      maxLength: 200,
    },

    category: {
      type: 'string',
      isIn: ['whisky', 'vodka', 'rum', 'gin', 'tequila', 'wine', 'beer', 'other'],
      defaultsTo: 'other',
    },

    totalMl: {
      type: 'number',
      required: true,
      isInteger: true,
      min: 1,
      description: 'Total ml in the bottle (e.g. 750)',
    },

    price: {
      type: 'number',
      required: true,
      min: 0,
      description: 'Price in currency units',
    },

    isActive: {
      type: 'boolean',
      defaultsTo: true,
    },

    // Associations
    bar: {
      model: 'bar',
      required: true,
    },

    wallets: {
      collection: 'wallet',
      via: 'bottlePlan',
    },

  },

};
