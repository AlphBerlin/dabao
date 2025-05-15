import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@workspace/ui/components/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import { format } from 'date-fns';

interface PointsTransaction {
  id: string;
  points: number;
  reason: string;
  description?: string;
  orderId?: string;
  expiresAt?: string;
  createdAt: string;
}

interface PointsTransactionsProps {
  projectId: string;
  customerId: string;
  limit?: number;
  showPagination?: boolean;
  className?: string;
}

export const PointsTransactions: React.FC<PointsTransactionsProps> = ({
  projectId,
  customerId,
  limit = 10,
  showPagination = true,
  className,
}) => {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  const fetchTransactions = async (offset: number = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/projects/${projectId}/customers/${customerId}/points?limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch points transactions');
      }
      
      const data = await response.json();
      setTransactions(data.pointsTransactions || []);
      setTotalItems(data.pagination?.total || 0);
      setPointsBalance(data.balance || 0);
      setTotalEarned(data.totalEarned || 0);
    } catch (err) {
      console.error('Error fetching points transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load points transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage * limit);
  }, [projectId, customerId, currentPage, limit]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(totalItems / limit);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Points Transactions</CardTitle>
            <CardDescription>Transaction history for customer's loyalty points</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Balance</p>
            <p className="text-2xl font-bold">{pointsBalance}</p>
            <p className="text-xs text-muted-foreground">Total Earned: {totalEarned}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p>Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-destructive">{error}</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <p>No points transactions found</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={transaction.points > 0 ? "default" : "destructive"}>
                        {transaction.points > 0 ? `+${transaction.points}` : transaction.points}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.reason}</TableCell>
                    <TableCell>{transaction.description || '-'}</TableCell>
                    <TableCell>
                      {transaction.expiresAt 
                        ? format(new Date(transaction.expiresAt), 'MMM d, yyyy') 
                        : 'Never'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {showPagination && totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                >
                  Previous
                </Button>
                <span className="mx-2">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
