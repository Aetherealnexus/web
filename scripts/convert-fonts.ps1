<#
convert-fonts.ps1

PowerShell helper to convert PlayfairDisplay TTF fonts to WOFF2 using Google's woff2_compress tool.

Requirements:
- Download and install Google woff2 (https://github.com/google/woff2) and ensure `woff2_compress` is on PATH.

Usage (from web/):

    scripts\convert-fonts.ps1

This script will convert all .ttf in `Playfair_Display/static` to .woff2 next to the originals.
#>

$fontDir = Join-Path $PSScriptRoot "..\Playfair_Display\static"
if (-not (Test-Path $fontDir)) {
    Write-Error "Font directory not found: $fontDir"
    exit 1
}

$files = Get-ChildItem -Path $fontDir -Filter "*.ttf"
if ($files.Count -eq 0) {
    Write-Host "No .ttf files found in $fontDir"
    exit 0
}

foreach ($f in $files) {
    $src = $f.FullName
    $dest = "$($src).woff2"
    Write-Host "Converting $src -> $dest"
    $proc = Start-Process -FilePath "woff2_compress" -ArgumentList ("`"$src`"") -NoNewWindow -Wait -PassThru -ErrorAction SilentlyContinue
    if ($proc -and $proc.ExitCode -eq 0) {
        Write-Host "Converted: $src"
    } else {
        Write-Warning "Conversion failed for $src — ensure woff2_compress is installed and on PATH."
    }
}

Write-Host "Done. If conversion succeeded, copy/move the generated .woff2 files into your fonts folder and update @font-face in CSS to use .woff2 sources first."