package terraform.s3

# Deny S3 buckets that lack server-side encryption configuration.

deny contains msg if {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket"
  rc.mode == "managed"
  after := rc.change.after
  after != null
  not encrypted(after)
  msg := sprintf("S3 bucket %s missing server-side encryption configuration", [rc.name])
}

encrypted(obj) if {
  some i
  obj.server_side_encryption_configuration.rule[i].apply_server_side_encryption_by_default.sse_algorithm
}
