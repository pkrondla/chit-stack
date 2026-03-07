$ErrorActionPreference = "Stop"

$server = "localhost"
$user = "sa"
$pass = "c0rpusdata@123"
$globalDb = "ChitLedgerGlobal"
$tenantDb = "ChitLedgerTenant"

$connStringMaster = "Server=$server;Database=master;User Id=$user;Password=$pass;TrustServerCertificate=True;MultipleActiveResultSets=true"

function Execute-Sql($connectionString, $sql) {
    $conn = New-Object System.Data.SqlClient.SqlConnection $connectionString
    try {
        $conn.Open()
        $cmd = $conn.CreateCommand()
        $cmd.CommandText = $sql
        $cmd.ExecuteNonQuery() | Out-Null
    } finally {
        $conn.Close()
    }
}

function Run-ScriptFolder($connectionString, $folderPath) {
    $files = Get-ChildItem -Path $folderPath -Filter "*.sql" | Sort-Object Name
    foreach ($file in $files) {
        Write-Host "Executing $($file.Name)..."
        $sql = Get-Content $file.FullName -Raw
        # Remove GO statements as ExecuteNonQuery doesn't handle them well usually, or split by GO
        # Simple split by GO assumption (case insensitive, separate lines)
        $batches = $sql -split "(?m)^\s*GO\s*$"
        foreach ($batch in $batches) {
            if (-not [string]::IsNullOrWhiteSpace($batch)) {
                Execute-Sql $connectionString $batch
            }
        }
    }
}

Write-Host "Dropping Databases if exists..."
Execute-Sql $connStringMaster "IF EXISTS(SELECT * FROM sys.databases WHERE name = '$globalDb') BEGIN ALTER DATABASE [$globalDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$globalDb]; END"
Execute-Sql $connStringMaster "IF EXISTS(SELECT * FROM sys.databases WHERE name = '$tenantDb') BEGIN ALTER DATABASE [$tenantDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$tenantDb]; END"

Write-Host "Creating Databases..."
Execute-Sql $connStringMaster "CREATE DATABASE [$globalDb];"
Execute-Sql $connStringMaster "CREATE DATABASE [$tenantDb];"
Write-Host "Databases Created."

$globalConn = "Server=$server;Database=$globalDb;User Id=$user;Password=$pass;TrustServerCertificate=True;MultipleActiveResultSets=true"
$tenantConn = "Server=$server;Database=$tenantDb;User Id=$user;Password=$pass;TrustServerCertificate=True;MultipleActiveResultSets=true"

Write-Host "Deploying Global Schema..."
Run-ScriptFolder $globalConn "C:\PK\Source\chit-ledger\ChitLedger.Database\Global\RunOnce"

Write-Host "Deploying Tenant Schema..."
Run-ScriptFolder $tenantConn "C:\PK\Source\chit-ledger\ChitLedger.Database\Tenant\RunOnce"

Write-Host "Database Initialization Complete!"
