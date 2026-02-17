/**
 * Bar.js
 *
 * Represents a bar/lounge venue on the platform.
 * Stored in MySQL (default datastore).
 */

module.exports = {

  attributes: {

    name: {
      type: 'string',
      required: true,
      maxLength: 200,
    },

    address: {
      type: 'string',
      required: true,
    },

    city: {
      type: 'string',
      required: true,
      maxLength: 100,
    },

    phone: {
      type: 'string',
      allowNull: true,
      maxLength: 15,
    },

    licenseNumber: {
      type: 'string',
      allowNull: true,
      maxLength: 100,
      description: 'Liquor license number for the bar',
    },

    isActive: {
      type: 'boolean',
      defaultsTo: true,
    },

    // Associations
    bottlePlans: {
      collection: 'bottleplan',
      via: 'bar',
    },

    wallets: {
      collection: 'wallet',
      via: 'bar',
    },

  },

};
