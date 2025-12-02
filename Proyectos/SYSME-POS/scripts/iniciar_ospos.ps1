Write-Host "=== Iniciando OSPOS Chile en http://localhost:8000 ==="

if ((Get-Command php -ErrorAction SilentlyContinue) -eq $null) {
  Write-Error "PHP no está en PATH. Instala PHP 8.1+ y vuelve a ejecutar."
  exit 1
}

Start-Process "http://localhost:8000"
php -S localhost:8000 -t public
