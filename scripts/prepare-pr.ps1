# prepare-pr.ps1
# PowerShell script to create a branch, commit all changes, and print push/PR instructions.

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location (Join-Path $scriptDir "..")

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Error "No changes to commit. Make your changes first."
    exit 1
}

$branch = "perf/audit-$(Get-Date -Format yyyyMMddHHmm)"
Write-Host "Creating branch: $branch"

git checkout -b $branch

git add -A
$msg = 'chore(perf): prepare audit branch (fonts/images/ci)'
git commit -m $msg

Write-Host "Branch created and changes committed. To push and open a PR, run:"
Write-Host "  git push -u origin $branch"
Write-Host "Then open a PR on GitHub from $branch to main. The CI workflow will run automatically."
Write-Host "Or use the GitHub CLI: gh pr create --fill --base main --head $branch --title 'Perf: Audit assets' --body 'See CI Lighthouse and pa11y reports attached.'"
