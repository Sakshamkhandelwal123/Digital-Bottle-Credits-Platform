/**
 * HTTP Server Settings
 * (sails.config.http)
 *
 * Includes Swagger UI middleware at /api-docs and
 * static file serving from /assets.
 */

const swaggerUi = require('swagger-ui-express');
const path = require('path');
const express = require('express');

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
      const router = express.Router();

      router.get('/api-docs.json', (req, res) => {
        res.json(swaggerSpec);
      });

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

    www: express.static(path.resolve(__dirname, '..', 'assets')),

  },

};
