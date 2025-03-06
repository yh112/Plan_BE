const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");
const path = require("path");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Weekly Plan API",
      description: "Weekly Plan Web App RESTful API Documentation",
      contact: {
        name: "Yihyun",
        email: "msh7377@gmail.com",
      },
      version: "1.0.0",
    },
    servers: [
      {
        url: "http://localhost:4000",
        description: "Local Development",
      },
    ],
  },
  apis: [path.join(__dirname, "../routes/*.js")],
};
const specs = swaggerJsdoc(options);

console.log(__dirname)

module.exports = {
  swaggerUi,
  specs,
};
