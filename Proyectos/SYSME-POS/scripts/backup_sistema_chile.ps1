Write-Host "=== Backup OSPOS Chile ==="
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
$dest = "backups\$ts"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

if (Test-Path "posventa.db") { Copy-Item "posventa.db" $dest }
if (Test-Path "certificates") { Copy-Item -Recurse "certificates" "$dest\certificates" }

Write-Host "Backup creado en: $dest"
