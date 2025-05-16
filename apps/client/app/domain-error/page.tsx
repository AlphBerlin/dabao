import Link from 'next/link';
import { Button } from '@workspace/ui/comonents/button';

export default function DomainError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold">Domain Error</h1>
        
        <div className="space-y-4">
          <p className="text-lg">
            This domain is not linked to any active project or hasn't been verified yet.
          </p>
          
          <p className="text-muted-foreground">
            If you're the administrator of this site, please check your domain settings
            in the project dashboard and ensure the domain is properly configured.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Button asChild variant="default">
            <Link href="https://dabao.in">
              Go to Main Platform
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="mailto:support@dabao.in">
              Contact Support
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
