# ─────────────────────────────────────────────────────────────
# Bucket S3 criado via AWS CLI (terraform_data + local-exec)
# O Learner Lab restringe criação de roles/policies — usamos
# apenas a LabRole existente. Não usamos o recurso aws_s3_bucket.
# ─────────────────────────────────────────────────────────────

resource "terraform_data" "s3_bucket" {
  triggers_replace = [var.bucket_name]

  provisioner "local-exec" {
    command = "aws s3api create-bucket --bucket ${var.bucket_name} --region us-east-1"
  }

  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      aws s3 rm s3://${self.triggers_replace[0]} --recursive || true
      aws s3api delete-bucket --bucket ${self.triggers_replace[0]} --region us-east-1 || true
    EOT
  }
}

# ─────────────────────────────────────────────────────────────
# Upload do CSV para raw/ e do script ETL para scripts/
# ─────────────────────────────────────────────────────────────

resource "terraform_data" "upload_csv" {
  depends_on       = [terraform_data.s3_bucket]
  triggers_replace = [var.bucket_name]

  provisioner "local-exec" {
    command = "aws s3 cp ${path.module}/../data/vendas.csv s3://${var.bucket_name}/raw/vendas.csv"
  }
}

resource "terraform_data" "upload_etl_script" {
  depends_on       = [terraform_data.s3_bucket]
  triggers_replace = [var.bucket_name]

  provisioner "local-exec" {
    command = "aws s3 cp ${path.module}/../job/etl.py s3://${var.bucket_name}/scripts/etl.py"
  }
}

# ─────────────────────────────────────────────────────────────
# Glue Catalog Database
# ─────────────────────────────────────────────────────────────

resource "aws_glue_catalog_database" "vendas" {
  name        = var.glue_db_name
  description = "Banco de dados do pipeline de vendas (medalhão silver/gold)"
}

# ─────────────────────────────────────────────────────────────
# Glue Job (glueetl, Glue 4.0 / Spark 3.3)
# ─────────────────────────────────────────────────────────────

resource "aws_glue_job" "etl_vendas" {
  depends_on = [
    terraform_data.upload_etl_script,
    aws_glue_catalog_database.vendas,
  ]

  name     = var.glue_job_name
  role_arn = var.lab_role_arn

  glue_version      = "4.0"
  worker_type       = "G.1X"
  number_of_workers = 2

  command {
    name            = "glueetl"
    script_location = "s3://${var.bucket_name}/scripts/etl.py"
    python_version  = "3"
  }

  default_arguments = {
    "--job-language"                     = "python"
    "--enable-continuous-cloudwatch-log" = "true"
    "--enable-glue-datacatalog"          = "true"
    "--INPUT_PATH"                       = "s3://${var.bucket_name}/raw/vendas.csv"
    "--SILVER_PATH"                      = "s3://${var.bucket_name}/silver/"
    "--GOLD_PATH"                        = "s3://${var.bucket_name}/gold/"
    "--QUARANTINE_PATH"                  = "s3://${var.bucket_name}/quarantine/"
    "--GLUE_DB"                          = var.glue_db_name
  }

  execution_property {
    max_concurrent_runs = 1
  }

  tags = {
    Project = "pipeline-vendas"
    Group   = "grupo-unifaat"
  }
}

# ─────────────────────────────────────────────────────────────
# Glue Crawler — cataloga silver/ e gold/
# ─────────────────────────────────────────────────────────────

resource "aws_glue_crawler" "vendas_silver_gold" {
  depends_on    = [aws_glue_catalog_database.vendas]
  database_name = aws_glue_catalog_database.vendas.name
  name          = var.crawler_name
  role          = var.lab_role_arn

  s3_target {
    path = "s3://${var.bucket_name}/silver/"
  }

  s3_target {
    path = "s3://${var.bucket_name}/gold/"
  }

  schema_change_policy {
    delete_behavior = "LOG"
    update_behavior = "UPDATE_IN_DATABASE"
  }

  configuration = jsonencode({
    Version = 1.0
    CrawlerOutput = {
      Partitions = { AddOrUpdateBehavior = "InheritFromTable" }
    }
  })

  tags = {
    Project = "pipeline-vendas"
    Group   = "grupo-unifaat"
  }
}
