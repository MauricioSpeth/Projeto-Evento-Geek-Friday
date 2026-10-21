-- Execute ANTES de 001_schema_nextjs.sql; resolva duplicatas sem apagar dados automaticamente.
SELECT tipo,
 LOWER(REGEXP_REPLACE(BTRIM(nome),'[[:space:]]+',' ','g')) AS nome_normalizado,
 COUNT(*) AS total,ARRAY_AGG(id ORDER BY id) AS registros
FROM participantes
GROUP BY tipo,LOWER(REGEXP_REPLACE(BTRIM(nome),'[[:space:]]+',' ','g'))
HAVING COUNT(*)>1
ORDER BY total DESC,nome_normalizado;
