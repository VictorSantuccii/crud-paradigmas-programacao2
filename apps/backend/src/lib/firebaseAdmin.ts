import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  throw new Error("Configure FIREBASE_PROJECT_ID para habilitar autenticação Google.");
}

const credencialJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const credencial = credencialJson
  ? cert(JSON.parse(credencialJson.replace(/\\n/g, "\n")))
  : applicationDefault();

const app = getApps()[0] ?? initializeApp({ credential: credencial, projectId });

export const verificarTokenFirebase = (idToken: string) => getAuth(app).verifyIdToken(idToken);
