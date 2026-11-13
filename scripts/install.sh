#!/usr/bin/env bash
# DeployKit One-Command Installer (macOS / Linux)
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/thomascw404/DeployKit/main/scripts/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/thomascw404/DeployKit/main/scripts/install.sh | bash -s -- --yes --agents all
set -euo pipefail

REPO_URL="https://github.com/thomascw404/DeployKit.git"
TARGET_DIR="${DEPLOYKIT_DIR:-$HOME/DeployKit}"
AGENTS="${DEPLOYKIT_AGENTS:-}"
SKIP_MCP="${DEPLOYKIT_SKIP_MCP:-0}"
ASSUME_YES="${DEPLOYKIT_YES:-0}"
DRY_RUN=0
SKIP_DEPS=0

while [ $# -gt 0 ]; do
  case "$1" in
    --dir)
      TARGET_DIR="$2"
      shift 2
      ;;
    --dir=*)
      TARGET_DIR="${1#*=}"
      shift
      ;;
    --agents)
      AGENTS="$2"
      shift 2
      ;;
    --agents=*)
      AGENTS="${1#*=}"
      shift
      ;;
    --skip-mcp)
      SKIP_MCP=1
      shift
      ;;
    --yes|-y)
      ASSUME_YES=1
      shift
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-deps)
      SKIP_DEPS=1
      shift
      ;;
    --help|-h)
      echo "Usage: install.sh [--dir <path>] [--agents <claude|cursor|antigravity|hermes|user|all>] [--skip-mcp] [--yes] [--dry-run]"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

OS_NAME="$(uname -s 2>/dev/null || echo Linux)"
print_install_hint() {
  local tool="$1"
  case "$OS_NAME" in
    Darwin*)
      case "$tool" in
        git)  echo "  Install Git    : xcode-select --install   (or: brew install git)" ;;
        node) echo "  Install Node   : brew install node@22     (or: brew install fnm && fnm install 22)" ;;
        gh)   echo "  Install gh CLI : brew install gh && gh auth login" ;;
      esac
      ;;
    MINGW*|MSYS*|CYGWIN*)
      case "$tool" in
        git)  echo "  Install Git    : winget install --id Git.Git -e --source winget" ;;
        node) echo "  Install Node   : winget install --id OpenJS.NodeJS.LTS -e   (or: winget install Schniz.fnm && fnm install 22)" ;;
        gh)   echo "  Install gh CLI : winget install --id GitHub.cli -e && gh auth login" ;;
      esac
      ;;
    *)
      case "$tool" in
        git)  echo "  Install Git    : sudo apt-get update && sudo apt-get install -y git" ;;
        node) echo "  Install Node   : curl -fsSL https://fnm.vercel.app/install | bash && fnm install 22" ;;
        gh)   echo "  Install gh CLI : sudo apt-get install -y gh && gh auth login  (https://cli.github.com)" ;;
      esac
      ;;
  esac
}

MISSING=0
if ! command -v git >/dev/null 2>&1; then
  echo "✗ Missing prerequisite: git"
  print_install_hint git
  MISSING=1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "✗ Missing prerequisite: node (>= 22.23.0 required)"
  print_install_hint node
  MISSING=1
else
  NODE_OK="$(node -e 'const [M,m]=process.versions.node.split(".").map(Number); process.stdout.write(M>22||(M===22&&m>=23)?"1":"0")')"
  if [ "$NODE_OK" != "1" ]; then
    echo "✗ Outdated Node.js: found $(node -v), requires >= v22.23.0"
    print_install_hint node
    MISSING=1
  fi
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "✗ Missing prerequisite: gh (GitHub CLI)"
  print_install_hint gh
  MISSING=1
fi

if [ "$MISSING" -ne 0 ]; then
  echo ""
  echo "Please install the missing prerequisite(s) above and re-run this installer."
  exit 1
fi

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[dry-run] Would clone or update $REPO_URL in \"$TARGET_DIR\""
else
  if [ -d "$TARGET_DIR/.git" ]; then
    echo "→ Updating existing DeployKit checkout in \"$TARGET_DIR\"..."
    git -C "$TARGET_DIR" pull --ff-only
  elif [ ! -f "$TARGET_DIR/package.json" ]; then
    echo "→ Cloning DeployKit into \"$TARGET_DIR\"..."
    mkdir -p "$(dirname "$TARGET_DIR")"
    git clone "$REPO_URL" "$TARGET_DIR"
  fi
fi

SETUP_ARGS=(--dir "$TARGET_DIR")
[ -n "$AGENTS" ] && SETUP_ARGS+=(--agents "$AGENTS")
[ "$SKIP_MCP" = "1" ] && SETUP_ARGS+=(--skip-mcp)
[ "$ASSUME_YES" = "1" ] && SETUP_ARGS+=(--yes)
[ "$DRY_RUN" = "1" ] && SETUP_ARGS+=(--dry-run)
[ "$SKIP_DEPS" = "1" ] && SETUP_ARGS+=(--skip-deps)

SETUP_SCRIPT="$TARGET_DIR/scripts/setup.mjs"
if [ "$DRY_RUN" -eq 1 ] && [ ! -f "$SETUP_SCRIPT" ]; then
  echo "[dry-run] Would execute: node \"$SETUP_SCRIPT\" ${SETUP_ARGS[*]}"
  exit 0
fi

# Reconnect stdin to /dev/tty when piped through `curl ... | bash` if interactive prompts are desired
if [ "$ASSUME_YES" != "1" ] && [ ! -t 0 ] && [ -e /dev/tty ]; then
  node "$SETUP_SCRIPT" "${SETUP_ARGS[@]}" </dev/tty
else
  node "$SETUP_SCRIPT" "${SETUP_ARGS[@]}"
fi
