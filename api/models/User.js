/**
 * User.js
 *
 * A user of the platform: customer, bar staff, or bar admin.
 * Stored in MySQL (default datastore).
 */

module.exports = {

  attributes: {

    phone: {
      type: 'string',
      required: true,
      unique: true,
      maxLength: 15,
    },

    name: {
      type: 'string',
      required: true,
      maxLength: 100,
    },

    email: {
      type: 'string',
      isEmail: true,
      allowNull: true,
    },

    password: {
      type: 'string',
      required: true,
    },

    role: {
      type: 'string',
      isIn: ['customer', 'staff', 'admin'],
      defaultsTo: 'customer',
    },

    barId: {
      type: 'number',
      allowNull: true,
      description: 'The bar this user belongs to (for staff and admin roles)',
    },

    // Associations
    wallets: {
      collection: 'wallet',
      via: 'owner',
    },

  },

  customToJSON: function () {
    return _.omit(this, ['password']);
  },

  beforeCreate: async function (values, proceed) {
    const bcrypt = require('bcryptjs');
    try {
      const hash = await bcrypt.hash(values.password, 10);
      values.password = hash;
      return proceed();
    } catch (err) {
      return proceed(err);
    }
  },

  beforeUpdate: async function (values, proceed) {
    if (values.password) {
      const bcrypt = require('bcryptjs');
      try {
        const hash = await bcrypt.hash(values.password, 10);
        values.password = hash;
        return proceed();
      } catch (err) {
        return proceed(err);
      }
    }
    return proceed();
  },

};
