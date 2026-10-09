import swaggerJSDoc from "swagger-jsdoc";

type Propriedades = Record<string, Record<string, unknown>>;

interface Entidade {
  campos: Propriedades;
  obrigatorios: string[];
  somenteSaida?: Propriedades;
  somenteCriacao?: Propriedades;
  foraDaSaida?: string[];
}

const id = { type: "integer", example: 1 };
const idReferencia = { type: "integer", minimum: 1, example: 1 };
const textoOpcional = { type: "string", nullable: true };
const preco = { type: "number", minimum: 0, multipleOf: 0.01, example: 89.9 };
const dataHora = { type: "string", format: "date-time", example: "2026-10-01T14:00:00Z" };

const entidades: Record<string, Entidade> = {
  Usuario: {
    campos: {
      email: { type: "string", format: "email", nullable: true, example: "ana@email.com" },
      senha: { type: "string", writeOnly: true, example: "senha-segura" },
      role: { type: "string", enum: ["CLIENTE", "FUNCIONARIO", "ADMIN"] },
      cpf: { type: "string", example: "123.456.789-00" },
      nome: { type: "string", example: "Ana Souza" },
    },
    obrigatorios: ["senha", "role", "cpf", "nome"],
    somenteCriacao: {
      fidelidadeId: {
        ...idReferencia,
        nullable: true,
        description: "Fidelidade existente e livre. Sem ela, uma nova é criada.",
      },
    },
    somenteSaida: { fidelidadeId: idReferencia },
    foraDaSaida: ["senha"],
  },
  Fidelidade: {
    campos: {
      beneficioAtivo: { type: "boolean", example: false },
      qntdServicos: { type: "integer", minimum: 0, example: 0 },
    },
    obrigatorios: ["beneficioAtivo", "qntdServicos"],
  },
  Endereco: {
    campos: {
      cep: { type: "string", example: "01001-000" },
      complemento: textoOpcional,
      bairro: { type: "string", example: "Centro" },
      numero: { type: "integer", minimum: 0, example: 100 },
      rua: { type: "string", example: "Rua das Flores" },
      usuarioId: idReferencia,
    },
    obrigatorios: ["cep", "bairro", "numero", "rua", "usuarioId"],
  },
  Animal: {
    campos: {
      idade: { type: "integer", minimum: 0, example: 3 },
      porte: { type: "string", enum: ["PEQUENO", "MEDIO", "GRANDE"] },
      especie: { type: "string", example: "Cachorro" },
      nome: { type: "string", example: "Rex" },
      usuarioId: idReferencia,
    },
    obrigatorios: ["idade", "porte", "especie", "nome", "usuarioId"],
  },
  Plano: {
    campos: {
      preco,
      tipo: { type: "string", enum: ["BASICO", "PADRAO", "PREMIUM"] },
    },
    obrigatorios: ["preco", "tipo"],
  },
  Assinatura: {
    campos: {
      servicosRest: {
        nullable: true,
        description: "JSON livre com os serviços restantes da assinatura.",
        example: { banho: 4, tosa: 2 },
      },
      dataAquisicao: { type: "string", format: "date", example: "2026-09-27" },
      usuarioId: idReferencia,
      planoId: idReferencia,
    },
    obrigatorios: ["dataAquisicao", "usuarioId", "planoId"],
  },
  Servico: {
    campos: {
      descricao: textoOpcional,
      duracaoMin: { type: "integer", minimum: 1, example: 60 },
      preco,
      nome: { type: "string", example: "Banho e tosa" },
    },
    obrigatorios: ["duracaoMin", "preco", "nome"],
  },
  Funcionario: {
    campos: {
      nome: { type: "string", example: "Carlos Lima" },
      cargo: { type: "string", example: "Tosador" },
      telefone: textoOpcional,
    },
    obrigatorios: ["nome", "cargo"],
  },
  Agendamento: {
    campos: {
      dataHoraIni: dataHora,
      dataHoraFim: { ...dataHora, example: "2026-10-01T15:00:00Z" },
      usuarioId: idReferencia,
      animalId: idReferencia,
      servicoId: idReferencia,
      funcionarioId: idReferencia,
    },
    obrigatorios: [
      "dataHoraIni",
      "dataHoraFim",
      "usuarioId",
      "animalId",
      "servicoId",
      "funcionarioId",
    ],
  },
};

const semCampos = (propriedades: Propriedades, remover: string[] = []) =>
  Object.fromEntries(Object.entries(propriedades).filter(([nome]) => !remover.includes(nome)));

const schemas = Object.fromEntries(
  Object.entries(entidades).flatMap(([nome, entidade]) => [
    [
      nome,
      {
        type: "object",
        properties: {
          id,
          ...semCampos(entidade.campos, entidade.foraDaSaida),
          ...entidade.somenteSaida,
        },
      },
    ],
    [
      `${nome}Input`,
      {
        type: "object",
        required: entidade.obrigatorios,
        properties: { ...entidade.campos, ...entidade.somenteCriacao },
      },
    ],
    [
      `${nome}Update`,
      {
        type: "object",
        minProperties: 1,
        description: "Somente os campos enviados são alterados.",
        properties: entidade.campos,
      },
    ],
  ]),
);

const erro = (description: string) => ({
  description,
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Erro" },
    },
  },
});

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "API Pet Shop",
    version: "2.0.0",
    description:
      "API REST de usuários, animais, planos, assinaturas, serviços, funcionários e agendamentos com Express e Prisma.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
  components: {
    parameters: {
      Id: {
        in: "path",
        name: "id",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    },
    responses: {
      RequisicaoInvalida: erro("Dados inválidos ou id malformado"),
      NaoEncontrado: erro("Registro ou vínculo não encontrado"),
      Conflito: erro("Valor único repetido ou registro com vínculos"),
      Removido: {
        description: "Registro removido",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Mensagem" },
          },
        },
      },
    },
    schemas: {
      Erro: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      Mensagem: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      ...schemas,
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions);
