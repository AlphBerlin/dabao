import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Alert, AlertTitle, AlertDescription } from '@workspace/ui/components/alert';
import { IssuePointsDialog } from './issue-points-dialog';
import { ClaimPointsDialog } from './claim-points-dialog';
import { PointsTransactions } from './points-transactions';

interface CustomerPointsProps {
  projectId: string;
  customerId: string;
  isAdminView?: boolean; // Set to true for admin dashboard, false for customer-facing view
  className?: string;
}

interface CustomerData {
  id: string;
  name: string;
  email: string;
  pointsBalance: number;
  membership?: {
    tier: {
      name: string;
      level: number;
    };
  };
}

export const CustomerPoints: React.FC<CustomerPointsProps> = ({
  projectId,
  customerId,
  isAdminView = true,
  className
}) => {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchCustomerData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch customer data including membership info with points balance
        const response = await fetch(`/api/projects/${projectId}/customers/${customerId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }
        
        const data = await response.json();
        
        // Transform the data to get the information we need
        const customerData: CustomerData = {
          id: data.customer.id,
          name: data.customer.name || 'Customer',
          email: data.customer.email,
          pointsBalance: data.customer.customerMemberships?.[0]?.pointsBalance || 0,
          membership: data.customer.customerMemberships?.[0] ? {
            tier: {
              name: data.customer.customerMemberships[0].membershipTier.name,
              level: data.customer.customerMemberships[0].membershipTier.level
            }
          } : undefined
        };
        
        setCustomer(customerData);
      } catch (err) {
        console.error('Error fetching customer data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load customer data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [projectId, customerId, refreshTrigger]);

  const handleTransactionSuccess = () => {
    // Refresh data after a successful transaction
    setRefreshTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex justify-center items-center h-40">
          <p>Loading customer points data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !customer) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || 'Failed to load customer data'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{isAdminView ? `Points for ${customer.name}` : 'Your Points'}</CardTitle>
              <CardDescription>
                {customer.membership 
                  ? `${customer.membership.tier.name} Tier Member` 
                  : 'No Membership Tier'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {isAdminView ? (
                <IssuePointsDialog 
                  projectId={projectId}
                  customerId={customerId}
                  customerName={customer.name}
                  onSuccess={handleTransactionSuccess}
                  trigger={<Button>Issue Points</Button>}
                />
              ) : (
                <ClaimPointsDialog
                  projectId={projectId}
                  customerId={customerId}
                  customerName={customer.name}
                  currentBalance={customer.pointsBalance}
                  onSuccess={handleTransactionSuccess}
                  trigger={<Button>Redeem Points</Button>}
                />
              )}
              
              {isAdminView && (
                <ClaimPointsDialog
                  projectId={projectId}
                  customerId={customerId}
                  customerName={customer.name}
                  currentBalance={customer.pointsBalance}
                  onSuccess={handleTransactionSuccess}
                  trigger={<Button variant="outline">Redeem Points</Button>}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Points</p>
              <p className="text-3xl font-bold">{customer.pointsBalance}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <PointsTransactions 
        projectId={projectId}
        customerId={customerId}
        showPagination={true}
      />
    </div>
  );
};
