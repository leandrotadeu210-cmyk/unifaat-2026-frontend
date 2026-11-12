variable "bucket_name" {
  description = "Nome único do bucket S3 (inclua identificador do grupo)"
  type        = string
  default     = "grupo-unifaat-pipeline-leandro"
}

variable "lab_role_arn" {
  description = "ARN da LabRole do AWS Academy Learner Lab"
  type        = string
  default     = "arn:aws:iam::123456789012:role/LabRole"
}

variable "glue_db_name" {
  description = "Nome do banco de dados no Glue Catalog"
  type        = string
  default     = "vendas_db"
}

variable "glue_job_name" {
  description = "Nome do Glue Job"
  type        = string
  default     = "etl-vendas-medalhao"
}

variable "crawler_name" {
  description = "Nome do Glue Crawler"
  type        = string
  default     = "crawler-vendas-silver-gold"
}
