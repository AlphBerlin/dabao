FROM kong:latest

USER root

# Install necessary tools (using apt-get since Kong appears to be Debian/Ubuntu based)
RUN apt-get update && \
    apt-get install -y curl jq bash gettext-base && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy custom configuration
COPY config/*.yml /usr/local/kong/
COPY config/*.conf /etc/kong/

# Copy and fix entrypoint script
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh && \
    sed -i 's/\r$//' /docker-entrypoint.sh && \
    chown kong:kong /docker-entrypoint.sh

# Set proper ownership
RUN chown -R kong:kong /usr/local/kong /etc/kong

# Create directory for processed config
RUN mkdir -p /usr/local/kong/declarative && \
    chown kong:kong /usr/local/kong/declarative

USER kong

# Set environment variables
ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/usr/local/kong/kong-processed.yml
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout \
    KONG_ADMIN_ACCESS_LOG=/dev/stdout \
    KONG_PROXY_ERROR_LOG=/dev/stderr \
    KONG_ADMIN_ERROR_LOG=/dev/stderr \
    KONG_ADMIN_LISTEN=off \
    KONG_PORT=8000
# Listen on port 8000
EXPOSE 8000 8443

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["kong", "docker-start"]