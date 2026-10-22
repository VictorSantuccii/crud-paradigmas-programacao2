-- Não mesclar contas. O bloco aborta antes de qualquer alteração em caso de colisão.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM usuarios GROUP BY regexp_replace(cpf, '[^0-9]', '', 'g') HAVING count(*) > 1)
    OR EXISTS (SELECT 1 FROM usuarios WHERE email IS NOT NULL GROUP BY lower(trim(email)) HAVING count(*) > 1) THEN
    RAISE EXCEPTION 'Colisão de CPF/e-mail normalizado. Execute auditoria:legado e corrija administrativamente antes de migrar.';
  END IF;
END $$;
ALTER TABLE usuarios ADD COLUMN telefone TEXT, ADD COLUMN id_funcionario INTEGER;
CREATE UNIQUE INDEX usuarios_id_funcionario_key ON usuarios(id_funcionario);
ALTER TABLE usuarios ADD CONSTRAINT usuarios_id_funcionario_fkey FOREIGN KEY (id_funcionario) REFERENCES funcionarios(id) ON DELETE RESTRICT ON UPDATE CASCADE;
UPDATE usuarios SET cpf = regexp_replace(cpf, '[^0-9]', '', 'g'), email = lower(trim(email));
