const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'PawUp API',
    description: 'restful API for PawUp Application',
    version: '1.0'
  },
  host: process.env.SERVER_PORT
};

const outputFile = './swagger-output.json'
const routes = ['app.js']

/* if using express router, only pass in the root file 
where the route starts ie index.js, app.js, routes.js etc */
swaggerAutogen(outputFile, routes, doc)