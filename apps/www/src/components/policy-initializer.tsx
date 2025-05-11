// filepath: /Users/ajithberlin/alphberlin/repos/dabao.in/dabao/apps/www/src/components/policy-initializer.tsx
'use client';

import { useEffect, useState } from 'react';

/**
 * Component that initializes policies when the app starts
 * This is a client component that makes a request to the policy initialization API
 */
export function PolicyInitializer() {
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initPolicies = async () => {
      try {
        // Call the policy initialization API
        const response = await fetch('/api/system/init-policies');
        const data = await response.json();
        
        if (data.status === 'success' || data.status === 'skipped') {
          console.log('Policy initialization status:', data.message);
          setInitialized(true);
        } else {
          setError(`Policy initialization failed: ${data.message}`);
          console.error('Policy initialization failed:', data);
        }
      } catch (err) {
        setError(`Failed to initialize policies: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Error initializing policies:', err);
      }
    };

    if (!initialized && !error) {
      initPolicies();
    }
  }, [initialized, error]);

  // This component doesn't render anything visible
  return null;
}

export default PolicyInitializer;