# PROGRESS — Pipeline AWS Academy Learner Lab

## Grupo
- Leandro Duarte — RA 6325072 — [@leandrotadeu210-cmyk](https://github.com/leandrotadeu210-cmyk)

---

## Checklist de Entrega

### Infra (Terraform)
- [x] `aws-lab/infra/versions.tf` — provider `aws` fixado em `5.31.0`, região `us-east-1`
- [x] `aws-lab/infra/variables.tf` — variáveis para `bucket_name`, `lab_role_arn`, nomes de recursos
- [x] `aws-lab/infra/main.tf` — bucket via `terraform_data` + `local-exec`, upload CSV e script ETL, `aws_glue_catalog_database`, `aws_glue_job` (glueetl 4.0), `aws_glue_crawler` com dois `s3_target`
- [x] `aws-lab/infra/outputs.tf` — 7 outputs (bucket, job, crawler, database, caminhos S3)
- [ ] `terraform init` executado no Learner Lab
- [ ] `terraform apply` concluído (print anexado)
- [ ] `terraform fmt -check` passa
- [ ] `terraform validate` passa

### ETL (PySpark / Glue)
- [x] `aws-lab/job/etl.py` — medalhão completo: bronze → silver → gold + quarentena
- [x] Bronze: CSV bruto gravado sem alterações
- [x] Silver: 10 regras de qualidade documentadas, quarentena com motivo
- [x] Gold: 3 tabelas (`faturamento_por_categoria`, `ranking_produtos`, `resumo_por_uf`)
- [ ] Glue Job executado até `SUCCEEDED` (print com `JobRunId` anexado)

### Catalogação e Consulta
- [ ] Glue Crawler executado (`run_crawler.sh`)
- [ ] Tabelas visíveis no Glue Catalog / Athena
- [ ] Consultas Athena executadas (`query_athena.sh`) — print anexado

### Encerramento
- [ ] `terraform destroy` concluído — print anexado

### Documentação
- [x] `aws-lab/REGRAS_SILVER.md` — 10 problemas e regras documentados
- [x] `aws-lab/scripts/run_job.sh` — inicia e monitora o Glue Job
- [x] `aws-lab/scripts/run_crawler.sh` — inicia e monitora o Crawler
- [x] `aws-lab/scripts/query_athena.sh` — 3 consultas nas tabelas gold

---

## Como Executar

### 1. Configurar credenciais do Learner Lab

```bash
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

### 2. Obter o ARN da LabRole

```bash
aws iam get-role --role-name LabRole --query Role.Arn --output text
```

Coloque o ARN no arquivo `aws-lab/infra/terraform.tfvars`:

```hcl
lab_role_arn = "arn:aws:iam::CONTA:role/LabRole"
bucket_name  = "grupo-unifaat-pipeline-leandro"
```

### 3. Provisionar a infra

```bash
cd aws-lab/infra
terraform init
terraform apply
```

### 4. Rodar o ETL

```bash
chmod +x ../scripts/run_job.sh
../scripts/run_job.sh etl-vendas-medalhao
```

### 5. Rodar o Crawler

```bash
chmod +x ../scripts/run_crawler.sh
../scripts/run_crawler.sh crawler-vendas-silver-gold
```

### 6. Consultar no Athena

```bash
chmod +x ../scripts/query_athena.sh
../scripts/query_athena.sh grupo-unifaat-pipeline-leandro
```

### 7. Destruir a infra

```bash
terraform destroy
```

---

## Arquitetura

```
S3 raw/ (vendas.csv)
    │
    ▼
Glue Job (PySpark — etl.py)
    ├── S3 bronze/   ← CSV original sem alteração
    ├── S3 silver/   ← dado padronizado e confiável (Parquet, particionado por ano/mês)
    ├── S3 gold/     ← tabelas de negócio (Parquet)
    │       ├── faturamento_por_categoria/
    │       ├── ranking_produtos/
    │       └── resumo_por_uf/
    └── S3 quarantine/ ← linhas rejeitadas com motivo
            │
            ▼
        Glue Crawler → Glue Catalog → Athena
```

---

## Perguntas de Negócio Respondidas

| Tabela Gold                  | Pergunta                                                      |
|------------------------------|---------------------------------------------------------------|
| `faturamento_por_categoria`  | Quais categorias geram mais receita e como evoluem por mês?  |
| `ranking_produtos`           | Quais produtos têm maior volume de vendas e maior receita?   |
| `resumo_por_uf`              | Qual a distribuição geográfica e ticket médio por estado?    |
