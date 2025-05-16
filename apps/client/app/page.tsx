import { DashboardPage } from "@/components/dashboard-page";
import { ProjectContextDisplay } from "@/components/project-context-display";
import { getServerProjectContext } from "@/lib/server-context";

export default async function Home() {
  // Get project context on the server
  const projectContext = await getServerProjectContext();
  
  return (
    <div className="space-y-6">
      {/* Server-side project context info */}
      {projectContext && (
        <div className="bg-muted p-4 rounded-lg mb-4">
          <p className="text-sm font-medium mb-2">Server-side project context:</p>
          <p className="text-xs">Project ID: {projectContext.projectId}</p>
          <p className="text-xs">Domain: {projectContext.domain}</p>
        </div>
      )}
      {/* Client-side project context component */}
      <div className="mt-8">
        <ProjectContextDisplay />
      </div>
    </div>
  );
}
