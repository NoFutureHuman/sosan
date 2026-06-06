# Reset MySQL 8.0 root password to dbtmd. Run PowerShell as Administrator.
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\reset-mysql-root-dbtmd.ps1

$ErrorActionPreference = "Stop"
$serviceName = "MySQL"
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin"
$myIni = "C:\ProgramData\MySQL\MySQL Server 8.0\my.ini"
$newPassword = "dbtmd"

if (-not (Test-Path "$mysqlBin\mysql.exe")) {
    throw "MySQL 8.0 not found at $mysqlBin"
}
if (-not (Test-Path $myIni)) {
    throw "my.ini not found at $myIni"
}

Write-Host "[1] Stopping MySQL service..."
Stop-Service -Name $serviceName -Force

$backup = "$myIni.bak.$(Get-Date -Format 'yyyyMMddHHmmss')"
Copy-Item $myIni $backup
Write-Host "    Backup: $backup"

$lines = Get-Content $myIni
if (-not ($lines -match 'skip-grant-tables')) {
    $out = New-Object System.Collections.Generic.List[string]
    foreach ($line in $lines) {
        $out.Add($line)
        if ($line -match '^\s*\[mysqld\]\s*$') {
            $out.Add('skip-grant-tables')
        }
    }
    Set-Content -Path $myIni -Value $out -Encoding UTF8
    Write-Host "[2] Added skip-grant-tables"
}

Write-Host "[3] Starting MySQL service..."
Start-Service -Name $serviceName
Start-Sleep -Seconds 5

$initSql = Join-Path $env:TEMP "mysql-init-dbtmd.sql"
Set-Content -Path $initSql -Value @(
    'FLUSH PRIVILEGES;'
    "ALTER USER 'root'@'localhost' IDENTIFIED BY '$newPassword';"
    'FLUSH PRIVILEGES;'
) -Encoding UTF8

Write-Host "[4] Setting root password..."
& "$mysqlBin\mysql.exe" -u root --connect-expired-password -e "source $initSql"

Write-Host "[5] Removing skip-grant-tables..."
Stop-Service -Name $serviceName -Force
$clean = Get-Content $myIni | Where-Object { $_ -notmatch '^\s*skip-grant-tables\s*$' }
Set-Content -Path $myIni -Value $clean -Encoding UTF8
Start-Service -Name $serviceName
Start-Sleep -Seconds 4

Write-Host "[6] Testing connection..."
& "$mysqlBin\mysql.exe" -u root "-p$newPassword" -e "SELECT 'OK' AS result;"
Write-Host "Done. Run: .\gradlew.bat bootRun"
