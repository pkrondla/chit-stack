$ErrorActionPreference = "Continue"

Write-Host "Patching SQL Files..."
$path = "C:\PK\Source\chit-ledger\ChitLedger.Database\Tenant\RunOnce"
if (Test-Path $path) {
    $files = Get-ChildItem -Path $path -Filter "*.sql"
    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "FOREIGN KEY \(\[TenantId\]\) REFERENCES \[dbo\]\.\[Tenants\]\(\[Id\]\)") {
            Write-Host "Patching $($file.Name)..."
            $newContent = $content -replace "FOREIGN KEY \(\[TenantId\]\) REFERENCES \[dbo\]\.\[Tenants\]\(\[Id\]\)", "-- FK Removed for Split DB"
            $newContent | Set-Content $file.FullName
        }
    }
}

Write-Host "Dropping Databases..."
$connString = "Server=localhost;Database=master;User Id=sa;Password=c0rpusdata@123;TrustServerCertificate=True"
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection $connString
    $conn.Open()
    $cmd = $conn.CreateCommand()
    
    # Global
    try {
        $cmd.CommandText = "IF EXISTS(SELECT * FROM sys.databases WHERE name='ChitLedgerGlobal') BEGIN ALTER DATABASE [ChitLedgerGlobal] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [ChitLedgerGlobal]; END"
        $cmd.ExecuteNonQuery() | Out-Null
        Write-Host "Dropped ChitLedgerGlobal"
    } catch { Write-Host "Error dropping Global: $_" }

    # Tenant
    try {
        $cmd.CommandText = "IF EXISTS(SELECT * FROM sys.databases WHERE name='ChitLedgerTenant') BEGIN ALTER DATABASE [ChitLedgerTenant] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [ChitLedgerTenant]; END"
        $cmd.ExecuteNonQuery() | Out-Null
        Write-Host "Dropped ChitLedgerTenant"
    } catch { Write-Host "Error dropping Tenant: $_" }

    $conn.Close()
} catch {
    Write-Host "Connection Failed: $_"
}
