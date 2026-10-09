import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";

export class HttpError extends Error {
  constructor(
    public readonly status: 400 | 404 | 409,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (message: string) => new HttpError(400, message);
export const notFound = (message: string) => new HttpError(404, message);
export const conflict = (message: string) => new HttpError(409, message);

export const existeOu404 = async <T>(busca: Promise<T | null>, message: string): Promise<T> => {
  const registro = await busca;
  if (!registro) {
    throw notFound(message);
  }
  return registro;
};

const prismaStatus: Record<string, { status: number; message: string }> = {
  P2002: { status: 409, message: "Já existe um registro com esse valor único." },
  P2003: { status: 400, message: "Referência a um registro inexistente ou em uso." },
  P2025: { status: 404, message: "Registro não encontrado." },
};

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ message: "JSON inválido." });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped = prismaStatus[error.code];
    if (mapped) {
      return res.status(mapped.status).json({ message: mapped.message });
    }
  }

  console.error("Erro não tratado:", error);
  return res.status(500).json({ message: "Erro interno do servidor." });
};
