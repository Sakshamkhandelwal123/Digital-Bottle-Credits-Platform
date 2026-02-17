/**
 * generate-jwt
 *
 * Generate a JWT token for a user.
 *
 * Usage: const token = await sails.helpers.generateJwt(user);
 */

const jwt = require('jsonwebtoken');

module.exports = {

  friendlyName: 'Generate JWT',

  description: 'Generate a JSON Web Token for a given user.',

  inputs: {
    user: {
      type: 'ref',
      required: true,
      description: 'The user object to generate a token for.',
    },
  },

  fn: async function (inputs) {
    const token = jwt.sign(
      { id: inputs.user.id, role: inputs.user.role },
      sails.config.custom.jwtSecret,
      { expiresIn: sails.config.custom.jwtExpiresIn }
    );
    return token;
  },

};
