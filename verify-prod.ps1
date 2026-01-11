# Verification complete avant push
Write-Host ">>> Demarrage de la verification locale..." -ForegroundColor Cyan

# 1. Verification TypeScript
Write-Host ">>> Etape 1/4 : Verification des types (TypeScript)..." -ForegroundColor Yellow
cmd /c "npx tsc --noEmit"
if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! Erreur TypeScript detectee. Correction requise." -ForegroundColor Red
    exit 1
}
Write-Host "OK TypeScript." -ForegroundColor Green

# 2. Linting
Write-Host ">>> Etape 2/4 : Linting..." -ForegroundColor Yellow
cmd /c "npm run lint"
if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! Erreur de Linting detectee." -ForegroundColor Red
    exit 1
}
Write-Host "OK Linting." -ForegroundColor Green

# 3. Build Next.js
Write-Host ">>> Etape 3/4 : Build Next.js local..." -ForegroundColor Yellow
cmd /c "npm run build"
if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! Erreur lors du build Next.js." -ForegroundColor Red
    exit 1
}
Write-Host "OK Build Next.js." -ForegroundColor Green

# 4. Build Docker
Write-Host ">>> Etape 4/4 : Simulation Build Docker..." -ForegroundColor Yellow
# On utilise un tag temporaire pour ne pas polluer
docker build -t verify-build-temp -f app/Dockerfile .
if ($LASTEXITCODE -ne 0) {
    Write-Host "!!! Erreur lors du build Docker." -ForegroundColor Red
    Write-Host "!!! C'est cette erreur qui bloquerait la CI/CD." -ForegroundColor Gray
    exit 1
}
Write-Host "OK Build Docker." -ForegroundColor Green

# Nettoyage
docker rmi verify-build-temp | Out-Null

Write-Host ">>> TOUT EST VALIDE ! Tu peux push sans crainte." -ForegroundColor Cyan
