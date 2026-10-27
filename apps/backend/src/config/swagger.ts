import { agendaSchemas, agendaPaths } from "./agendaSwagger";
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
      cpf: { type: "string", example: "529.982.247-25", description: "CPF válido; saída sem máscara." },
      telefone: { type: "string", nullable: true, example: "11999991234" },
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
    somenteSaida: {
      fidelidadeId: idReferencia,
      funcionarioId: { ...idReferencia, nullable: true },
      perfilCompleto: { type: "boolean" },
      camposPendentes: { type: "array", items: { type: "string" } },
    },
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
      usuarioId: { ...idReferencia, description: "CLIENTE: derivado da sessão; omita nas requisições. ADMIN: informe na criação quando necessário." },
    },
    obrigatorios: ["cep", "bairro", "numero", "rua"],
  },
  Animal: {
    campos: {
      idade: { type: "integer", minimum: 0, example: 3 },
      porte: { type: "string", enum: ["PEQUENO", "MEDIO", "GRANDE"] },
      especie: { type: "string", example: "Cachorro" },
      raca: { type: "string", nullable: true, example: "Labrador", description: "Opcional. Texto aparado; null limpa; omissão na atualização preserva o valor." },
      nome: { type: "string", example: "Rex" },
      usuarioId: { ...idReferencia, description: "CLIENTE: derivado da sessão; omita nas requisições. ADMIN: informe na criação quando necessário." },
    },
    obrigatorios: ["idade", "porte", "especie", "nome"],
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
      usuarioId: { ...idReferencia, description: "CLIENTE: derivado da sessão; omita nas requisições. ADMIN: informe na criação quando necessário." },
      planoId: idReferencia,
    },
    obrigatorios: ["dataAquisicao", "usuarioId", "planoId"],
  },
  Servico: {
    campos: {
      categoria: { type: "string", enum: ["BANHO_TOSA", "CONSULTA"], description: "Obrigatória em novos serviços; legado permanece sem classificação até configuração explícita." },
      ativo: { type: "boolean", default: false },
      descricao: textoOpcional,
      duracaoMin: { type: "integer", minimum: 1, example: 60 },
      preco,
      nome: { type: "string", example: "Banho e tosa" },
    },
    obrigatorios: ["duracaoMin", "preco", "nome", "categoria"],
    somenteSaida: { categoria: { type: "string", nullable: true, enum: ["BANHO_TOSA", "CONSULTA"], description: "Legado pode permanecer sem classificação na listagem administrativa." } },
  },
  Funcionario: {
    campos: {
      ativo: { type: "boolean", default: false },
      servicoIds: { type: "array", uniqueItems: true, items: idReferencia, description: "Lista explícita de habilitações. PUT substitui a lista; [] remove todas." },
      nome: { type: "string", example: "Carlos Lima" },
      cargo: { type: "string", example: "Tosador" },
      telefone: textoOpcional,
    },
    obrigatorios: ["nome", "cargo"],
  },
  Agendamento: {
    campos: { dataHoraIni: dataHora, animalId: idReferencia, servicoId: idReferencia, funcionarioId: idReferencia, observacoes: { type: "string", nullable: true, maxLength: 300 } },
    obrigatorios: ["dataHoraIni", "animalId", "servicoId", "funcionarioId"],
    somenteSaida: { dataHoraFim: dataHora, usuarioId: idReferencia, precoContratado: { ...preco, nullable: true }, duracaoContratadaMin: { type: "number", minimum: 0, exclusiveMinimum: true }, status: { type: "string", enum: ["AGENDADO", "CONCLUIDO", "CANCELADO", "NAO_COMPARECEU"] }, animal: { type: "object", properties: { id, nome: { type: "string" }, especie: { type: "string" } } }, servico: { type: "object", properties: { id, nome: { type: "string" }, categoria: { type: "string", nullable: true } } }, funcionario: { $ref: "#/components/schemas/ProfissionalPublico" }, podeCancelar: { type: "boolean" }, podeReagendar: { type: "boolean" } },
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
    version: "3.0.0",
    description:
      "API REST de usuários, animais, planos, assinaturas, serviços, funcionários e agendamentos com Express e Prisma.",
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Servidor local",
    },
  ],
  security: [{ CookieSession: [] }],
  components: {
    securitySchemes: {
      CookieSession: { type: "apiKey", in: "cookie", name: "petshop_session" },
      OnboardingCookie: { type: "apiKey", in: "cookie", name: "petshop_onboarding" },
    },
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
        required: ["message"],
        properties: {
          message: { type: "string" },
          code: { type: "string", example: "PERFIL_INCOMPLETO" },
          fieldErrors: { type: "object", additionalProperties: { type: "string" }, example: { "endereco.cep": "CEP inválido." } },
        },
      },
      Mensagem: {
        type: "object",
        properties: { message: { type: "string" } },
      },
      ...schemas,
      ...agendaSchemas,
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJSDoc(swaggerOptions) as { paths: Record<string, unknown> };
Object.assign(swaggerSpec.paths, agendaPaths);
const catalogoGet = (swaggerSpec.paths['/servicos'] as Record<string, Record<string, unknown>>).get;
catalogoGet.description = 'Catálogo público somente de serviços ativos classificados; preço e duração fixos por serviço. ADMIN consulta inativos em /servicos/administracao.';
catalogoGet.parameters = [{ in: 'query', name: 'categoria', schema: { type: 'string', enum: ['BANHO_TOSA', 'CONSULTA'] } }];
Object.assign(swaggerSpec.paths!, {
  "/auth/cadastro": { post: { summary: "Cadastra um cliente", security: [], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["nome", "email", "cpf", "senha", "telefone", "endereco"], properties: { nome: { type: "string" }, email: { type: "string", format: "email" }, cpf: { type: "string" }, senha: { type: "string", minLength: 8 }, confirmarSenha: { type: "string" }, telefone: { type: "string" }, endereco: { type: "object", required: ["cep", "rua", "bairro", "numero"], properties: { cep: { type: "string" }, rua: { type: "string" }, bairro: { type: "string" }, numero: { type: "integer", minimum: 0 }, complemento: { type: "string", nullable: true } } } } } } } }, responses: { "201": { description: "Cliente criado; cookie petshop_session emitido" }, "400": { description: "Entrada inválida ou campo privilegiado" }, "409": { description: "E-mail ou CPF já cadastrado" } } } },
  "/auth/login": { post: { summary: "Inicia sessão por e-mail e senha", security: [], responses: { "200": { description: "Sessão criada" }, "401": { description: "Credenciais inválidas" } } } },
  "/auth/google": { post: { summary: "Autentica ID token Firebase validado pelo backend", security: [], responses: { "200": { description: "Sessão ou onboarding iniciado" } } } },
  "/auth/me": { get: { summary: "Consulta perfil e completude atual" }, put: { summary: "Atualiza perfil próprio; CPF válido não pode ser alterado", responses: { "200": { description: "Perfil atualizado" }, "400": { description: "Dados inválidos ou campo privilegiado" }, "403": { description: "Endereço pertence a outra conta" } } } },
  "/auth/onboarding": { get: { summary: "Retoma onboarding Google", security: [{ OnboardingCookie: [] }], responses: { "200": { description: "Identidade verificada e campos pendentes" }, "401": { description: "Onboarding expirado" } } }, put: { summary: "Conclui onboarding Google e emite sessão normal", security: [{ OnboardingCookie: [] }], responses: { "201": { description: "Cliente criado e sessão emitida" }, "401": { description: "Onboarding expirado" }, "409": { description: "CPF ou e-mail já cadastrado" } } } },
  "/auth/logout": { post: { summary: "Revoga sessões comuns e temporárias", security: [], responses: { "204": { description: "Sessão encerrada" } } } },
});
for (const [path, item] of Object.entries(swaggerSpec.paths!)) {
  if (path === "/servicos" || path === "/servicos/{id}") {
    const operations = item as Record<string, { security?: unknown[] }>;
    for (const [method, operation] of Object.entries(operations)) if (method === "get") operation.security = [];
  }
}

