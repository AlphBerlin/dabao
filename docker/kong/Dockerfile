# 1. Use the official Kong image
FROM kong:latest

# 2. Install any extra tools you need as root
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    curl \
    jq \
    gettext-base \
    && rm -rf /var/lib/apt/lists/*

# 3. Copy your declarative config into Kong’s expected directory
#    (We’ll assume you have a single .yml or .yaml under config/)
COPY config/kong.yml /usr/local/kong/declarative/kong.yml

# 4. Switch back to the Kong user
USER kong

# 5. Enable DB-less mode and point at your declarative file;
#    explicitly open both the Proxy and Admin ports
ENV KONG_DATABASE=off \
    KONG_DECLARATIVE_CONFIG=/usr/local/kong/declarative/kong.yml \
    KONG_PROXY_LISTEN="0.0.0.0:8000,0.0.0.0:8443 ssl" \
    KONG_ADMIN_LISTEN="0.0.0.0:8001,0.0.0.0:8444 ssl"

ENV CLIENT_SERVICE_URL=http://dabao-client.internal:8080
ENV DA_ASSISTANT_SERVICE_URL=http://dabao-da-assistant.internal:8080
ENV DABAO_MCP_SERVER_SERVICE_URL=http://dabao-dabao-mcp-server.internal:8080
ENV WEB_SERVICE_URL=http://dabao-web.internal:8080
ENV WWW_SERVICE_URL=http://dabao-www.internal:8080

# 6. Expose all the ports Kong will actually bind
EXPOSE 8000
EXPOSE 8443
EXPOSE 8001
EXPOSE 8444

# 7. Use Kong’s built-in entrypoint and default to `kong start`
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["kong", "docker-start"]
