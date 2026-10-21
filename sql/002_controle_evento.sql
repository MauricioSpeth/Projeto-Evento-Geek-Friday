-- App Geek - controle do evento. Execute APÓS 001_schema_nextjs.sql.
-- Migração idempotente: preserva participantes, administradores e sessões existentes.
BEGIN;

CREATE TABLE IF NOT EXISTS configuracoes_evento (
 id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
 ativo BOOLEAN NOT NULL DEFAULT TRUE,
 qr_tempo_segundos INTEGER NOT NULL DEFAULT 15 CHECK (qr_tempo_segundos BETWEEN 1 AND 3600),
 qr_versao BIGINT NOT NULL DEFAULT 1,
 qr_inicio_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 geracao_atividade BIGINT NOT NULL DEFAULT 1,
 atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 atualizado_por INTEGER REFERENCES admins(id) ON DELETE SET NULL
);
INSERT INTO configuracoes_evento (id, ativo, qr_tempo_segundos, qr_versao, geracao_atividade)
VALUES (1, TRUE, 15, 1, 1)
ON CONFLICT (id) DO NOTHING;

-- Toda sessão pública traz a geração em que foi emitida. Desligar/religar invalida
-- as sessões anteriores, mas alterar SOMENTE os segundos do QR não cancela
-- cadastros de quem já conseguiu abrir o formulário.
ALTER TABLE qr_sessions
 ADD COLUMN IF NOT EXISTS geracao_atividade BIGINT NOT NULL DEFAULT 1;

COMMIT;
