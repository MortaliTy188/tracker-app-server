// Конфигурация Swagger для документации API
const swaggerJsdoc = require("swagger-jsdoc");

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Tracker App API",
      version: "1.0.0",
      description: "API для приложения отслеживания навыков",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Pagination: {
          type: "object",
          properties: {
            page: {
              type: "integer",
              description: "Текущая страница",
              example: 1,
            },
            limit: {
              type: "integer",
              description: "Количество элементов на странице",
              example: 20,
            },
            total: {
              type: "integer",
              description: "Общее количество элементов",
              example: 100,
            },
            totalPages: {
              type: "integer",
              description: "Общее количество страниц",
              example: 5,
            },
          },
          required: ["page", "limit", "total", "totalPages"],
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = swaggerSpec;
