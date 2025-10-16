$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# Determine repo root (this script lives in scripts/)
$root = Split-Path -Parent $PSScriptRoot
Write-Host "== Clean Slate starting at $root =="

# 1) Stop any previously recorded local dev processes
$pidFile = Join-Path $root ".devpids.json"
if (Test-Path $pidFile) {
  try {
    $p = Get-Content $pidFile -Raw | ConvertFrom-Json
    foreach ($k in $p.PSObject.Properties.Name) {
      $pid = [int]$p.$k
      if ($pid -gt 0) {
        try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {}
      }
    }
  } catch {}
  Remove-Item -Path $pidFile -Force -ErrorAction SilentlyContinue
}

# 2) Bring down compose and remove volumes (clears redis + localstack data)
Push-Location $root
try { docker compose down -v } catch { Write-Host "docker compose down -v failed or docker not available, continuing" }
Pop-Location

# 3) Remove local SQLite decision DB(s)
$dbGlob = Join-Path $root "apps/opa-tfc/data/*.db"
Get-ChildItem $dbGlob -ErrorAction SilentlyContinue | ForEach-Object {
  try { Remove-Item $_.FullName -Force -ErrorAction SilentlyContinue; Write-Host "Removed DB: $($_.FullName)" } catch {}
}

# 4) Optional: kill kubectl proxy on :8001 if running
try {
  $k8sConns = Get-NetTCPConnection -LocalPort 8001 -State Listen -ErrorAction SilentlyContinue
  if ($k8sConns) {
    $pids = $k8sConns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $pids) { try { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue } catch {} }
  }
} catch {}

Write-Host "== Clean Slate complete. All mock/system data removed (volumes, Redis cache, LocalStack data, SQLite decisions, PIDs). =="
