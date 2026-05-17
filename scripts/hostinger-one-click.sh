#!/usr/bin/env bash
# =============================================================================
# Vedic Tatva — One-Click Hostinger VPS Setup
# =============================================================================
# Run this ONCE on a fresh Hostinger VPS (Ubuntu 22.04 / Debian 12):
#
#   curl -fsSL https://raw.githubusercontent.com/<YOU>/vedictatva/main/scripts/hostinger-one-click.sh | bash
#
# OR after cloning the repo:
#   bash scripts/hostinger-one-click.sh
#
# What it does:
#   1. Installs Docker + Docker Compose v2
#   2. Installs Coolify (self-hosted PaaS)
#   3. Prints next steps for configuring your app in Coolify
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $*"; }
info() { echo -e "${CYAN}[i]${NC} $*"; }
warn() { echo -e "${YELLOW}[!]${NC} $*"; }
fail() { echo -e "${RED}[✗]${NC} $*"; exit 1; }

# ── Root check ───────────────────────────────────────────────────────────────
[[ "$EUID" -eq 0 ]] || fail "Please run as root: sudo bash scripts/hostinger-one-click.sh"

# ── OS check ─────────────────────────────────────────────────────────────────
. /etc/os-release 2>/dev/null || true
if [[ "${ID:-}" != "ubuntu" && "${ID:-}" != "debian" ]]; then
  warn "This script is tested on Ubuntu 22.04 / Debian 12. Proceeding anyway…"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       Vedic Tatva — Hostinger VPS + Coolify Setup        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── 1. System update ─────────────────────────────────────────────────────────
info "Updating system packages…"
apt-get update -qq
apt-get install -y -qq curl wget git openssl ufw

# ── 2. Docker ────────────────────────────────────────────────────────────────
if command -v docker &>/dev/null; then
  log "Docker already installed: $(docker --version)"
else
  info "Installing Docker Engine…"
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
  log "Docker installed: $(docker --version)"
fi

# ── 3. Coolify ───────────────────────────────────────────────────────────────
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q "coolify"; then
  log "Coolify container is already running."
else
  info "Installing Coolify v4…"
  curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
  log "Coolify installed and started."
fi

# ── 4. Firewall ──────────────────────────────────────────────────────────────
info "Configuring UFW firewall…"
ufw --force reset >/dev/null
ufw default deny incoming >/dev/null
ufw default allow outgoing >/dev/null
ufw allow 22/tcp comment 'SSH' >/dev/null
ufw allow 80/tcp comment 'HTTP' >/dev/null
ufw allow 443/tcp comment 'HTTPS' >/dev/null
ufw allow 8000/tcp comment 'Coolify UI' >/dev/null
ufw --force enable >/dev/null
log "Firewall configured (22, 80, 443, 8000 open)."

# ── 5. Print summary ─────────────────────────────────────────────────────────
VPS_IP=$(curl -4 -fsSL ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete!                           ║"
echo "╠══════════════════════════════════════════════════════════════╣"
echo "║                                                              ║"
printf "║  Coolify UI:   http://%-38s ║\n" "${VPS_IP}:8000"
echo "║                                                              ║"
echo "║  Next steps:                                                 ║"
echo "║  1. Open Coolify UI and create your admin account           ║"
echo "║  2. Connect your GitHub account in Coolify settings         ║"
echo "║  3. Follow HOSTINGER_COOLIFY.md to deploy Vedic Tatva       ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
info "Full deployment guide: cat HOSTINGER_COOLIFY.md"
