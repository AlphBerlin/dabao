# Row-Level Security for Multi-tenancy

This document explains how Row-Level Security (RLS) is implemented in the Dabao application to ensure proper multi-tenancy isolation.

## Overview

Row-Level Security (RLS) is a PostgreSQL feature that allows us to restrict which rows a user can see in database tables. In our multi-tenant application:

1. **Organizations** can only access their own data
2. **Projects** can only access their own data
3. **Users** can only access organizations they belong to

## Implementation

The RLS implementation consists of:

1. **Helper functions** that retrieve the current context (user ID, organization ID, project ID) from JWT claims
2. **Table policies** that filter rows based on these IDs
3. **Service role bypass** policies that allow internal services to access all data

## JWT Requirements

For RLS to work properly, your authentication system needs to include the following claims in JWTs:

- `sub`: User ID
- `org_id`: Organization ID (when user has selected an organization)
- `project_id`: Project ID (when user has selected a project)
- `role`: Set to `service_role` for service-to-service communication that bypasses RLS

## Setting up Client Authentication

When authenticating users in your applications, ensure:

1. After login, store the user ID in the JWT
2. When a user selects an organization, update the JWT with the `org_id` claim
3. When a user selects a project, update the JWT with the `project_id` claim

### Example: Updating JWT Context in Next.js (with Supabase)

```typescript
// Update the auth context when switching organizations/projects
async function switchContext({ organizationId, projectId }) {
  const { data, error } = await supabase.rpc('switch_user_context', {
    p_organization_id: organizationId,
    p_project_id: projectId
  });
  
  if (error) {
    throw error;
  }
  
  // Refresh the session to get the updated JWT
  await supabase.auth.refreshSession();
}
```

You would need to create the corresponding database function:

```sql
CREATE OR REPLACE FUNCTION switch_user_context(
  p_organization_id TEXT,
  p_project_id TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  -- Store in session variables or update claims directly
  -- This implementation depends on your auth provider
  PERFORM set_config('request.jwt.claims.org_id', p_organization_id, true);
  PERFORM set_config('request.jwt.claims.project_id', p_project_id, true);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Service-to-Service Communication

For internal services that need to bypass RLS:

1. Create service accounts with the `service_role` claim
2. Use these accounts for authenticated API calls between services
3. Never expose service role credentials to client applications

## Testing RLS Policies

Run the following tests to ensure RLS is working properly:

1. Log in as User A from Organization X and verify you can only see projects from Organization X
2. While viewing Project A, verify you cannot see data from Project B
3. Verify that switching organizations properly updates which projects are visible

## Troubleshooting

If RLS policies seem too restrictive:

1. Check that JWT claims are properly set
2. Verify that the functions like `dabao.get_current_user_id()` return the expected values
3. Temporarily disable RLS on specific tables for testing

## Security Considerations

- RLS is a last line of defense; always implement auth checks in your API layer too
- Never trust client-side code to enforce access control
- Monitor and audit database access patterns

## Applying RLS Policies

The RLS policies are applied using the `scripts/apply-rls-policies.sh` script, which should be run once after the initial database setup.

```bash
# Run with DATABASE_URL environment variable
./scripts/apply-rls-policies.sh

# Or pass the database URL directly
./scripts/apply-rls-policies.sh "postgresql://user:password@host:port/database"
```