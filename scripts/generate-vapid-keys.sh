#!/usr/bin/env bash
# generate-vapid-keys.sh
# Generates VAPID keys for web push notifications.
# Requires: Node.js + npx (available in the monorepo)
#
# Usage: bash scripts/generate-vapid-keys.sh

set -euo pipefail

echo ""
echo "Generating VAPID keys for web push notifications..."
echo ""

# Ensure web-push is available (install temporarily if needed)
if ! npx --yes web-push generate-vapid-keys 2>/dev/null; then
  echo "Failed to generate VAPID keys. Make sure Node.js and npx are available."
  exit 1
fi

echo ""
echo "Copy the keys above into your .env file:"
echo "  VAPID_PUBLIC_KEY=\"<Public Key>\""
echo "  VAPID_PRIVATE_KEY=\"<Private Key>\""
echo "  VAPID_SUBJECT=\"mailto:admin@sport-manager.qawave.ai\""
echo ""
