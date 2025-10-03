terraform {
  required_providers {
    null = {
      source  = "hashicorp/null"
      version = "~> 3.2"
    }
  }
}

variable "encryption" {
  type = bool
}

variable "acl" {
  type = string
}

# Represent an S3 bucket via a null_resource and triggers we can read from the plan JSON
resource "null_resource" "s3" {
  triggers = {
    encryption = var.encryption ? "true" : "false"
    acl        = var.acl
  }
}
