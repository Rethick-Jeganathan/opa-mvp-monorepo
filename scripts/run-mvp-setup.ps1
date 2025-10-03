# Requires: PowerShell, kubectl, minikube
$ErrorActionPreference = "Stop"

function Write-Header($text) { Write-Host "`n=== $text ===" -ForegroundColor Cyan }
function Write-Ok($text) { Write-Host "[OK] $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "[WARN] $text" -ForegroundColor Yellow }
function Write-Err($text) { Write-Host "[ERR] $text" -ForegroundColor Red }

function Wait-NamespaceGone($name, $timeoutSec = 90) {
  $start = Get-Date
  while ($true) {
    $elapsed = (Get-Date) - $start
    if ($elapsed.TotalSeconds -ge $timeoutSec) { Write-Warn "Timeout waiting for namespace '$name' to be deleted"; break }
    $ns = kubectl get ns $name 2>$null
    if (-not $ns) { break }
    Start-Sleep -Seconds 2
  }
}

# Ensure we run from repo root
$repoRoot = (Resolve-Path "$PSScriptRoot\..\").Path
Set-Location $repoRoot
Write-Header "Repo root: $repoRoot"

# A) Cluster and Gatekeeper health
Write-Header "A) Cluster and Gatekeeper health"
try {
  $minikubeStatus = (minikube status) | Out-String
  Write-Ok "Minikube status:`n$minikubeStatus"
} catch {
  Write-Warn "minikube not running, attempting to start..."
  minikube start
}

kubectl config use-context minikube | Out-Null
Write-Ok (kubectl get nodes | Out-String)

# Install Gatekeeper (idempotent)
Write-Header "Install/Verify Gatekeeper"
kubectl apply -f https://raw.githubusercontent.com/open-policy-agent/gatekeeper/release-3.16/deploy/gatekeeper.yaml | Out-Null
kubectl -n gatekeeper-system rollout status deploy/gatekeeper-controller-manager --timeout=300s | Out-Host

# B) Deploy MCP and External Data (provider-system)
Write-Header "B) Deploy MCP & External Data (namespace, services, deployments)"
kubectl create ns provider-system --dry-run=client -o yaml | kubectl apply -f - | Out-Null

kubectl apply -f k8s/mcp/mcp-deployment.yaml | Out-Host
kubectl apply -f k8s/external-data/service.yaml | Out-Host
kubectl apply -f k8s/external-data/deployment.yaml | Out-Host

kubectl -n provider-system rollout status deploy/mcp-server --timeout=180s | Out-Host
kubectl -n provider-system rollout status deploy/external-data --timeout=180s | Out-Host

Write-Ok (kubectl -n provider-system get svc,deploy | Out-String)

# Quick in-cluster health checks via ephemeral curl pod (labelled to satisfy Gatekeeper required-labels)
Write-Header "In-cluster health checks"
try {
  kubectl -n provider-system run curl-mcp --image=curlimages/curl:8.8.0 --labels owner=mvp,env=dev --rm -i --restart=Never -- curl -sS http://mcp-server.provider-system.svc:9200/healthz | Out-Host
} catch { Write-Warn "MCP health check failed: $($_.Exception.Message)" }
try {
  kubectl -n provider-system run curl-edp --image=curlimages/curl:8.8.0 --labels owner=mvp,env=dev --rm -i --restart=Never -- curl -sS http://external-data.provider-system.svc:8080/healthz | Out-Host
} catch { Write-Warn "EDP health check failed: $($_.Exception.Message)" }

# C) Apply Provider, CT, Constraint
Write-Header "C) Gatekeeper Provider (base URL), CT, Constraint"
kubectl apply -f policy/gatekeeper/externaldata/provider.yaml | Out-Host
kubectl apply -f policy/gatekeeper/constrainttemplates/ns_env_match_template.yaml | Out-Host
kubectl apply -f policy/gatekeeper/constraints/ns_env_match.yaml | Out-Host

# Show Provider URL for debugging
try { kubectl get provider ns-env-provider -o jsonpath="Provider URL: {.spec.url}\n" | Out-Host } catch {}

# D) Rotate caBundle and restart Gatekeeper
Write-Header "D) Rotate Provider caBundle and restart Gatekeeper"
$ca = ""
try {
  $ca = kubectl -n provider-system run fetch-ca --image=curlimages/curl:8.8.0 --labels owner=mvp,env=dev --rm -i --restart=Never -- curl -sS http://external-data.provider-system.svc:8080/ca
  if (-not $ca) { throw "empty CA" }
  $b64 = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($ca.Trim()))
  $providerYaml = @"
apiVersion: externaldata.gatekeeper.sh/v1beta1
kind: Provider
metadata:
  name: ns-env-provider
spec:
  url: https://external-data.provider-system.svc:8443
  timeout: 5
  caBundle: $b64
"@
  $providerYaml | kubectl apply -f - | Out-Host
  kubectl -n gatekeeper-system rollout restart deploy/gatekeeper-controller-manager | Out-Host
  kubectl -n gatekeeper-system rollout status deploy/gatekeeper-controller-manager --timeout=180s | Out-Host
  Write-Ok "Provider caBundle rotated and Gatekeeper restarted"
} catch {
  Write-Err "Failed to rotate caBundle: $($_.Exception.Message)"
}

# E) Verify allow + 3x explicit DENY
Write-Header "E) Verify allow + 3x explicit DENY"
# Allow
try {
  kubectl delete ns dev --ignore-not-found=true | Out-Null
  kubectl apply -f policy/gatekeeper/samples/ns-ext-good.yaml | Out-Host
} catch { Write-Warn "Allow sample failed: $($_.Exception.Message)" }

# DENY x3
$denyOutputs = @()
for ($i=1; $i -le 3; $i++) {
  try {
    kubectl delete ns prod3 --ignore-not-found=true | Out-Null
    Wait-NamespaceGone -name "prod3" -timeoutSec 90
    $out = (kubectl apply -f policy/gatekeeper/samples/ns-ext-bad3.yaml) 2>&1
    $denyOutputs += $out
    Write-Host "[DENY Attempt $i]" -ForegroundColor Magenta
    Write-Host $out
  } catch {
    Write-Host "[DENY Attempt $i] error: $($_.Exception.Message)" -ForegroundColor Red
  }
}

# Summary
$explicitCount = ($denyOutputs | Where-Object { ($_ -match 'does not match external mapping') -or ($_ -match 'denied the request') }).Count
Write-Header "Summary"
Write-Host "Explicit DENY count (expected 3): $explicitCount" -ForegroundColor Cyan
if ($explicitCount -lt 3) {
  Write-Warn "Explicit DENY not stable yet. Collecting logs..."
  try { kubectl -n gatekeeper-system logs deploy/gatekeeper-controller-manager --tail=120 | Out-Host } catch {}
  try { kubectl -n provider-system logs deploy/external-data --tail=120 | Out-Host } catch {}
} else {
  Write-Ok "Explicit DENY verified stable across 3 attempts."
}

Write-Header "Done"
