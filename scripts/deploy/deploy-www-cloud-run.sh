#!/bin/bash
# deploy-www-cloud-run.sh
# Script to deploy WWW application to Google Cloud Run
# Builds the application with production environment variables

set -e  # Exit immediately if a command exits with a non-zero status

# Configuration variables with defaults (can be overridden by environment variables)
PROJECT_ID=${PROJECT_ID:-$(gcloud config get-value project)}
REGION=${REGION:-"asia-southeast1"}
SERVICE_NAME=${SERVICE_NAME:-"dabao-www"}
IMAGE_NAME=${IMAGE_NAME:-"dabao-www"}
IMAGE_TAG=${IMAGE_TAG:-$(date +%Y%m%d-%H%M%S)}
REPOSITORY=${REPOSITORY:-"dabao-repo"}
MIN_INSTANCES=${MIN_INSTANCES:-1}
MAX_INSTANCES=${MAX_INSTANCES:-10}
CPU=${CPU:-"1"}
MEMORY=${MEMORY:-"512Mi"}
TIMEOUT=${TIMEOUT:-"300s"}
CONCURRENCY=${CONCURRENCY:-"80"}
PORT=${PORT:-3000}
ENV_FILE=${ENV_FILE:-".env.production"}

# Function to display help message
show_help() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  --project-id ID           Google Cloud project ID"
  echo "  --region REGION           Google Cloud region (default: asia-southeast1)"
  echo "  --service-name NAME       Cloud Run service name (default: dabao-www)"
  echo "  --image-name NAME         Container image name (default: dabao-www)"
  echo "  --image-tag TAG           Container image tag (default: current timestamp)"
  echo "  --repository REPO         Artifact Registry repository (default: dabao-repo)"
  echo "  --min-instances N         Minimum number of instances (default: 1)"
  echo "  --max-instances N         Maximum number of instances (default: 10)"
  echo "  --env-file FILE           Environment file to use (default: .env.production)"
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
    --env-file)
      ENV_FILE="$2"
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
  
  if ! command -v pnpm &>/dev/null; then
    missing_tools+=("pnpm")
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
  
  # Check if the environment file exists
  local env_file_path="$(dirname "$0")/../../apps/www/$ENV_FILE"
  if [[ ! -f "$env_file_path" ]]; then
    echo "Warning: Environment file $ENV_FILE not found at $env_file_path"
    echo "Creating a default $ENV_FILE file..."
    touch "$env_file_path"
  fi
}

# Build the Next.js application with production settings
build_www_app() {
  echo "Building WWW Next.js application with production settings"
  
  # Navigate to the www app directory
  cd "$(dirname "$0")/../../apps/www" || exit 1
  
  # Ensure dependencies are installed
  echo "Installing dependencies..."
  pnpm install
  
  # Build with production environment
  echo "Building with $ENV_FILE..."
  cp "$ENV_FILE" .env.local
  
  # Build the Next.js application
  pnpm run build
  
  echo "WWW Next.js application built successfully."
}

# Build and tag the www Docker image
build_www_image() {
  local full_image_name="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY/$IMAGE_NAME:$IMAGE_TAG"
  
  echo "Building WWW Docker image: $full_image_name"
  
  # Navigate to the www app directory
  cd "$(dirname "$0")/../../" || exit 1
  
  # Build the Docker image
  docker build -t "$full_image_name" -f apps/www/Dockerfile .
  
  echo "WWW Docker image built successfully."
  
  IMAGE_URL="$full_image_name"
}

# Push the image to Google Artifact Registry
push_image() {
  echo "Configuring Docker to use Google Cloud credentials"
  gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet
  
  echo "Pushing WWW image to Artifact Registry: $IMAGE_URL"
  docker push "$IMAGE_URL"
  
  echo "WWW Docker image pushed successfully."
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

# Extract environment variables from the env file
extract_env_vars() {
  echo "Extracting environment variables from $ENV_FILE"
  
  local env_file_path="$(dirname "$0")/../../apps/www/$ENV_FILE"
  ENV_VARS=""
  
  # Read the env file and prepare variables for Cloud Run
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^# ]]; then
      continue
    fi
    
    # Add to environment variables string
    if [[ -n "$ENV_VARS" ]]; then
      ENV_VARS="$ENV_VARS,"
    fi
    ENV_VARS="$ENV_VARS$line"
  done < "$env_file_path"
  
  echo "Environment variables extracted successfully."
}

# Deploy WWW to Google Cloud Run
deploy_to_cloud_run() {
  echo "Deploying WWW to Google Cloud Run: $SERVICE_NAME"
  
  # Extract environment variables
  extract_env_vars
  
  # Deploy to Cloud Run
  echo "Deploying to Cloud Run with environment variables from $ENV_FILE"
  
  # Base command with required parameters
  local deploy_cmd="gcloud run deploy $SERVICE_NAME \
    --image=$IMAGE_URL \
    --platform=managed \
    --region=$REGION \
    --project=$PROJECT_ID \
    --port=$PORT \
    --memory=$MEMORY \
    --cpu=$CPU \
    --min-instances=$MIN_INSTANCES \
    --max-instances=$MAX_INSTANCES \
    --timeout=$TIMEOUT \
    --concurrency=$CONCURRENCY \
    --allow-unauthenticated"
  
  # Add environment variables if any were found
  if [[ -n "$ENV_VARS" ]]; then
    deploy_cmd="$deploy_cmd --set-env-vars=$ENV_VARS"
  fi
  
  # Execute the deployment command
  eval "$deploy_cmd"
  
  echo "WWW application deployed successfully to Google Cloud Run."
  
  # Get the service URL
  SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --platform=managed \
    --region="$REGION" \
    --project="$PROJECT_ID" \
    --format='value(status.url)')
  
  echo "WWW application is now available at: $SERVICE_URL"
}

# Main function to orchestrate the deployment
main() {
  echo "Starting WWW application deployment to Google Cloud Run"
  echo "Project: $PROJECT_ID"
  echo "Region: $REGION"
  echo "Service: $SERVICE_NAME"
  echo "Environment: $ENV_FILE"
  
  check_requirements
  validate_config
  ensure_repository
  build_www_app
  build_www_image
  push_image
  deploy_to_cloud_run
  
  echo "WWW application deployment completed successfully."
}

# Execute the main function
main