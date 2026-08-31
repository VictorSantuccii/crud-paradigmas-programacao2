import { Request, Response } from "express";
import prisma from "../lib/prisma";

export const createProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, price, stock, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        message: "Os campos name e price são obrigatórios.",
      });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock: stock ?? 0,
        category,
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error("Erro ao criar produto:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const listProducts = async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(products);
  } catch (error) {
    console.error("Erro ao listar produtos:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    return res.status(200).json(product);
  } catch (error) {
    console.error("Erro ao buscar produto:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category } = req.body;

    const productExists = await prisma.product.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        price,
        stock,
        category,
      },
    });

    return res.status(200).json(updatedProduct);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const productExists = await prisma.product.findUnique({
      where: { id },
    });

    if (!productExists) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    await prisma.product.delete({
      where: { id },
    });

    return res.status(200).json({ message: "Produto deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar produto:", error);
    return res.status(500).json({ message: "Erro interno do servidor." });
  }
};
