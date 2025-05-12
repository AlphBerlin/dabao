FROM kong:latest

USER root

# Install necessary tools
RUN apk update && \
    apk add curl jq bash

# Copy custom configuration
COPY config/*.yml /usr/local/kong/
COPY config/*.conf /etc/kong/
COPY entrypoint.sh /docker-entrypoint.sh

# Make entrypoint executable
RUN chmod +x /docker-entrypoint.sh

# Set proper ownership
RUN chown -R kong:kong /usr/local/kong /etc/kong

USER kong

ENTRYPOINT ["/docker-entrypoint.sh"]

CMD ["kong", "docker-start"]