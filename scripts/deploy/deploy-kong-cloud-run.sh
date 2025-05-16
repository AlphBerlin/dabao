#!/bin/bash
# deploy-kong-cloud-run.sh
# Script to deploy Kong API Gateway to Google Cloud Run
# Designed to work both locally and in CI/CD pipelines

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration variables with defaults (can be overridden by environment variables)
PROJECT_ID=${PROJECT_ID:-$(gcloud config get-value project)}
REGION=${REGION:-"asia-southeast1"}
SERVICE_NAME=${SERVICE_NAME:-"dabao-kong"}
IMAGE_NAME=${IMAGE_NAME:-"dabao-kong"}
IMAGE_TAG=${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}
REPOSITORY=${REPOSITORY:-"dabao-repo"}
MIN_INSTANCES=${MIN_INSTANCES:-1}
MAX_INSTANCES=${MAX_INSTANCES:-10}
CPU=${CPU:-"1"}
MEMORY=${MEMORY:-"512Mi"}
TIMEOUT=${TIMEOUT:-"300s"}
CONCURRENCY=${CONCURRENCY:-"80"}
PORT=${PORT:-8000}

# Service URLs (defaults can be overwritten via environment variables)
CLIENT_SERVICE_URL=${CLIENT_SERVICE_URL:-"https://dabao-client-HASH-REGION_ID.run.app"}
DA_ASSISTANT_SERVICE_URL=${DA_ASSISTANT_SERVICE_URL:-"https://dabao-da-assistant-HASH-REGION_ID.run.app"}
DABAO_MCP_SERVER_SERVICE_URL=${DABAO_MCP_SERVER_SERVICE_URL:-"https://dabao-dabao-mcp-server-HASH-REGION_ID.run.app"}
WEB_SERVICE_URL=${WEB_SERVICE_URL:-"https://dabao-web-HASH-REGION_ID.run.app"}
WWW_SERVICE_URL=${WWW_SERVICE_URL:-"https://dabao-www-HASH-REGION_ID.run.app"}

# Function to display help message
show_help() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --project-id ID           Google Cloud project ID"
  echo "  --region REGION           Google Cloud region"
  echo "  --service-name NAME       Cloud Run service name"
  echo "  --image-name NAME         Container image name"
  echo "  --image-tag TAG           Container image tag"
  echo "  --repository REPO         Artifact Registry repository"
  echo "  --min-instances N         Minimum number of instances"
  echo "  --max-instances N         Maximum number of instances"
  echo "  --client-url URL          Client service URL"
  echo "  --da-assistant-url URL    DA Assistant service URL"
  echo "  --mcp-server-url URL      MCP Server service URL"
  echo "  --web-url URL             Web service URL"
  echo "  --www-url URL             WWW service URL"
  echo "  --help                    Display this help message and exit"
}

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-id)
      PROJECT_ID="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    --service-name)
      SERVICE_NAME="$2"
      shift 2
      ;;
    --image-name)
      IMAGE_NAME="$2"
      shift 2
      ;;
    --image-tag)
      IMAGE_TAG="$2"
      shift 2
      ;;
    --repository)
      REPOSITORY="$2"
      shift 2
      ;;
    --min-instances)
      MIN_INSTANCES="$2"
      shift 2
      ;;
    --max-instances)
      MAX_INSTANCES="$2"
      shift 2
      ;;
    --client-url)
      CLIENT_SERVICE_URL="$2"
      shift 2
      ;;
    --da-assistant-url)
      DA_ASSISTANT_SERVICE_URL="$2"
      shift 2
      ;;
    --mcp-server-url)
      DABAO_MCP_SERVER_SERVICE_URL="$2"
      shift 2
      ;;
    --web-url)
      WEB_SERVICE_URL="$2"
      shift 2
      ;;
    --www-url)
      WWW_SERVICE_URL="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Ensure required tools are available
