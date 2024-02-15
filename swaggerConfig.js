// swaggerConfig.js

module.exports = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Your API Mine",
      version: "1.0.0",
      description: "Your API description",
    },
  },
  apis: ["app.js"], // Point to the file(s) where your routes are defined
  paths: {
    "/sample": {
      get: {
        summary: "Get sample data",
        description: "Retrieve sample data for demonstration",
        responses: {
          200: {
            description: "Successful response",
            content: {
              "application/json": {
                example: { message: "Sample data retrieved" },
              },
            },
          },
        },
      },
    },
  },
};
