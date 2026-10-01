$root = "C:\Users\mnpro\OneDrive\Documentos\SITES E APLICATIVOS MUNDONET\GERENCIMENTO MARKETING"
$outFolder = Join-Path $root "out"

if (!(Test-Path $outFolder)) {
    Write-Host "ERRO: Pasta 'out' nao encontrada!" -ForegroundColor Red
    Write-Host "Execute 'npm run build' primeiro." -ForegroundColor Yellow
    exit 1
}

$files = Get-ChildItem -Path $outFolder -Recurse -File
$fileCount = $files.Count
$size = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PASTA OUT PRONTA PARA DEPLOY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Localizacao: $outFolder" -ForegroundColor Yellow
Write-Host "Arquivos:    $fileCount" -ForegroundColor White
Write-Host "Tamanho:     $size MB" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  COMO FAZER DEPLOY NA NETLIFY" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Acesse app.netlify.com" -ForegroundColor White
Write-Host "2. Selecione seu site" -ForegroundColor White
Write-Host "3. Va em 'Deposits'" -ForegroundColor White
Write-Host "4. Arraste a PASTA 'out' (nao o ZIP)" -ForegroundColor Yellow
Write-Host ""
Write-Host "IMPORTANTE: Arraste a PASTA inteira 'out', nao um ZIP!" -ForegroundColor Red
Write-Host ""
