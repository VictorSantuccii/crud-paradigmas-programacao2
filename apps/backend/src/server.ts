import "./config/env";
import app from "./app";
import { conectarRedis } from "./lib/redis";
const port = Number(process.env.PORT) || 3000;
conectarRedis().then(() => app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`Swagger em http://localhost:${port}/api-docs`);
})).catch((error: unknown) => {
  console.error("Não foi possível conectar ao Redis:", error);
  process.exit(1);
});
