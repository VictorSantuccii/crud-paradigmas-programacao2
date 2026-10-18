-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'FUNCIONARIO', 'ADMIN');

-- CreateEnum
CREATE TYPE "Porte" AS ENUM ('PEQUENO', 'MEDIO', 'GRANDE');

-- CreateEnum
CREATE TYPE "TipoPlano" AS ENUM ('BASICO', 'PADRAO', 'PREMIUM');

-- CreateTable
CREATE TABLE "fidelidades" (
    "id" SERIAL NOT NULL,
    "beneficioAtivo" BOOLEAN NOT NULL,
    "qntdServicos" INTEGER NOT NULL,

    CONSTRAINT "fidelidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "senha_hash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "cpf" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "id_fidelidade" INTEGER NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id" SERIAL NOT NULL,
    "cep" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "rua" TEXT NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animais" (
    "id" SERIAL NOT NULL,
    "idade" INTEGER NOT NULL,
    "porte" "Porte" NOT NULL,
    "especie" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "animais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos" (
    "id" SERIAL NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "tipo" "TipoPlano" NOT NULL,

    CONSTRAINT "planos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assinaturas" (
    "id" SERIAL NOT NULL,
    "servicosRest" JSONB,
    "dataAquisicao" DATE NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_plano" INTEGER NOT NULL,

    CONSTRAINT "assinaturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT,
    "duracaoMin" INTEGER NOT NULL,
    "preco" DECIMAL(10,2) NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "funcionarios" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "telefone" TEXT,

    CONSTRAINT "funcionarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" SERIAL NOT NULL,
    "dataHoraIni" TIMESTAMP(3) NOT NULL,
    "dataHoraFim" TIMESTAMP(3) NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_animal" INTEGER NOT NULL,
    "id_servico" INTEGER NOT NULL,
    "id_funcionario" INTEGER NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_cpf_key" ON "usuarios"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_id_fidelidade_key" ON "usuarios"("id_fidelidade");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_fidelidade_fkey" FOREIGN KEY ("id_fidelidade") REFERENCES "fidelidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animais" ADD CONSTRAINT "animais_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assinaturas" ADD CONSTRAINT "assinaturas_id_plano_fkey" FOREIGN KEY ("id_plano") REFERENCES "planos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_animal_fkey" FOREIGN KEY ("id_animal") REFERENCES "animais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_servico_fkey" FOREIGN KEY ("id_servico") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_funcionario_fkey" FOREIGN KEY ("id_funcionario") REFERENCES "funcionarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
