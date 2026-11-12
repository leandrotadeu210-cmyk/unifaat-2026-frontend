#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# query_athena.sh — Executa consultas nas tabelas gold via Athena
#
# Uso:
#   chmod +x scripts/query_athena.sh
#   ./scripts/query_athena.sh
#
# Pré-requisitos:
#   - Crawler já executado (tabelas catalogadas)
#   - Bucket e database configurados abaixo
# ─────────────────────────────────────────────────────────────

set -euo pipefail

BUCKET="${1:-grupo-unifaat-pipeline-leandro}"
DATABASE="vendas_db"
REGION="us-east-1"
OUTPUT_PATH="s3://${BUCKET}/athena-results/"

echo "========================================"
echo " Consultando tabelas gold no Athena"
echo " Database : $DATABASE"
echo " Output   : $OUTPUT_PATH"
echo "========================================"

run_query() {
  local LABEL="$1"
  local SQL="$2"

  echo ""
  echo "── $LABEL ──────────────────────────────"

  EXEC_ID=$(aws athena start-query-execution \
    --query-string "$SQL" \
    --query-execution-context "Database=$DATABASE" \
    --result-configuration "OutputLocation=$OUTPUT_PATH" \
    --region "$REGION" \
    --query "QueryExecutionId" \
    --output text)

  echo "QueryExecutionId: $EXEC_ID"

  # Aguarda conclusão
  while true; do
    STATE=$(aws athena get-query-execution \
      --query-execution-id "$EXEC_ID" \
      --region "$REGION" \
      --query "QueryExecution.Status.State" \
      --output text)

    if [ "$STATE" = "SUCCEEDED" ]; then
      break
    fi
    if [ "$STATE" = "FAILED" ] || [ "$STATE" = "CANCELLED" ]; then
      echo "❌ Query $LABEL falhou: $STATE"
      return 1
    fi
    sleep 3
  done

  # Exibe resultado
  aws athena get-query-results \
    --query-execution-id "$EXEC_ID" \
    --region "$REGION" \
    --output table

  echo "✅ $LABEL concluída."
}

# ── Consulta 1: faturamento por categoria ────────────────────
run_query \
  "Faturamento por categoria (top 10)" \
  "SELECT categoria, SUM(receita_total) AS receita, SUM(qtd_pedidos) AS pedidos FROM faturamento_por_categoria GROUP BY categoria ORDER BY receita DESC LIMIT 10;"

# ── Consulta 2: ranking de produtos ──────────────────────────
run_query \
  "Top 10 produtos por receita" \
  "SELECT produto, categoria, receita_total, total_itens_vendidos FROM ranking_produtos ORDER BY receita_total DESC LIMIT 10;"

# ── Consulta 3: resumo por UF ─────────────────────────────────
run_query \
  "Receita por UF" \
  "SELECT uf, receita_total, qtd_pedidos, ticket_medio, clientes_unicos FROM resumo_por_uf ORDER BY receita_total DESC;"

echo ""
echo "========================================"
echo " Todas as consultas executadas com sucesso."
echo "========================================"
