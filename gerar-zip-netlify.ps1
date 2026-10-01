$root = "C:\Users\mnpro\OneDrive\Documentos\SITES E APLICATIVOS MUNDONET\GERENCIMENTO MARKETING"
$zip = Join-Path $root "deploy-netlify.zip"
$temp = "C:\Users\mnpro\AppData\Local\Temp\netlify-deploy-temp"

# Limpa temporarios anteriores
if (Test-Path $temp) { Remove-Item -Path $temp -Recurse -Force }
if (Test-Path $zip) { Remove-Item $zip -Force }

New-Item -ItemType Directory -Path $temp -Force | Out-Null

# Copia TUDO que a Netlify precisa
$items = @("src", "public", "out", "package.json", "package-lock.json",
    "next.config.ts", "tsconfig.json", "postcss.config.mjs",
    "eslint.config.mjs", "netlify.toml", "next-env.d.ts",
    "firestore.rules", "storage.rules", ".env", ".env.example",
    ".env.local", ".env.production")

foreach ($item in $items) {
    $srcPath = Join-Path $root $item
    if (Test-Path $srcPath) {
        $destPath = Join-Path $temp $item
        if ((Get-Item $srcPath).PSIsContainer) {
            Copy-Item -Path $srcPath -Destination $destPath -Recurse -Force
            Write-Host "OK (pasta): $item"
        } else {
            Copy-Item -Path $srcPath -Destination $destPath -Force
            Write-Host "OK (arquivo): $item"
        }
    } else {
        Write-Host "Nao encontrado: $item"
    }
}

# Verifica se src/app existe no temp
if (Test-Path (Join-Path $temp "src\app")) {
    Write-Host "`nsrc/app ENCONTRADO no ZIP"
} else {
    Write-Host "`nERRO: src/app NAO encontrado no ZIP"
}

# Gera o ZIP
Compress-Archive -Path (Join-Path $temp "*") -DestinationPath $zip -Force
Remove-Item -Path $temp -Recurse -Force

$size = [math]::Round((Get-Item $zip).Length / 1MB, 2)
Write-Host "`nZIP gerado: $zip" -ForegroundColor Green
Write-Host "Tamanho: $size MB" -ForegroundColor Cyan
