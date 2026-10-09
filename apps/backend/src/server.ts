import express from "express";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./lib/errors";
import agendamentoRoutes from "./routes/agendamentoRoutes";
import animalRoutes from "./routes/animalRoutes";
import assinaturaRoutes from "./routes/assinaturaRoutes";
import enderecoRoutes from "./routes/enderecoRoutes";
import fidelidadeRoutes from "./routes/fidelidadeRoutes";
import funcionarioRoutes from "./routes/funcionarioRoutes";
import planoRoutes from "./routes/planoRoutes";
import servicoRoutes from "./routes/servicoRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/usuarios", usuarioRoutes);
app.use("/enderecos", enderecoRoutes);
app.use("/fidelidades", fidelidadeRoutes);
app.use("/animais", animalRoutes);
app.use("/planos", planoRoutes);
app.use("/assinaturas", assinaturaRoutes);
app.use("/servicos", servicoRoutes);
app.use("/funcionarios", funcionarioRoutes);
app.use("/agendamentos", agendamentoRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "API funcionando corretamente.",
    docs: "/api-docs",
  });
});

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Swagger em http://localhost:${port}/api-docs`);
});
