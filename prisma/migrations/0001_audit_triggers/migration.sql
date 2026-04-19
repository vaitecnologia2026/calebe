-- =============================================================================
-- Auditoria imutável: bloquear UPDATE e DELETE em audit_events
-- =============================================================================
-- Execute APÓS `prisma migrate deploy` gerar a tabela AuditEvent.
-- Em Vercel Postgres/Neon/Supabase: rode manualmente via psql ou dashboard SQL.

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is immutable: % operation blocked', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_no_update ON "AuditEvent";
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

DROP TRIGGER IF EXISTS audit_events_no_delete ON "AuditEvent";
CREATE TRIGGER audit_events_no_delete
  BEFORE DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- =============================================================================
-- Helpers de criptografia para phone/client data (pgcrypto)
-- =============================================================================
-- Uso a partir da aplicação:
--   INSERT lead (phone_encrypted) VALUES (pgp_sym_encrypt($1, current_setting('app.enc_key')))
--   SELECT pgp_sym_decrypt(phone_encrypted, current_setting('app.enc_key'))
-- Em produção, passar DATA_ENCRYPTION_KEY via SET LOCAL app.enc_key dentro da transação.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
