#!/bin/bash
set -e

# Configuration
PROJECT_ID=${1:-"dabao-project"} # Default project ID, override as first argument
REGION=${2:-"asia-southeast1"}   # Default region, override as second argument

# Create necessary directories
mkdir -p scripts

echo "Setting up Google Cloud resources for project: $PROJECT_ID in region: $REGION"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "Error: gcloud CLI not found. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Authenticate and set project
echo "Please login to Google Cloud if not already logged in..."
gcloud auth login
gcloud config set project $PROJECT_ID

# Enable necessary APIs
echo "Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    artifactregistry.googleapis.com \
    secretmanager.googleapis.com \
    cloudresourcemanager.googleapis.com \
    iam.googleapis.com

# Create Docker repository
echo "Creating Artifact Registry Docker repository..."
gcloud artifacts repositories create dabao-repo \
    --repository-format=docker \
    --location=$REGION \
    --description="Docker repository for Dabao services"

# Set up service account for GitHub Actions
SA_NAME="github-actions-ci-cd"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Creating service account for GitHub Actions..."
gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions CI/CD"

# Assign necessary roles to the service account
echo "Assigning necessary roles to service account..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="roles/iam.serviceAccountUser"

# Create service account key for GitHub Actions
echo "Creating service account key..."
gcloud iam service-accounts keys create key.json \
    --iam-account=$SA_EMAIL

echo "Service account key created as 'key.json'. Use this content to create GitHub secrets."
echo "1. Add this content to 'GCP_SA_KEY' GitHub repository secret"
echo "2. Add '$PROJECT_ID' to 'GCP_PROJECT_ID' GitHub repository secret"
echo ""
echo "Setup complete! Follow the next steps in the README for GitHub Actions setup."