"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { Badge } from "@workspace/ui/components/badge";
import { Progress } from "@workspace/ui/components/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import {  CreditCard, Download, Loader2,  Plus } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { getCreditInfo, getPlanInfo, getLicenses, getTransactions, purchaseCredits, changePlan, createLicense, revokeLicense } from "@/lib/api/settings";

interface BillingSettingsProps {
  projectId: string;
}

export function BillingSettings({ projectId }: BillingSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [creditInfo, setCreditInfo] = useState<{credits: number, maxCredits: number}>({ credits: 0, maxCredits: 0 });
  const [planInfo, setPlanInfo] = useState<{
    name: string;
    price: number;
    billingCycle: string;
    status: string;
    startDate: string;
    nextBillingDate: string;
    features: string[];
  }>({
    name: "",
    price: 0,
    billingCycle: "",
    status: "",
    startDate: "",
    nextBillingDate: "",
    features: []
  });
  
  const [licenses, setLicenses] = useState<{
    id: string;
    name: string;
    status: string;
    type: string;
    seats: number;
    usedSeats: number;
    expiresAt: string;
  }[]>([]);
  
  const [transactions, setTransactions] = useState<{
    id: string;
    type: string;
    amount: number;
    date: string;
    description: string;
    status: string;
  }[]>([]);

  const [isPurchasingCredits, setIsPurchasingCredits] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(false);
  const [showBuyCreditsDialog, setShowBuyCreditsDialog] = useState(false);
  const [purchaseAmount, setPurchaseAmount] = useState(10);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState(planInfo.name);
  const [showNewLicenseDialog, setShowNewLicenseDialog] = useState(false);
  const [newLicenseName, setNewLicenseName] = useState("");
  const [newLicenseType, setNewLicenseType] = useState("developer");
  const [newLicenseSeats, setNewLicenseSeats] = useState(1);

  // Available plans for this project
  const availablePlans = [
    { 
      name: "free", 
      label: "Free", 
      price: 0, 
      features: ["5 active projects", "Basic analytics", "Community support"]
    },
    { 
      name: "starter", 
      label: "Starter", 
      price: 29, 
      features: ["10 active projects", "Advanced analytics", "Email support", "Custom domain"]
    },
    { 
      name: "pro", 
      label: "Professional", 
      price: 79, 
      features: ["Unlimited projects", "Team collaboration", "Priority support", "Custom branding", "API access", "Advanced integrations"]
    },
    { 
      name: "enterprise", 
      label: "Enterprise", 
      price: 299, 
      features: ["Everything in Pro", "Dedicated account manager", "Custom contract", "SLA", "99.9% uptime guarantee", "SSO & advanced security"]
    }
  ];

  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setIsLoading(true);
        const [credits, plan, licenseList, transactionList] = await Promise.all([
          getCreditInfo(projectId),
          getPlanInfo(projectId),
          getLicenses(projectId),
          getTransactions(projectId)
        ]);
        
        setCreditInfo(credits);
        setPlanInfo(plan);
        setLicenses(licenseList);
        setTransactions(transactionList);
        setNewPlan(plan.name);
      } catch (error) {
        toast.error("Failed to load billing information");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBillingData();
  }, [projectId]);

  const handleBuyCredits = async () => {
    if (purchaseAmount <= 0) return;
    
    setIsPurchasingCredits(true);
    try {
      const result = await purchaseCredits(projectId, purchaseAmount);
      setCreditInfo(current => ({
        ...current,
        credits: current.credits + purchaseAmount
      }));
      setTransactions([result.transaction, ...transactions]);
      setShowBuyCreditsDialog(false);
      toast.success(`Successfully purchased ${purchaseAmount} credits`);
    } catch (error) {
      toast.error("Failed to purchase credits");
      console.error(error);
    } finally {
      setIsPurchasingCredits(false);
    }
  };

  const handleChangePlan = async () => {
    setIsBillingLoading(true);
    try {
      const updatedPlan = await changePlan(projectId, newPlan);
      setPlanInfo(updatedPlan);
      setShowChangePlanDialog(false);
      toast.success(`Successfully changed plan to ${availablePlans.find(p => p.name === newPlan)?.label}`);
    } catch (error) {
      toast.error("Failed to change plan");
      console.error(error);
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleCreateLicense = async () => {
    if (!newLicenseName) return;
    
    setIsBillingLoading(true);
    try {
      const newLicense = await createLicense(projectId, {
        name: newLicenseName,
        type: newLicenseType,
        seats: newLicenseSeats
      });
      
      setLicenses([...licenses, newLicense]);
      setShowNewLicenseDialog(false);
      toast.success("License created successfully");
      
      // Reset form
      setNewLicenseName("");
      setNewLicenseType("developer");
      setNewLicenseSeats(1);
    } catch (error) {
      toast.error("Failed to create license");
      console.error(error);
    } finally {
      setIsBillingLoading(false);
    }
  };

  const handleRevokeLicense = async (licenseId: string) => {
    if (!confirm("Are you sure you want to revoke this license? This action cannot be undone.")) {
      return;
    }
    
    try {
      await revokeLicense(projectId, licenseId);
      setLicenses(licenses.map(license => 
        license.id === licenseId 
          ? { ...license, status: "revoked" } 
          : license
      ));
      toast.success("License revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke license");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowChangePlanDialog(true)}>
              Change Plan
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-medium capitalize">{planInfo.name} Plan</h3>
                <p className="text-muted-foreground">
                  {planInfo.price > 0 ? `$${planInfo.price}/${planInfo.billingCycle}` : 'Free'}
                </p>
              </div>
              <Badge 
                variant={planInfo.status === "active" ? "default" : "secondary"}
                className={planInfo.status === "active" ? "bg-green-500" : ""}
              >
                {planInfo.status === "active" ? "Active" : planInfo.status === "canceled" ? "Canceled" : "Past Due"}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Start Date</h4>
                <p>{format(parseISO(planInfo.startDate), 'MMMM d, yyyy')}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-1">Next Billing Date</h4>
                <p>{planInfo.price > 0 ? format(parseISO(planInfo.nextBillingDate), 'MMMM d, yyyy') : 'N/A'}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="text-sm font-medium mb-2">Plan Features</h4>
              <ul className="list-disc pl-5 space-y-1">
                {planInfo.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Credits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Credits</CardTitle>
              <CardDescription>Manage your API and processing credits</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowBuyCreditsDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Buy Credits
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-medium">{creditInfo.credits} credits</h3>
                  <p className="text-sm text-muted-foreground">
                    {creditInfo.credits > 0 ? `${((creditInfo.credits / creditInfo.maxCredits) * 100).toFixed(0)}% of your monthly limit used` : 'No credits available'}
                  </p>
                </div>
                {creditInfo.maxCredits > 0 && (
                  <Badge variant="outline">
                    {creditInfo.maxCredits} monthly limit
                  </Badge>
                )}
              </div>
              <Progress 
                value={(creditInfo.credits / creditInfo.maxCredits) * 100}
                className="h-2"
              />
            </div>

            <div className="bg-muted/50 p-4 rounded-md text-sm space-y-3">
              <p className="font-medium">What are credits used for?</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>API requests</li>
                <li>AI model usage</li>
                <li>Image generation</li>
                <li>Advanced analytics</li>
              </ul>
              <p className="text-muted-foreground">
                Credits refresh on your billing date. Unused credits don't roll over.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Licenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Licenses</CardTitle>
              <CardDescription>Manage developer and integration licenses</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowNewLicenseDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create License
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No licenses created yet
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {licenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.name}</TableCell>
                      <TableCell className="capitalize">{license.type}</TableCell>
                      <TableCell>
                        <Badge
                          variant={license.status === 'active' ? 'default' : 'secondary'}
                          className={license.status === 'active' ? 'bg-green-500' : ''}
                        >
                          {license.status === 'active' 
                            ? 'Active' 
                            : license.status === 'expired'
                              ? 'Expired'
                              : 'Revoked'
                          }
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {license.usedSeats} / {license.seats}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(license.expiresAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        {license.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeLicense(license.id)}
                            className="text-red-500"
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View your transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No transactions yet
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(parseISO(transaction.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="capitalize">{transaction.type}</TableCell>
                      <TableCell>${transaction.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                          className={
                            transaction.status === 'completed' ? 'bg-green-500' : 
                            transaction.status === 'pending' ? 'bg-yellow-500' : ''
                          }
                        >
                          {transaction.status === 'completed' ? 'Paid' : 
                           transaction.status === 'pending' ? 'Pending' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {transaction.status === 'completed' && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                            <span className="sr-only">Download receipt</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy Credits Dialog */}
      <Dialog open={showBuyCreditsDialog} onOpenChange={setShowBuyCreditsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Buy Credits</DialogTitle>
            <DialogDescription>
              Purchase additional credits for API usage and processing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits-amount">Number of Credits</Label>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPurchaseAmount(Math.max(1, purchaseAmount - 5))}
                >
                  -
                </Button>
                <Input 
                  id="credits-amount" 
                  type="number" 
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(Math.max(1, parseInt(e.target.value, 10) || 0))}
                  min="1"
                  className="text-center"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setPurchaseAmount(purchaseAmount + 5)}
                >
                  +
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Price</Label>
              <div className="bg-muted p-3 rounded-md">
                <div className="flex justify-between">
                  <span>{purchaseAmount} credits</span>
                  <span>${(purchaseAmount * 0.1).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>${(purchaseAmount * 0.1).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setShowBuyCreditsDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBuyCredits} 
              disabled={isPurchasingCredits || purchaseAmount <= 0}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {isPurchasingCredits ? "Processing..." : `Purchase for $${(purchaseAmount * 0.1).toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>
              Choose a new subscription plan for your project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <div className="space-y-2">
                {availablePlans.map((plan) => (
                  <div 
                    key={plan.name}
                    className={`cursor-pointer border rounded-md p-4 ${newPlan === plan.name ? 'border-primary bg-muted/50' : ''}`}
                    onClick={() => setNewPlan(plan.name)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">{plan.label}</h4>
                        <p className="text-sm text-muted-foreground">
                          {plan.price > 0 ? `$${plan.price}/month` : 'Free'}
                        </p>
                      </div>
                      <div className="h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                        {newPlan === plan.name && (
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 text-sm">
                      <ul className="list-disc pl-5 space-y-1">
                        {plan.features.slice(0, 3).map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                        {plan.features.length > 3 && (
                          <li>+{plan.features.length - 3} more features</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChangePlanDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleChangePlan} 
              disabled={isBillingLoading || newPlan === planInfo.name}
            >
              {isBillingLoading ? "Updating..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New License Dialog */}
      <Dialog open={showNewLicenseDialog} onOpenChange={setShowNewLicenseDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create License</DialogTitle>
            <DialogDescription>
              Create a new license for developers or integrations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="license-name">License Name</Label>
              <Input 
                id="license-name" 
                placeholder="e.g. Development Team License" 
                value={newLicenseName}
                onChange={(e) => setNewLicenseName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-type">License Type</Label>
              <select 
                id="license-type"
                value={newLicenseType}
                onChange={(e) => setNewLicenseType(e.target.value)}
                className="w-full border rounded-md h-10 px-3"
              >
                <option value="developer">Developer License</option>
                <option value="integration">Integration License</option>
                <option value="staging">Staging Environment</option>
                <option value="production">Production Environment</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="license-seats">Number of Seats</Label>
              <Input 
                id="license-seats" 
                type="number"
                min="1"
                value={newLicenseSeats}
                onChange={(e) => setNewLicenseSeats(Math.max(1, parseInt(e.target.value, 10) || 1))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewLicenseDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateLicense} 
              disabled={isBillingLoading || !newLicenseName}
            >
              {isBillingLoading ? "Creating..." : "Create License"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}