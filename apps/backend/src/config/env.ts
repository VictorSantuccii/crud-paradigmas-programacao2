import { existsSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const arquivoEnv = path.resolve(__dirname, "../../../../.env");
dotenv.config({ path: existsSync(arquivoEnv) ? arquivoEnv : `${arquivoEnv}.example` });
