output "bucket_name" {
  description = "Nome do bucket S3 do pipeline"
  value       = var.bucket_name
}

output "glue_job_name" {
  description = "Nome do Glue Job para execução manual"
  value       = aws_glue_job.etl_vendas.name
}

output "glue_crawler_name" {
  description = "Nome do Glue Crawler para catalogação"
  value       = aws_glue_crawler.vendas_silver_gold.name
}

output "glue_database_name" {
  description = "Nome do banco de dados no Glue Catalog / Athena"
  value       = aws_glue_catalog_database.vendas.name
}

output "s3_raw_path" {
  description = "Caminho S3 dos dados brutos (bronze)"
  value       = "s3://${var.bucket_name}/raw/"
}

output "s3_silver_path" {
  description = "Caminho S3 da camada silver"
  value       = "s3://${var.bucket_name}/silver/"
}

output "s3_gold_path" {
  description = "Caminho S3 da camada gold"
  value       = "s3://${var.bucket_name}/gold/"
}
