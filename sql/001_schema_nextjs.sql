-- App Geek / Next.js: execução idempotente. Fazer backup antes.
-- Atenção: não apaga participantes; nomes/tipos duplicados impedirão criar o índice UNIQUE.
BEGIN;

CREATE TABLE IF NOT EXISTS participantes (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 nome VARCHAR(150) NOT NULL,
 tipo VARCHAR(20) NOT NULL,
 curso VARCHAR(100),
 periodo INTEGER,
 data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS origem_cadastro VARCHAR(10) NOT NULL DEFAULT 'legado';
ALTER TABLE participantes ADD COLUMN IF NOT EXISTS admin_criador_id INTEGER;
ALTER TABLE participantes ALTER COLUMN curso DROP NOT NULL;
ALTER TABLE participantes ALTER COLUMN periodo DROP NOT NULL;

DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM pg_constraint WHERE conname='tipo_participante_valido') THEN
  ALTER TABLE participantes DROP CONSTRAINT tipo_participante_valido;
 END IF;
END $$;
ALTER TABLE participantes ADD CONSTRAINT tipo_participante_valido CHECK(tipo IN ('aluno','professor','visitante'));

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='participantes_periodo_valido') THEN
  ALTER TABLE participantes ADD CONSTRAINT participantes_periodo_valido CHECK(periodo IS NULL OR periodo BETWEEN 1 AND 10);
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='participantes_origem_valida') THEN
  ALTER TABLE participantes ADD CONSTRAINT participantes_origem_valida CHECK(origem_cadastro IN ('publico','admin','legado'));
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS admins (
 id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 usuario VARCHAR(80) NOT NULL,
 senha_hash TEXT NOT NULL,
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS admins_usuario_lower_uidx ON admins(LOWER(usuario));

DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='participantes_admin_criador_fk') THEN
  ALTER TABLE participantes ADD CONSTRAINT participantes_admin_criador_fk
   FOREIGN KEY(admin_criador_id) REFERENCES admins(id) ON DELETE SET NULL;
 END IF;
END $$;

CREATE TABLE IF NOT EXISTS dispositivos_cadastrados (
 device_hash CHAR(64) PRIMARY KEY,
 participante_id INTEGER REFERENCES participantes(id) ON DELETE SET NULL,
 cadastrado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- As sessões ficam no PostgreSQL: resistem a reinícios, ao contrário de Maps em memória.
CREATE TABLE IF NOT EXISTS admin_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
 expira_em TIMESTAMPTZ NOT NULL,
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS admin_sessions_expira_idx ON admin_sessions(expira_em);

CREATE TABLE IF NOT EXISTS qr_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 device_hash CHAR(64) NOT NULL,
 expira_em TIMESTAMPTZ NOT NULL,
 usado BOOLEAN NOT NULL DEFAULT FALSE,
 criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS qr_sessions_expira_idx ON qr_sessions(expira_em);

CREATE TABLE IF NOT EXISTS login_attempts (
 chave CHAR(64) PRIMARY KEY,
 tentativas INTEGER NOT NULL DEFAULT 0,
 bloqueado_ate TIMESTAMPTZ,
 atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Nome + tipo único, mantendo a regra já adotada no projeto anterior.
-- Se houver homônimos, a regra pode bloquear pessoas distintas; prefira matrícula/CPF parcial ou outro identificador validado.
CREATE UNIQUE INDEX IF NOT EXISTS participantes_nome_tipo_unico
 ON participantes(tipo,LOWER(REGEXP_REPLACE(BTRIM(nome),'[[:space:]]+',' ','g')));

COMMIT;
