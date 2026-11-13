# DeployKit One-Command Installer (Windows PowerShell)
# Usage:
#   irm https://raw.githubusercontent.com/thomascw404/DeployKit/main/scripts/install.ps1 | iex
#   & ([scriptblock]::Create((irm https://raw.githubusercontent.com/thomascw404/DeployKit/main/scripts/install.ps1))) --yes --agents all

$ErrorActionPreference = 'Stop'

$RepoUrl   = 'https://github.com/thomascw404/DeployKit.git'
$TargetDir = if ($env:DEPLOYKIT_DIR) { $env:DEPLOYKIT_DIR } else { Join-Path $HOME 'DeployKit' }
$Agents    = if ($env:DEPLOYKIT_AGENTS) { $env:DEPLOYKIT_AGENTS } else { '' }
$SkipMcp   = ($env:DEPLOYKIT_SKIP_MCP -eq '1' -or $env:DEPLOYKIT_SKIP_MCP -eq 'true')
$AssumeYes = ($env:DEPLOYKIT_YES -eq '1' -or $env:DEPLOYKIT_YES -eq 'true')
$DryRun    = $false
$SkipDeps  = $false
$ShowHelp  = $false

for ($i = 0; $i -lt $args.Count; $i++) {
  $arg = [string]$args[$i]
  if ($arg -eq '--dir' -and ($i + 1) -lt $args.Count) {
    $TargetDir = [string]$args[++$i]
  } elseif ($arg.StartsWith('--dir=')) {
    $TargetDir = $arg.Substring(6)
  } elseif ($arg -eq '--agents' -and ($i + 1) -lt $args.Count) {
    $Agents = [string]$args[++$i]
  } elseif ($arg.StartsWith('--agents=')) {
    $Agents = $arg.Substring(9)
  } elseif ($arg -eq '--skip-mcp') {
    $SkipMcp = $true
  } elseif ($arg -eq '--yes' -or $arg -eq '-y') {
    $AssumeYes = $true
  } elseif ($arg -eq '--dry-run') {
    $DryRun = $true
  } elseif ($arg -eq '--skip-deps') {
    $SkipDeps = $true
  } elseif ($arg -eq '--help' -or $arg -eq '-h') {
    $ShowHelp = $true
  }
}

if ($ShowHelp) {
  Write-Host 'Usage: install.ps1 [--dir <path>] [--agents <claude|cursor|antigravity|hermes|user|all>] [--skip-mcp] [--yes] [--dry-run]'
  return
}

$Missing = $false

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Host '✗ Missing prerequisite: git' -ForegroundColor Red
  Write-Host '  Install Git    : winget install --id Git.Git -e --source winget'
  $Missing = $true
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host '✗ Missing prerequisite: node (>= 22.23.0 required)' -ForegroundColor Red
  Write-Host '  Install Node   : winget install --id OpenJS.NodeJS.LTS -e   (or: winget install Schniz.fnm; fnm install 22)'
  $Missing = $true
} else {
  $nodeOk = (& node -e "const [M,m]=process.versions.node.split('.').map(Number); process.stdout.write(M>22||(M===22&&m>=23)?'1':'0')")
  if ($nodeOk -ne '1') {
    $nodeVer = (& node -v)
    Write-Host "✗ Outdated Node.js: found $nodeVer, requires >= v22.23.0" -ForegroundColor Red
    Write-Host '  Upgrade Node   : winget install --id OpenJS.NodeJS.LTS -e   (or: fnm install 22)'
    $Missing = $true
  }
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host '✗ Missing prerequisite: gh (GitHub CLI)' -ForegroundColor Red
  Write-Host '  Install gh CLI : winget install --id GitHub.cli -e; gh auth login'
  $Missing = $true
}

if ($Missing) {
  Write-Host "`nPlease install the missing prerequisite(s) above, restart PowerShell, and re-run this installer." -ForegroundColor Yellow
  if ($MyInvocation.InvocationName -ne '.') { exit 1 } else { return }
}

if ($DryRun) {
  Write-Host "[dry-run] Would clone or update $RepoUrl in `"$TargetDir`""
} else {
  if (Test-Path -LiteralPath (Join-Path $TargetDir '.git')) {
    Write-Host "→ Updating existing DeployKit checkout in `"$TargetDir`"..." -ForegroundColor Cyan
    & git -C "$TargetDir" pull --ff-only
  } elseif (-not (Test-Path -LiteralPath (Join-Path $TargetDir 'package.json'))) {
    Write-Host "→ Cloning DeployKit into `"$TargetDir`"..." -ForegroundColor Cyan
    $ParentDir = Split-Path -Parent $TargetDir
    if ($ParentDir -and -not (Test-Path -LiteralPath $ParentDir)) {
      New-Item -ItemType Directory -Path $ParentDir -Force | Out-Null
    }
    & git clone $RepoUrl "$TargetDir"
  }
}

$SetupArgs = @('--dir', $TargetDir)
if ($Agents)    { $SetupArgs += @('--agents', $Agents) }
if ($SkipMcp)   { $SetupArgs += '--skip-mcp' }
if ($AssumeYes) { $SetupArgs += '--yes' }
if ($DryRun)    { $SetupArgs += '--dry-run' }
if ($SkipDeps)  { $SetupArgs += '--skip-deps' }

$SetupScript = Join-Path $TargetDir 'scripts\setup.mjs'
if ($DryRun -and -not (Test-Path -LiteralPath $SetupScript)) {
  Write-Host "[dry-run] Would execute: node `"$SetupScript`" $($SetupArgs -join ' ')"
  return
}

& node "$SetupScript" @SetupArgs
if ($LASTEXITCODE -ne 0 -and $MyInvocation.InvocationName -ne '.') {
  exit $LASTEXITCODE
}
