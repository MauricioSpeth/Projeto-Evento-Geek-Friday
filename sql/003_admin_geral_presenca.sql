-- Atualização não destrutiva. Execute após 001 e 002.
-- Contas existentes continuam como admin padrão; a promoção ao administrador geral
-- requer comprovação da senha pelo script npm run admin:bootstrap.
BEGIN;
ALTER TABLE admins ADD COLUMN IF NOT EXISTS papel VARCHAR(10) NOT NULL DEFAULT 'admin';
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'admins_papel_valido') THEN
  ALTER TABLE admins ADD CONSTRAINT admins_papel_valido CHECK (papel IN ('admin', 'geral'));
 END IF;
END $$;

-- Usa a hora original das sessões anteriores em vez de considerar todas online
-- no instante em que a migração é executada.
ALTER TABLE admin_sessions ADD COLUMN IF NOT EXISTS visto_em TIMESTAMPTZ;
UPDATE admin_sessions SET visto_em = criado_em WHERE visto_em IS NULL;
ALTER TABLE admin_sessions ALTER COLUMN visto_em SET DEFAULT NOW();
ALTER TABLE admin_sessions ALTER COLUMN visto_em SET NOT NULL;
CREATE INDEX IF NOT EXISTS admin_sessions_presenca_idx ON admin_sessions(visto_em DESC);
COMMIT;
