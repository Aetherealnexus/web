<#
convert-images.ps1

PowerShell helper to convert PNG images in web/images to WebP using cwebp or ImageMagick.

Requirements:
- Install `cwebp` (from libwebp) or ImageMagick (provides `magick`).

Usage (from web/):

    scripts\convert-images.ps1

#>
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$imgDir = Join-Path $scriptDir "..\images"

if (-not (Test-Path $imgDir)) {
    Write-Error "Images directory not found: $imgDir"
    exit 1
}

$files = Get-ChildItem -Path $imgDir -Filter "*.png"
if ($files.Count -eq 0) {
    Write-Host "No .png files found in $imgDir"
    exit 0
}

foreach ($f in $files) {
    $src = $f.FullName
    $base = [System.IO.Path]::GetFileNameWithoutExtension($src)
    $dest = Join-Path $f.DirectoryName ("$base.webp")
    Write-Host "Converting $src -> $dest"
    if (Get-Command cwebp -ErrorAction SilentlyContinue) {
        & cwebp -q 80 $src -o $dest
    } elseif (Get-Command magick -ErrorAction SilentlyContinue) {
        & magick $src -quality 80 $dest
    } else {
        Write-Warning "Please install 'cwebp' (libwebp) or ImageMagick (magick) to run this script."
    }
}

Write-Host "Done. Update your markup/meta to reference the .webp files for faster loads."