-- Não normalizar nem recontar o legado. Saneamento exige decisão explícita.
DO $$
DECLARE invalidos TEXT;
BEGIN
  SELECT string_agg(id::text || '=' || "qntdServicos"::text, ', ' ORDER BY id)
    INTO invalidos FROM fidelidades WHERE "qntdServicos" NOT BETWEEN 0 AND 7;
  IF invalidos IS NOT NULL THEN
    RAISE EXCEPTION 'Fidelidade legada inválida (id=contador): %. Saneie explicitamente para 0–7 antes de migrar.', invalidos;
  END IF;
END $$;

CREATE TYPE "EstadoBeneficio" AS ENUM ('DISPONIVEL', 'RESERVADO', 'CONSUMIDO', 'REVOGADO');
CREATE TYPE "TipoMovimentoFidelidade" AS ENUM ('IMPORTACAO', 'CONTAGEM', 'EMISSAO', 'RESERVA', 'LIBERACAO', 'CONSUMO', 'AJUSTE');
ALTER TABLE fidelidades ADD COLUMN progresso INTEGER NOT NULL DEFAULT 0;
UPDATE fidelidades SET progresso = "qntdServicos";
ALTER TABLE fidelidades ADD CONSTRAINT fidelidade_progresso_valido CHECK (progresso BETWEEN 0 AND 7 AND "qntdServicos" = progresso);
ALTER TABLE servicos ADD COLUMN "elegivelFidelidade" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE servicos ADD CONSTRAINT servico_fidelidade_categoria CHECK (NOT "elegivelFidelidade" OR (categoria IS NOT NULL AND categoria = 'BANHO_TOSA'));
ALTER TABLE agendamentos ADD COLUMN "elegivelFidelidade" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "precoBase" DECIMAL(10,2), ADD COLUMN desconto DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN "beneficioId" INTEGER;
UPDATE agendamentos SET "precoBase" = "precoContratado";
ALTER TABLE agendamentos ADD CONSTRAINT agendamento_preco_fidelidade CHECK (
  desconto >= 0 AND ("precoBase" IS NULL AND "precoContratado" IS NULL AND desconto = 0 AND "beneficioId" IS NULL
  OR "precoBase" IS NOT NULL AND "precoContratado" IS NOT NULL AND "precoBase" >= desconto AND "precoContratado" = "precoBase" - desconto)
  AND ("beneficioId" IS NULL AND desconto = 0 OR "beneficioId" IS NOT NULL AND "elegivelFidelidade" AND desconto = "precoBase" AND "precoContratado" = 0)
);
CREATE TABLE beneficios_fidelidade (
  id SERIAL PRIMARY KEY,
  "fidelidadeId" INTEGER NOT NULL REFERENCES fidelidades(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  estado "EstadoBeneficio" NOT NULL DEFAULT 'DISPONIVEL', "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "geradorId" INTEGER UNIQUE REFERENCES agendamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "agendamentoId" INTEGER UNIQUE REFERENCES agendamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT beneficio_vinculo_estado CHECK ((estado IN ('RESERVADO','CONSUMIDO')) = ("agendamentoId" IS NOT NULL))
);
CREATE INDEX "beneficios_fidelidade_fidelidadeId_estado_criadoEm_id_idx" ON beneficios_fidelidade("fidelidadeId", estado, "criadoEm", id);
ALTER TABLE agendamentos ADD CONSTRAINT "agendamentos_beneficioId_fkey" FOREIGN KEY ("beneficioId") REFERENCES beneficios_fidelidade(id) ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE movimentos_fidelidade (
  id SERIAL PRIMARY KEY,
  "fidelidadeId" INTEGER NOT NULL REFERENCES fidelidades(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  tipo "TipoMovimentoFidelidade" NOT NULL, instante TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "autorId" INTEGER REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  motivo VARCHAR(300), antes JSONB NOT NULL, depois JSONB NOT NULL,
  "beneficioId" INTEGER REFERENCES beneficios_fidelidade(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "agendamentoId" INTEGER REFERENCES agendamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  "contagemAgendamentoId" INTEGER UNIQUE REFERENCES agendamentos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT movimento_autor CHECK (tipo = 'IMPORTACAO' OR "autorId" IS NOT NULL),
  CONSTRAINT movimento_contagem CHECK ((tipo = 'CONTAGEM') = ("contagemAgendamentoId" IS NOT NULL) AND ("contagemAgendamentoId" IS NULL OR "contagemAgendamentoId" = "agendamentoId")),
  CONSTRAINT movimento_ajuste CHECK (tipo <> 'AJUSTE' OR ("autorId" IS NOT NULL AND motivo IS NOT NULL AND length(trim(motivo)) > 0))
);
CREATE INDEX "movimentos_fidelidade_fidelidadeId_instante_id_idx" ON movimentos_fidelidade("fidelidadeId", instante, id);
INSERT INTO beneficios_fidelidade ("fidelidadeId") SELECT id FROM fidelidades WHERE "beneficioAtivo" ORDER BY id;
INSERT INTO movimentos_fidelidade ("fidelidadeId", tipo, motivo, antes, depois, "beneficioId")
SELECT f.id, 'IMPORTACAO', 'Importação do estado legado, sem recontagem de atendimentos',
  jsonb_build_object('qntdServicos', f."qntdServicos", 'beneficioAtivo', f."beneficioAtivo"),
  jsonb_build_object('progresso', f.progresso, 'disponiveis', CASE WHEN f."beneficioAtivo" THEN 1 ELSE 0 END), b.id
FROM fidelidades f LEFT JOIN beneficios_fidelidade b ON b."fidelidadeId" = f.id;

-- Restrição diferida permite criar contrato e reserva atomicamente, e protege vínculos cruzados.
CREATE FUNCTION validar_vinculos_fidelidade() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM beneficios_fidelidade b LEFT JOIN agendamentos a ON a.id = b."agendamentoId"
      LEFT JOIN usuarios u ON u.id = a.id_usuario
    WHERE b."agendamentoId" IS NOT NULL AND (a."beneficioId" IS DISTINCT FROM b.id OR u.id_fidelidade IS DISTINCT FROM b."fidelidadeId"
      OR b.estado = 'RESERVADO' AND a.status <> 'AGENDADO' OR b.estado = 'CONSUMIDO' AND a.status <> 'CONCLUIDO')
  ) OR EXISTS (
    SELECT 1 FROM agendamentos a JOIN beneficios_fidelidade b ON b.id = a."beneficioId" JOIN usuarios u ON u.id = a.id_usuario
    WHERE u.id_fidelidade <> b."fidelidadeId" OR (a.status IN ('AGENDADO','CONCLUIDO') AND b."agendamentoId" IS DISTINCT FROM a.id)
  ) OR EXISTS (
    SELECT 1 FROM beneficios_fidelidade b JOIN agendamentos a ON a.id = b."geradorId" JOIN usuarios u ON u.id = a.id_usuario
    WHERE u.id_fidelidade <> b."fidelidadeId" OR a.status <> 'CONCLUIDO' OR NOT a."elegivelFidelidade"
      OR a."beneficioId" IS NOT NULL OR a."precoContratado" IS NULL OR a."precoContratado" <= 0
      OR NOT EXISTS (SELECT 1 FROM movimentos_fidelidade m WHERE m."contagemAgendamentoId" = a.id AND m.depois->>'progresso' = '0')
  ) OR EXISTS (
    SELECT 1 FROM movimentos_fidelidade m
      LEFT JOIN beneficios_fidelidade b ON b.id = m."beneficioId"
      LEFT JOIN agendamentos a ON a.id = m."agendamentoId"
      LEFT JOIN usuarios u ON u.id = a.id_usuario
    WHERE (b.id IS NOT NULL AND b."fidelidadeId" <> m."fidelidadeId")
      OR (a.id IS NOT NULL AND u.id_fidelidade <> m."fidelidadeId")
      OR (m.tipo = 'CONTAGEM' AND (a.status <> 'CONCLUIDO' OR NOT a."elegivelFidelidade" OR a."beneficioId" IS NOT NULL OR a."precoContratado" IS NULL OR a."precoContratado" <= 0))
      OR (m.tipo IN ('RESERVA','LIBERACAO','CONSUMO') AND (a.id IS NULL OR b.id IS NULL OR a."beneficioId" IS DISTINCT FROM b.id))
      OR (m.tipo = 'EMISSAO' AND (a.id IS NULL OR b.id IS NULL OR b."geradorId" IS DISTINCT FROM a.id))
  ) THEN
    RAISE EXCEPTION 'Vínculo de benefício, titular ou estado inconsistente' USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER beneficio_vinculo_consistente AFTER INSERT OR UPDATE ON beneficios_fidelidade
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_vinculos_fidelidade();
CREATE CONSTRAINT TRIGGER agendamento_beneficio_consistente AFTER INSERT OR UPDATE ON agendamentos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_vinculos_fidelidade();
CREATE CONSTRAINT TRIGGER movimento_vinculo_consistente AFTER INSERT OR UPDATE ON movimentos_fidelidade
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_vinculos_fidelidade();
