# Domain-Based Authentication Guide

This document outlines how to use domain-based authentication to access Dabao APIs with your custom domain.

## Overview

Domain-based authentication enables you to associate a domain or subdomain with your project, and then create clients with API keys that can only access data related to that specific domain. This provides enhanced security and data isolation between different projects and domains.

## Setting Up Domain Authentication

### 1. Register a Domain

First, you need to register a domain in your project settings:

1. Navigate to your project settings page
2. Go to the "Domains" tab
3. Click "Add Domain"
4. Choose domain type:
   - **Subdomain**: a subdomain of dabao.in (e.g., your-brand.dabao.in)
   - **Custom Domain**: your own domain (e.g., rewards.your-company.com)
   - **Alias**: an alternative domain that points to your primary domain

### 2. Verify Your Domain (for Custom Domains)

If you've registered a custom domain, you'll need to verify ownership:

1. Add the provided TXT record to your domain's DNS settings
2. The TXT record should be added to `_dabao-verify.your-domain.com`
3. Click "Verify Domain" once the DNS record is set up
4. For verified domains, set up the required CNAME or A records to point to our servers

### 3. Create a Client

After your domain is verified:

1. Select your domain in the Domains/Clients tab
2. Click "Add Client"
3. Fill in the required information:
   - Client name: A descriptive name for this client
   - Description (optional): What this client is used for
   - Allowed IPs: Restrict API access to specific IP addresses (use * for any IP)

### 4. Save Your API Credentials

Upon client creation, you'll receive:

- Client ID: Public identifier for your client
- Client Secret: Used for OAuth authentication flows
- API Key: Used for direct API authentication

**Important**: The Client Secret and API Key will only be shown once. Store them securely!

## Using Domain Authentication

### Authentication Methods

#### 1. API Key Authentication

For most API calls, use the API key in the Authorization header:

```http
GET /api/rewards
Host: your-domain.dabao.in
Authorization: Bearer your_api_key
```

#### 2. OAuth 2.0 (for web applications)

For web applications, you can use the OAuth 2.0 flow:

1. Redirect users to `/api/auth/authorize?client_id=your_client_id&redirect_uri=your_callback_url`
2. Once authorized, users will be redirected back with a code
3. Exchange the code for an access token using your client secret
4. Use the access token in API requests

### Domain Context

When authenticating with a domain, all API requests will be automatically scoped to that domain's project. This means you'll only be able to access:

- Rewards/vouchers associated with the domain's project
- Customers registered through that domain
- Campaign data for the specific project

## Security Considerations

### IP Restrictions

To enhance security, consider restricting API access to specific IP addresses. This can be configured when creating or editing a client.

### Periodic Key Rotation

For security best practices, rotate your API keys periodically. Create a new client, update your applications to use the new keys, then delete the old client.

### Usage Monitoring

Monitor your API usage through the dashboard to detect any unusual patterns that might indicate unauthorized access.

## API Error Responses

When authentication fails, you might receive one of these error responses:

- `401 Unauthorized`: Invalid or missing API key
- `403 Forbidden`: API key is valid, but not authorized for this domain or action
- `403 Forbidden`: IP address not in the allowed list
