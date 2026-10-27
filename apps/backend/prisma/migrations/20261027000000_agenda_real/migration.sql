-- Auditoria antes de qualquer mudança. Nunca corrige dados silenciosamente.
DO $$
DECLARE invalidos TEXT; conflitos TEXT;
BEGIN
  SELECT string_agg(id::text, ', ' ORDER BY id) INTO invalidos
    FROM agendamentos WHERE "dataHoraFim" <= "dataHoraIni";
  SELECT string_agg(a.id::text || '/' || b.id::text, ', ' ORDER BY a.id, b.id) INTO conflitos
    FROM agendamentos a JOIN agendamentos b ON a.id < b.id
      AND a.id_funcionario = b.id_funcionario
      AND a."dataHoraIni" < b."dataHoraFim" AND b."dataHoraIni" < a."dataHoraFim";
  IF invalidos IS NOT NULL OR conflitos IS NOT NULL THEN
    RAISE EXCEPTION 'Agenda legada inválida. IDs inválidos: %. Pares sobrepostos: %. Corrija explicitamente antes de migrar.', coalesce(invalidos, '-'), coalesce(conflitos, '-');
  END IF;
END $$;

CREATE EXTENSION IF NOT EXISTS btree_gist WITH SCHEMA public;
CREATE TYPE "CategoriaServico" AS ENUM ('BANHO_TOSA', 'CONSULTA');
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'CONCLUIDO', 'CANCELADO', 'NAO_COMPARECEU');
ALTER TABLE servicos ADD COLUMN categoria "CategoriaServico", ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE servicos ADD CONSTRAINT servico_classificado CHECK (NOT ativo OR categoria IS NOT NULL);
ALTER TABLE funcionarios ADD COLUMN ativo BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "_Habilitacao" (
  "A" INTEGER NOT NULL REFERENCES funcionarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "B" INTEGER NOT NULL REFERENCES servicos(id) ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "_Habilitacao_AB_unique" ON "_Habilitacao"("A", "B");
CREATE INDEX "_Habilitacao_B_index" ON "_Habilitacao"("B");
ALTER TABLE agendamentos
  ADD COLUMN status "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
  ADD COLUMN observacoes VARCHAR(300), ADD COLUMN "precoContratado" DECIMAL(10,2),
  ADD COLUMN "duracaoContratadaMin" DOUBLE PRECISION;
-- A duração registrada é conhecida; o preço histórico permanece desconhecido (NULL).
UPDATE agendamentos SET "duracaoContratadaMin" = EXTRACT(EPOCH FROM ("dataHoraFim" - "dataHoraIni")) / 60;
ALTER TABLE agendamentos ALTER COLUMN "duracaoContratadaMin" SET NOT NULL;
ALTER TABLE agendamentos ADD CONSTRAINT agendamento_intervalo_valido CHECK ("dataHoraFim" > "dataHoraIni" AND "duracaoContratadaMin" > 0);
ALTER TABLE agendamentos ADD CONSTRAINT agendamento_sem_sobreposicao
  EXCLUDE USING gist (id_funcionario public.gist_int4_ops WITH =, tsrange("dataHoraIni", "dataHoraFim", '[)') WITH &&)
  WHERE (status IN ('AGENDADO', 'CONCLUIDO'));
CREATE TABLE configuracao_agenda (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), fuso TEXT NOT NULL,
  "intervaloSlotMin" INTEGER NOT NULL CHECK ("intervaloSlotMin" > 0),
  "antecedenciaCriacaoHoras" INTEGER NOT NULL CHECK ("antecedenciaCriacaoHoras" > 0),
  "antecedenciaCancelamentoHoras" INTEGER NOT NULL CHECK ("antecedenciaCancelamentoHoras" > 0),
  "antecedenciaReagendamentoHoras" INTEGER NOT NULL CHECK ("antecedenciaReagendamentoHoras" > 0),
  intervalos JSONB NOT NULL
);
INSERT INTO configuracao_agenda (id, fuso, "intervaloSlotMin", "antecedenciaCriacaoHoras", "antecedenciaCancelamentoHoras", "antecedenciaReagendamentoHoras", intervalos)
SELECT 1, 'America/Sao_Paulo', 30, 24, 24, 24,
  jsonb_agg(jsonb_build_object('diaSemana', dia, 'inicio', ini, 'fim', fim) ORDER BY dia, ini)
  FROM generate_series(1,5) dia CROSS JOIN (VALUES ('09:00','12:00'), ('13:00','18:00')) AS turnos(ini,fim);
CREATE TABLE bloqueios_agenda (
  id SERIAL PRIMARY KEY, inicio TIMESTAMP(3) NOT NULL, fim TIMESTAMP(3) NOT NULL,
  motivo VARCHAR(300), "funcionarioId" INTEGER REFERENCES funcionarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT bloqueio_intervalo_valido CHECK (fim > inicio)
);
CREATE INDEX "bloqueios_agenda_inicio_fim_idx" ON bloqueios_agenda(inicio,fim);
CREATE TABLE eventos_agendamento (
  id SERIAL PRIMARY KEY,
  "agendamentoId" INTEGER NOT NULL REFERENCES agendamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "autorId" INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  instante TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  acao TEXT NOT NULL, motivo VARCHAR(300), antes JSONB, depois JSONB NOT NULL
);
CREATE INDEX "eventos_agendamento_agendamentoId_instante_idx" ON eventos_agendamento("agendamentoId",instante);
