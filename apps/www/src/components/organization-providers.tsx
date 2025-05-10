import { getCurrentOrganizationId } from "@/lib/utils/server-utils";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { OrganizationProvider } from "@/contexts/organization-context";
import { UserProvider } from "@/contexts/user-context";
import { ReactNode } from "react";

interface OrganizationProvidersProps {
  children: ReactNode;
}

/**
 * Server component that initializes the OrganizationProvider and UserProvider with data from the server
 */
export async function OrganizationProviders({
  children,
}: OrganizationProvidersProps) {
  // Try to get current organization ID from cookie or user's first org
  const orgId = await getCurrentOrganizationId();

  // Fetch organizations and selected organization details
  let organizations :any[]= [];
  let currentOrganization = null;
  let userData = null;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Get user with associated organizations
      const dbUser = await db.user.findUnique({
        where: { supabaseUserId: user.id },
        include: {
          organizations: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (dbUser) {
        // Store user data for the UserProvider
        userData = dbUser;
        
        // Transform organizations data for the client
        organizations = dbUser.organizations.map((userOrg) => ({
          id: userOrg.organization.id,
          name: userOrg.organization.name,
          slug: userOrg.organization.slug,
          logo: userOrg.organization.logo,
          role: userOrg.role,
        }));

        // Find the current organization if we have an ID
        if (orgId) {
          const org = organizations.find((org) => org.id === orgId);
          if (org) {
            currentOrganization = org;
          }
        }

        // Default to the first organization if no current org is found
        if (!currentOrganization && organizations.length > 0) {
          currentOrganization = organizations[0];
          
          // Set the cookie for subsequent requests
          cookies().set("orgId", currentOrganization.id, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        }
      }
    }
  } catch (error) {
    console.error("Error initializing user and organization context:", error);
  }

  return (
    <UserProvider 
      initialUser={userData} 
      initialOrganizations={organizations.map(org => org.organization)}
    >
      <OrganizationProvider
        initialOrganization={currentOrganization}
        initialOrganizations={organizations}
      >
        {children}
      </OrganizationProvider>
    </UserProvider>
  );
}