# Script de verification complete de la preparation a la production
# Ce script verifie le TypeScript, le Linting et le Build Next.js.

$ErrorActionPreference = "Stop"

function Write-Header($msg) {
    Write-Host "`n=== $msg ===" -ForegroundColor Cyan -BackgroundColor Black
}

function Write-Success($msg) {
    Write-Host "V $msg" -ForegroundColor Green
}

function Write-Error-Msg($msg) {
    Write-Host "X $msg" -ForegroundColor Red
}

$results = @{
    TypeScript = $false
    Linting    = $false
    Build      = $false
}

Write-Header "Demarrage de la verification complete"

# 1. TypeScript
Write-Host "Etape 1/3 : Verification des types (TypeScript)..." -ForegroundColor Yellow
try {
    npx tsc --noEmit -p tsconfig.json
    $results.TypeScript = $true
    Write-Success "TypeScript OK"
} catch {
    Write-Error-Msg "Erreur TypeScript detectee."
}

# 2. Linting
Write-Host "Etape 2/3 : Verification du Linting..." -ForegroundColor Yellow
try {
    npm run lint
    $results.Linting = $true
    Write-Success "Linting OK"
} catch {
    Write-Error-Msg "Erreur de Linting detectee."
}

# 3. Build Next.js
Write-Host "Etape 3/3 : Simulation du Build Next.js..." -ForegroundColor Yellow
try {
    npm run build
    $results.Build = $true
    Write-Success "Build Next.js OK"
} catch {
    Write-Error-Msg "Erreur lors du build Next.js."
}

Write-Header "Resume de la verification"
foreach ($key in $results.Keys) {
    if ($results[$key]) {
        Write-Host "  [PASS] $key" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] $key" -ForegroundColor Red
    }
}

if ($results.ContainsValue($false)) {
    Write-Host "`n!!! Certaines verifications ont echoue. Corrigez-les avant de push." -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "`n>>> TOUT EST VALIDE ! Le projet est pret pour la production." -ForegroundColor Green
    exit 0
}
