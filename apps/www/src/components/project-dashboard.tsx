import { Project, ProjectPreference, CustomerActivity } from "@prisma/client";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Activity, Users, Gift, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface CustomerWithName {
  name: string | null;
  email: string;
}

interface ActivityWithCustomer extends CustomerActivity {
  customer: CustomerWithName;
}

interface ProjectWithPreferences extends Project {
  preferences: ProjectPreference | null;
}

interface ProjectDashboardProps {
  project: ProjectWithPreferences;
  customers: number;
  activeRewards: number;
  totalPoints: number;
  recentActivities: ActivityWithCustomer[];
}

export function ProjectDashboard({
  project,
  customers,
  activeRewards,
  totalPoints,
  recentActivities,
}: ProjectDashboardProps) {
  
  const pointsName = project.preferences?.pointsName || "Points";

  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Customer count card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers}</div>
            <p className="text-xs text-muted-foreground">
              <Link href={`/dashboard/${project.id}/customers`} className="text-primary underline underline-offset-4">
                View all customers
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Active rewards card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Rewards</CardTitle>
            <Gift className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRewards}</div>
            <p className="text-xs text-muted-foreground">
              <Link href={`/dashboard/${project.id}/rewards`} className="text-primary underline underline-offset-4">
                Manage rewards
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Total points issued */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total {pointsName} Issued</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints?.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <Link href={`/dashboard/${project.id}/settings/points`} className="text-primary underline underline-offset-4">
                Points settings
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Program status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Program Status</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={project.active ? "default" : "destructive"}>
                {project.active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              <Link href={`/dashboard/${project.id}/settings`} className="text-primary underline underline-offset-4">
                Program settings
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Customer Activities</CardTitle>
          <CardDescription>Recent events across your loyalty program</CardDescription>
        </CardHeader>
        <CardContent>
          {recentActivities.length > 0 ? (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 border rounded-md"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {activity.customer.name || activity.customer.email.split('@')[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.description || activity.type}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {activity.pointsEarned && (
                      <Badge variant="outline" className="text-xs">
                        +{activity.pointsEarned} {pointsName}
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent activities</p>
          )}
        </CardContent>
        <CardFooter>
          <Link 
            href={`/dashboard/${project.id}/activities`} 
            className="text-sm text-primary underline underline-offset-4"
          >
            View all activities
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}