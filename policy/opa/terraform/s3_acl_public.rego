package terraform.s3

# Deny S3 buckets with public ACLs.

deny[msg] {
  rc := input.resource_changes[_]
  rc.type == "aws_s3_bucket"
  rc.mode == "managed"
  after := rc.change.after
  after != null
  is_public_acl(after.acl)
  msg := sprintf("S3 bucket %s uses public ACL '%s'", [rc.name, after.acl])
}

is_public_acl(acl) {
  acl == "public-read"
}

is_public_acl(acl) {
  acl == "public-read-write"
}

is_public_acl(acl) {
  acl == "website"
}
