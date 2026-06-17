const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LabInsight API',
      version: '1.0.0',
      description: 'API documentation for LabInsight - Lab Report Analysis Application',
      contact: {
        name: 'LabInsight Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Profile',
        description: 'User profile management'
      },
      {
        name: 'Upload',
        description: 'File upload and report management'
      },
      {
        name: 'Admin',
        description: 'Admin user management'
      },
      {
        name: 'Admin Dashboard',
        description: 'Admin dashboard statistics'
      },
      {
        name: 'Admin Reports',
        description: 'Admin report management'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const specs = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LabInsight API Docs'
  }));

  // Serve raw JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};

module.exports = setupSwagger;
