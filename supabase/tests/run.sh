#!/usr/bin/env bash
# Applies every migration, the seed, and the RLS tests to a throwaway Postgres.
#
# This is what proves the schema actually runs before it reaches a Supabase
# project — including that one account genuinely cannot read another's rows.
#
#   ./supabase/tests/run.sh              # uses a local cluster on port 54329
#   PGURL=postgres://... ./run.sh        # or point at any Postgres
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"

PSQL=(psql -v ON_ERROR_STOP=1 -q -c 'set client_min_messages = warning')
if [[ -n "${PGURL:-}" ]]; then
  PSQL+=("$PGURL")
else
  PSQL+=(-h "${PGHOST:-/tmp/celadon-pg}" -p "${PGPORT:-54329}" -U "${PGUSER:-postgres}" -d "${PGDATABASE:-celadon_test}")
fi

echo "→ harness (auth schema, roles)"
"${PSQL[@]}" -f "$HERE/harness.sql"

for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "→ $(basename "$migration")"
  "${PSQL[@]}" -f "$migration"
done

echo "→ seed.sql"
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"

echo "→ rls.test.sql"
"${PSQL[@]}" -f "$HERE/rls.test.sql"

echo "✓ schema applied and row-level security verified"
