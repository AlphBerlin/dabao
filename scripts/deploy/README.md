# Kong Cloud Run Deployment

This directory contains scripts for deploying Kong API Gateway to Google Cloud Run.

## Prerequisites

- Google Cloud SDK installed and configured
- Docker installed
- Appropriate Google Cloud permissions:
  - Cloud Run Admin
  - Artifact Registry Admin
  - Service Account User

## Kong Deployment Script

The `deploy-kong-cloud-run.sh` script handles the deployment of Kong API Gateway to Google Cloud Run. The script:

1. Builds the Kong Docker image
2. Pushes it to Google Artifact Registry
3. Deploys it to Cloud Run with proper configuration
4. Sets up environment variables for service URLs

### Usage

```bash
./deploy-kong-cloud-run.sh [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--project-id ID` | Google Cloud project ID |
| `--region REGION` | Google Cloud region (default: asia-southeast1) |
| `--service-name NAME` | Cloud Run service name (default: dabao-kong) |
| `--image-name NAME` | Container image name (default: dabao-kong) |
| `--image-tag TAG` | Container image tag (default: current timestamp) |
| `--repository REPO` | Artifact Registry repository (default: dabao-repo) |
| `--min-instances N` | Minimum number of instances (default: 1) |
| `--max-instances N` | Maximum number of instances (default: 10) |
| `--client-url URL` | Client service URL |
| `--da-assistant-url URL` | DA Assistant service URL |
| `--mcp-server-url URL` | MCP Server service URL |
| `--web-url URL` | Web service URL |
| `--www-url URL` | WWW service URL |
| `--help` | Display help message and exit |

### Environment Variables

The following environment variables can be used instead of command line options:

- `PROJECT_ID`: Google Cloud project ID
- `REGION`: Google Cloud region
- `SERVICE_NAME`: Cloud Run service name
- `IMAGE_NAME`: Container image name
- `IMAGE_TAG`: Container image tag
- `REPOSITORY`: Artifact Registry repository
- `MIN_INSTANCES`: Minimum number of instances
- `MAX_INSTANCES`: Maximum number of instances
- `CLIENT_SERVICE_URL`: Client service URL
- `DA_ASSISTANT_SERVICE_URL`: DA Assistant service URL
- `DABAO_MCP_SERVER_SERVICE_URL`: MCP Server service URL
- `WEB_SERVICE_URL`: Web service URL
- `WWW_SERVICE_URL`: WWW service URL

## CI/CD Integration

The script is designed to work with CI/CD pipelines, including GitHub Actions. A dedicated workflow file is included in `.github/workflows/kong-deploy.yml` that automates the Kong deployment process.

### CI/CD Workflow

The GitHub Actions workflow:

1. Is triggered on changes to Kong configuration or manual workflow dispatch
2. Allows selection of deployment environment (dev/staging/prod)
3. Sets appropriate instance scaling based on environment
4. Retrieves service URLs from existing deployments or secrets
5. Calls the deployment script with the appropriate parameters

### Manual Trigger

You can manually trigger the workflow in GitHub Actions and select the target environment.

## Customization

The Kong configuration is based on environment variables that can be customized for different environments. The script uses environment substitution to configure Kong's routing to other services.

## Troubleshooting

If you encounter issues with the deployment:

1. Ensure you have the necessary GCP permissions
2. Check that authentication is working properly
3. Verify that service URLs are correct
4. Inspect Cloud Run logs for any runtime errors