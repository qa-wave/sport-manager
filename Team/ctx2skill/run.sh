#!/usr/bin/env bash
# ctx2skill wrapper for sport-manager
# Volá centrální /Users/tm/tools/ctx2skill/run-ctx2skill.sh
# (žádná lokální kopie kódu — udržuje aktuální verzi)
set -euo pipefail

CTX2SKILL_HOME="${CTX2SKILL_HOME:-/Users/tm/tools/ctx2skill}"
if [[ ! -d "${CTX2SKILL_HOME}" ]]; then
  echo "✗ ctx2skill not found at ${CTX2SKILL_HOME}" >&2
  echo "  set CTX2SKILL_HOME env var or install ctx2skill there" >&2
  exit 1
fi

exec "${CTX2SKILL_HOME}/run-ctx2skill.sh" "$@"
