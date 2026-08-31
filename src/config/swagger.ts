import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "CRUD API com Prisma e Express",
    version: "1.0.0",
    description:
      "Documentação da API REST de produtos com Prisma, Express e Swagger.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
  components: {
    schemas: {
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          price: { type: "number", format: "decimal" },
          stock: { type: "integer" },
          category: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProductInput: {
        type: "object",
        required: ["name", "price"],
        properties: {
          name: { type: "string" },
          description: { type: "string", nullable: true },
          price: { type: "number", format: "decimal" },
          stock: { type: "integer", default: 0 },
          category: { type: "string", nullable: true },
        },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
