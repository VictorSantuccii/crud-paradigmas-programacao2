import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import productRoutes from "./routes/productRoutes";
import { swaggerSpec } from "./config/swagger";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/products", productRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "API funcionando corretamente.",
    docs: "/api-docs",
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Swagger em http://localhost:${port}/api-docs`);
});
