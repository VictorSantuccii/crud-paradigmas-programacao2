import "./config/env";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger";
import { errorMiddleware } from "./lib/errors";
import agendaRoutes from "./routes/agendaRoutes";
import agendamentoRoutes from "./routes/agendamentoRoutes";
import animalRoutes from "./routes/animalRoutes";
import assinaturaRoutes from "./routes/assinaturaRoutes";
import enderecoRoutes from "./routes/enderecoRoutes";
import fidelidadeRoutes from "./routes/fidelidadeRoutes";
import funcionarioRoutes from "./routes/funcionarioRoutes";
import planoRoutes from "./routes/planoRoutes";
import servicoRoutes from "./routes/servicoRoutes";
import usuarioRoutes from "./routes/usuarioRoutes";
import authRoutes from "./routes/authRoutes";


import { autenticar, exigirCompleto } from "./lib/session";
const app = express();


app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173", credentials: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/usuarios", autenticar, exigirCompleto, usuarioRoutes);
app.use("/auth", authRoutes);
app.use("/enderecos", autenticar, exigirCompleto, enderecoRoutes);
app.use("/fidelidades", autenticar, exigirCompleto, fidelidadeRoutes);
app.use("/animais", autenticar, exigirCompleto, animalRoutes);
app.use("/planos", autenticar, exigirCompleto, planoRoutes);
app.use("/assinaturas", autenticar, exigirCompleto, assinaturaRoutes);
app.use("/servicos", (req, res, next) => { if (req.method === "GET") return next(); return autenticar(req, res, () => exigirCompleto(req, res, next)); }, servicoRoutes);
app.use("/funcionarios", autenticar, exigirCompleto, funcionarioRoutes);
app.use("/agendamentos", autenticar, exigirCompleto, agendamentoRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "API funcionando corretamente.",
    docs: "/api-docs",
  });
});

app.use(agendaRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Rota não encontrada." });
});

app.use(errorMiddleware);


export default app;