check_requirements() {
  local missing_tools=()
  
  if ! command -v gcloud &>/dev/null; then
    missing_tools+=("gcloud")
  fi
  
  if ! command -v docker &>/dev/null; then
    missing_tools+=("docker")
  fi
  
  if [[ ${#missing_tools[@]} -gt 0 ]]; then
    echo "Error: Required tools are missing: ${missing_tools[*]}"
    echo "Please install them and try again."
    exit 1
  fi
}

# Validate project configuration
validate_config() {
  if [[ -z "$PROJECT_ID" ]]; then
    echo "Error: PROJECT_ID is not set. Please set it using --project-id or PROJECT_ID environment variable."
    exit 1
  fi
  
  # Check if user is authenticated with gcloud
  if ! gcloud auth print-identity-token >/dev/null 2>&1; then
    echo "Error: Not authenticated with Google Cloud. Please run 'gcloud auth login' first."
    exit 1
  fi
}

# Build and tag the Kong Docker image
build_kong_image() {
  local full_image_name="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$IMAGE_TAG"
  
  echo "Building Kong Docker image: $full_image_name"
  
  # Navigate to the root directory of Kong configuration
  cd "$(dirname "$0")/../../docker/kong" || exit 1
  
  # Build the Docker image
  docker build -t "$full_image_name" .
  
  echo "Kong Docker image built successfully."
  
  IMAGE_URL="$full_image_name"
}

# Push the image to Google Artifact Registry
push_image() {
  echo "Configuring Docker to use Google Cloud credentials"
  gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
  
  echo "Pushing Kong image to Artifact Registry: $IMAGE_URL"
  docker push "$IMAGE_URL"
  
  echo "Kong Docker image pushed successfully."
}

# Create or ensure the Artifact Registry repository exists
ensure_repository() {
  echo "Ensuring Artifact Registry repository exists: $REPOSITORY"
  
  # Check if repository exists
  if gcloud artifacts repositories describe "$REPOSITORY" \
    --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
    
    echo "Repository $REPOSITORY already exists."
  else    
    echo "Creating Artifact Registry repository: $REPOSITORY"
    # Create repository
    if ! gcloud artifacts repositories create "$REPOSITORY" \
      --repository-format=docker \
      --location="$REGION" \
      --project="$PROJECT_ID" \
      --description="Repository for Dabao services"; then
      
      echo "Error: Failed to create repository. Checking if it was created anyway..."
      
      # Check again after a brief pause - it might have been created despite the error
      sleep 5
      if gcloud artifacts repositories describe "$REPOSITORY" \
        --location="$REGION" --project="$PROJECT_ID" >/dev/null 2>&1; then
        echo "Repository exists despite error. Continuing..."
      else
        echo "Repository creation failed. Please check your permissions and network connectivity."
        exit 1
      fi
    fi
  fi
}

# Create a temporary kong.yml file with the updated service URLs
create_kong_config() {
  echo "Creating Kong configuration with service URLs"
  
  # Create a temporary directory
  TEMP_DIR=$(mktemp -d)
  
  # Copy Kong configuration files to the temporary directory
  cp -r "$(dirname "$0")/../../docker/kong/config" "$TEMP_DIR/"
  
  # Create or update variables for replacement
  cat > "$TEMP_DIR/env_vars.txt" << EOF
CLIENT_SERVICE_URL=$CLIENT_SERVICE_URL
DA_ASSISTANT_SERVICE_URL=$DA_ASSISTANT_SERVICE_URL
DABAO_MCP_SERVER_SERVICE_URL=$DABAO_MCP_SERVER_SERVICE_URL
WEB_SERVICE_URL=$WEB_SERVICE_URL
WWW_SERVICE_URL=$WWW_SERVICE_URL
EOF
  
  echo "Configuration prepared with the following service URLs:"
  cat "$TEMP_DIR/env_vars.txt"
}

# Deploy Kong to Google Cloud Run
deploy_to_cloud_run() {
  echo "Deploying Kong to Google Cloud Run: $SERVICE_NAME"
  
  # Deploy to Cloud Run
  gcloud run deploy "$SERVICE_NAME" \
    --image="$IMAGE_URL" \
    --platform=managed \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --port="$PORT" \
    --memory="$MEMORY" \
    --cpu="$CPU" \
    --min-instances="$MIN_INSTANCES" \
    --max-instances="$MAX_INSTANCES" \
    --timeout="$TIMEOUT" \
    --concurrency="$CONCURRENCY" \
    --set-env-vars="KONG_DATABASE=off,KONG_DECLARATIVE_CONFIG=/usr/local/kong/kong-processed.yml,CLIENT_SERVICE_URL=$CLIENT_SERVICE_URL,DA_ASSISTANT_SERVICE_URL=$DA_ASSISTANT_SERVICE_URL,DABAO_MCP_SERVER_SERVICE_URL=$DABAO_MCP_SERVER_SERVICE_URL,WEB_SERVICE_URL=$WEB_SERVICE_URL,WWW_SERVICE_URL=$WWW_SERVICE_URL" \
    --allow-unauthenticated
  
  echo "Kong deployed successfully to Google Cloud Run."
  
  # Get the service URL
  SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform=managed \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format='value(status.url)')
  
  echo "Kong API Gateway is now available at: $SERVICE_URL"
}

# Main function to orchestrate the deployment
main() {
  echo "Starting Kong deployment to Google Cloud Run"
  echo "Project: $PROJECT_ID"
  echo "Region: $REGION"
  echo "Service: $SERVICE_NAME"
  
  check_requirements
  validate_config
  ensure_repository
  build_kong_image
  push_image
  create_kong_config
  deploy_to_cloud_run
  
  echo "Kong deployment completed successfully."
}

# Execute the main function
main