// Contratos compartilhados dos fluxos de cadastro, perfil, endereços e pets.
for (const path of ['/auth/cadastro', '/auth/onboarding', '/auth/me', '/enderecos', '/enderecos/{id}', '/animais', '/animais/{id}']) {
  const item = swaggerSpec.paths[path] as Record<string, { description?: string; responses?: Record<string, unknown> }>;
  for (const [method, operation] of Object.entries(item)) {
    const responses = operation.responses ||= {};
    if (['post', 'put'].includes(method)) {
      responses['400'] = erro('Dados inválidos, com fieldErrors quando o campo é identificável. Endereço aninhado usa endereco.cep, endereco.numero etc.');
    }
    if (['/auth/cadastro', '/auth/onboarding', '/auth/me'].includes(path) && ['post', 'put'].includes(method)) responses['409'] = erro('CPF ou e-mail normalizado já cadastrado; fieldErrors identifica a restrição única violada, inclusive em concorrência.');
    if (!['/auth/cadastro', '/auth/onboarding'].includes(path)) {
      responses['401'] = erro('Sessão ausente ou expirada.');
      responses['403'] = erro('Registro de outro titular, acesso não permitido ou PERFIL_INCOMPLETO.');
    }
    if (path.startsWith('/enderecos') || path.startsWith('/animais')) {
      operation.description = `${operation.description || ''} CLIENTE acessa somente registros próprios. O titular vem da sessão; não envie usuarioId. ID inexistente retorna 404 e registro de outro cliente retorna 403.`.trim();
      if (path.endsWith('/{id}')) responses['404'] = erro('ID inexistente.');
      if (method === 'delete') responses['409'] = erro(path.startsWith('/animais') ? 'Pet com agendamentos associados, inclusive vínculo criado durante a exclusão. O pet é preservado.' : 'Não é permitido remover o último endereço completo.');
    }
  }
}

const profileOperations = swaggerSpec.paths['/auth/me'] as Record<string, Record<string, unknown>>;
profileOperations.put.requestBody = { required: true, content: { 'application/json': { schema: { type: 'object', minProperties: 1, properties: { nome: { type: 'string', minLength: 1 }, email: { type: 'string', format: 'email' }, telefone: { type: 'string' }, cpf: { type: 'string', description: 'Somente regularização de CPF ausente ou inválido. CPF válido exige atendimento administrativo.' }, endereco: { ...schemas.EnderecoUpdate, properties: { ...semCampos(entidades.Endereco.campos, ['usuarioId']), id: { type: 'integer', description: 'Endereço próprio; omitir cria um novo.' } } } } } } } };
