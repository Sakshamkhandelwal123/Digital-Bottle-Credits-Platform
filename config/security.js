/**
 * Security Settings
 * (sails.config.security)
 */

module.exports.security = {

  cors: {
    allRoutes: true,
    allowOrigins: '*',
    allowCredentials: false,
    allowRequestHeaders: 'content-type, authorization',
    allowRequestMethods: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  },

  csrf: false,

};
