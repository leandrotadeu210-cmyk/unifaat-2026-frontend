#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# run_crawler.sh — Inicia o Glue Crawler e aguarda conclusão
#
# Uso:
#   chmod +x scripts/run_crawler.sh
#   ./scripts/run_crawler.sh
# ─────────────────────────────────────────────────────────────

set -euo pipefail

CRAWLER_NAME="${1:-crawler-vendas-silver-gold}"
REGION="us-east-1"

echo "========================================"
echo " Iniciando Glue Crawler: $CRAWLER_NAME"
echo "========================================"

aws glue start-crawler \
  --name "$CRAWLER_NAME" \
  --region "$REGION"

echo "[OK] Crawler iniciado. Aguardando conclusão..."

while true; do
  STATE=$(aws glue get-crawler \
    --name "$CRAWLER_NAME" \
    --region "$REGION" \
    --query "Crawler.State" \
    --output text)

  TIMESTAMP=$(date '+%H:%M:%S')
  echo "[$TIMESTAMP] Estado: $STATE"

  if [ "$STATE" = "READY" ]; then
    echo ""
    echo "✅ Crawler concluído! Tabelas disponíveis no Glue Catalog."
    break
  fi

  sleep 15
done

echo ""
echo "Execute a consulta Athena:"
echo "  ./scripts/query_athena.sh"
