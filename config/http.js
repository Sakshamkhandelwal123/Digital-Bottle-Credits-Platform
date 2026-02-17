/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Configuration for the underlying HTTP server in Sails.
 * Includes Swagger UI middleware at /api-docs.
 */

const swaggerUi = require('swagger-ui-express');

module.exports.http = {

  middleware: {

    order: [
      'cookieParser',
      'session',
      'bodyParser',
      'compress',
      'poweredBy',
      'swaggerUi',
      'router',
      'www',
      'favicon',
    ],

    swaggerUi: (function () {
      const swaggerSpec = require('./swagger').swagger;

      const router = require('express').Router();

      // Serve the raw OpenAPI JSON spec
      router.get('/api-docs.json', (req, res) => {
        res.json(swaggerSpec);
      });

      // Serve Swagger UI
      router.use(
        '/api-docs',
        swaggerUi.serve,
        swaggerUi.setup(swaggerSpec, {
          customCss: '.swagger-ui .topbar { display: none }',
          customSiteTitle: 'Bottle Credits API Docs',
          swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
            defaultModelsExpandDepth: 2,
          },
        })
      );

      return router;
    })(),

  },

};
