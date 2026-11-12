#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# run_job.sh — Inicia o Glue Job e aguarda a conclusão
#
# Uso:
#   chmod +x scripts/run_job.sh
#   ./scripts/run_job.sh
#
# Pré-requisitos:
#   - AWS CLI configurado (variáveis de ambiente do Learner Lab)
#   - terraform apply já executado (bucket e job criados)
# ─────────────────────────────────────────────────────────────

set -euo pipefail

JOB_NAME="${1:-etl-vendas-medalhao}"
REGION="us-east-1"

echo "========================================"
echo " Iniciando Glue Job: $JOB_NAME"
echo " Região: $REGION"
echo "========================================"

# Inicia o job e captura o JobRunId
RUN_ID=$(aws glue start-job-run \
  --job-name "$JOB_NAME" \
  --region "$REGION" \
  --query "JobRunId" \
  --output text)

echo "[OK] Job iniciado. JobRunId: $RUN_ID"
echo ""

# Aguarda conclusão com polling a cada 20 segundos
echo "Aguardando conclusão..."
while true; do
  STATE=$(aws glue get-job-run \
    --job-name "$JOB_NAME" \
    --run-id "$RUN_ID" \
    --region "$REGION" \
    --query "JobRun.JobRunState" \
    --output text)

  TIMESTAMP=$(date '+%H:%M:%S')
  echo "[$TIMESTAMP] Estado: $STATE"

  case "$STATE" in
    SUCCEEDED)
      echo ""
      echo "✅ Job SUCCEEDED! JobRunId: $RUN_ID"
      break
      ;;
    FAILED | STOPPED | ERROR | TIMEOUT)
      echo ""
      echo "❌ Job encerrou com estado: $STATE"
      echo "Verifique os logs em CloudWatch:"
      echo "  /aws-glue/jobs/output"
      echo "  /aws-glue/jobs/error"
      exit 1
      ;;
    *)
      sleep 20
      ;;
  esac
done

echo ""
echo "Para consultar os dados no Athena, execute:"
echo "  ./scripts/query_athena.sh"
