#!/bin/bash
set -e

# Use environment variables for service URLs or set defaults
export CLIENT_SERVICE_URL=${CLIENT_SERVICE_URL:-http://dabao-client.internal:8080}
export DA_ASSISTANT_SERVICE_URL=${DA_ASSISTANT_SERVICE_URL:-http://dabao-da-assistant.internal:8080}
export DABAO_MCP_SERVER_SERVICE_URL=${DABAO_MCP_SERVER_SERVICE_URL:-http://dabao-dabao-mcp-server.internal:8080}
export WEB_SERVICE_URL=${WEB_SERVICE_URL:-http://dabao-web.internal:8080}
export WWW_SERVICE_URL=${WWW_SERVICE_URL:-http://dabao-www.internal:8080}

echo "Starting Kong with the following service URLs:"
echo "CLIENT_SERVICE_URL: $CLIENT_SERVICE_URL"
echo "DA_ASSISTANT_SERVICE_URL: $DA_ASSISTANT_SERVICE_URL"
echo "DABAO_MCP_SERVER_SERVICE_URL: $DABAO_MCP_SERVER_SERVICE_URL"
echo "WEB_SERVICE_URL: $WEB_SERVICE_URL"
echo "WWW_SERVICE_URL: $WWW_SERVICE_URL"

# Process kong.yml template and replace environment variables
envsubst < /usr/local/kong/kong.yml > /usr/local/kong/kong-processed.yml

# Start Kong
exec "/usr/local/bin/kong" "$@"