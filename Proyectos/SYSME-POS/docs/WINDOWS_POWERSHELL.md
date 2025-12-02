# Sección Windows 11 (PowerShell)

## Requisitos
- PHP 8.1 o superior en el PATH
- Extensiones habilitadas en php.ini: intl, gd, sqlite3, openssl, curl, json

## Permitir ejecución de scripts (primer uso)
```
PowerShell como usuario:
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

## Instalación
```
./instalador_ospos_chile.ps1
```
- Crea carpetas (certificates, logs, writable/*, backups)
- Copia posventa-template.db a posventa.db si no existe

## Iniciar el sistema
```
./scripts/iniciar_ospos.ps1
```
- Abre http://localhost:8000 y lanza el servidor embebido de PHP

## Credenciales
- Usuario: admin
- Contraseña: pointofsale

## Backup manual
```
./scripts/backup_sistema_chile.ps1
```
- Crea backups\YYYYMMDD_HHmmss\ con posventa.db y certificates/

