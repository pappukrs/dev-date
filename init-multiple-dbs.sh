#!/bin/bash

export PGUSER="$POSTGRES_USER"

# Create additional databases
databases=(
    "devdate_matching"
    "devdate_compatibility"
    "devdate_reputation"
    "devdate_marketplace"
)

for db in "${databases[@]}"; do
    echo "Creating database: $db"
    psql -c "CREATE DATABASE $db;"
    psql -c "GRANT ALL PRIVILEGES ON DATABASE $db TO $POSTGRES_USER;"
done

echo "Multiple databases created successfully"
