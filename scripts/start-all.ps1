param(
  [switch]$Live,
  [switch]$WithLocalStack
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$root = Split-Path -Parent $PSScriptRoot
Write-Host "== Start All (Live:$Live, LocalStack:$WithLocalStack) at $root =="

# Stop previously started dev processes
$pidFile = Join-Path $root ".devpids.json"
if (Test-Path $pidFile) {
  try {
    $p = Get-Content $pidFile -Raw | ConvertFrom-Json
    foreach ($k in $p.PSObject.Properties.Name) {
      $pid = [int]$p.$k
      if ($pid -gt 0) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }
    }
  } catch {}
  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

# Infra: Redis and optional LocalStack
Push-Location $root
try { docker compose up -d redis } catch { Write-Host "Compose not available or failed, continuing" }
if ($WithLocalStack) {
  try { docker compose --profile mock up -d localstack } catch { Write-Host "LocalStack not available, continuing" }
}
Pop-Location

# K8s proxy
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
  $inUse = (Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue)
  if (-not $inUse) { Start-Process kubectl "proxy --port=8001" -WindowStyle Minimized | Out-Null }
} else { Write-Host "kubectl not found; K8s page will be empty until proxy is started" }

# UI .env.local
$uiEnvPath = Join-Path $root "apps/ui/.env.local"
@(
  "MCP_URL=http://localhost:9200",
  "OPA_TFC_URL=http://localhost:9300",
  "EDP_URL=http://localhost:8080",
  "NEXT_PUBLIC_BASE_URL=http://localhost:7200",
  "K8S_PROXY_URL=http://127.0.0.1:8001"
) | Set-Content -Path $uiEnvPath -Encoding UTF8

function Install-Deps($dir){
  Push-Location $dir
  if (Test-Path package-lock.json) { npm ci --no-audit --no-fund } else { npm i --no-audit --no-fund }
  Pop-Location
}

function Start-Dev($dir){
  Push-Location $dir
  $proc = Start-Process -FilePath "npm.cmd" -ArgumentList "run","dev" -WindowStyle Minimized -PassThru
  Pop-Location
  return $proc.Id
}

Write-Host "== Install deps =="
Install-Deps (Join-Path $root "apps/mcp-server")
Install-Deps (Join-Path $root "apps/opa-tfc")
Install-Deps (Join-Path $root "apps/external-data")
Install-Deps (Join-Path $root "apps/ui")

Write-Host "== Start dev servers =="
$mcpPid = Start-Dev (Join-Path $root "apps/mcp-server")
$opaPid = Start-Dev (Join-Path $root "apps/opa-tfc")
$edpPid = Start-Dev (Join-Path $root "apps/external-data")
$uiPid  = Start-Dev (Join-Path $root "apps/ui")

$pidMap = [ordered]@{ mcp=$mcpPid; opa=$opaPid; edp=$edpPid; ui=$uiPid }
$pidMap | ConvertTo-Json | Set-Content -Path $pidFile -Encoding UTF8

function Hit($u,[int]$tries=12){ for($i=0;$i -lt $tries;$i++){ try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $u | Out-Null; return $true } catch { Start-Sleep -Milliseconds 800 } } return $false }

Write-Host "== Fast health checks =="
$okMcp = Hit "http://localhost:9200/healthz" 12
$okOpa = Hit "http://localhost:9300/healthz" 12
$okEdp = Hit "http://localhost:8080/healthz" 12
$okUi  = Hit "http://localhost:7200" 12

$health = [pscustomobject]@{ ui=$okUi; mcp=$okMcp; opa=$okOpa; edp=$okEdp }
$health | ConvertTo-Json -Depth 5 | Write-Host

if (-not $Live -and $okOpa) {
  Write-Host "== Sample evaluate (disabled with -Live) =="
  $fail = '{"source":"cli","subject":"smoke-fail","input":{"resource":"aws_s3_bucket","encryption":false,"acl":"public-read"}}'
  $pass = '{"source":"cli","subject":"smoke-pass","input":{"resource":"aws_s3_bucket","encryption":true,"acl":"private"}}'
  try { Invoke-RestMethod -Method Post -Uri http://localhost:9300/evaluate -ContentType 'application/json' -Body $fail | Out-Null } catch {}
  try { Invoke-RestMethod -Method Post -Uri http://localhost:9300/evaluate -ContentType 'application/json' -Body $pass | Out-Null } catch {}
}

Write-Host "== Working links =="
Write-Host "UI:   http://localhost:7200"
Write-Host "MCP:  http://localhost:9200/healthz"
Write-Host "OPA:  http://localhost:9300/healthz"
Write-Host "EDP:  http://localhost:8080/healthz"
