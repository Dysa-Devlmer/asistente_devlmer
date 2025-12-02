Write-Host "=== Instalador OSPOS Chile (Windows PowerShell) ==="

# Verificar PHP
eq (Get-Command php -ErrorAction SilentlyContinue) -ne $null
if (-not $?) { Write-Error "PHP no está en el PATH. Instala PHP 8.1+ y vuelve a ejecutar."; exit 1 }

# Crear carpetas necesarias
$dirs = @("certificates","logs","writable","writable\logs","writable\cache","writable\sessions","writable\uploads","scripts","backups")
foreach ($d in $dirs) { New-Item -ItemType Directory -Force -Path $d | Out-Null }

# Copiar base de datos plantilla si no existe
if (Test-Path "posventa-template.db" -PathType Leaf) {
  if (-not (Test-Path "posventa.db" -PathType Leaf)) {
    Copy-Item "posventa-template.db" "posventa.db"
    Write-Host "posventa.db creado desde plantilla"
  } else {
    Write-Host "posventa.db ya existe, no se sobrescribe"
  }
} else {
  Write-Warning "No se encontró posventa-template.db. Puedes generar una o usar el instalador .sh"
}

Write-Host "Instalación completada. Revisa README_CHILE_RESTAURANTES.md"
