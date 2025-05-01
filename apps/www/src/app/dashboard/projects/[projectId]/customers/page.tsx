"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Search, 
  PlusCircle, 
  Filter, 
  Download, 
  MoreHorizontal, 
  User, 
  Mail,
  Phone,
  Award,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { Pagination } from "@/components/pagination";
import { format } from "date-fns";

// Types
interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  externalId: string | null;
  totalPoints: number;
  lastActive: string | null;
  _count: {
    rewards: number;
    activities: number;
    referrals: number;
  };
}

export default function CustomersPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  
  // Parse search params
  const currentPage = Number(searchParams.get("page") || "1");
  const searchQuery = searchParams.get("search") || "";
  const pageSize = 10;

  // State
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Load customers data
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        const url = `/api/projects/${projectId}/customers?page=${currentPage}&limit=${pageSize}${searchQuery ? `&search=${searchQuery}` : ""}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error("Failed to load customers");
        }
        
        const data = await response.json();
        setCustomers(data.customers);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error("Error loading customers:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCustomers();
  }, [projectId, currentPage, pageSize, searchQuery]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    
    if (searchInput) {
      params.set("search", searchInput);
    } else {
      params.delete("search");
    }
    
    params.set("page", "1");
    router.push(`/dashboard/projects/${projectId}/customers?${params.toString()}`);
  };
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/dashboard/projects/${projectId}/customers?${params.toString()}`);
  };
  
  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      const response = await fetch(`/api/projects/${projectId}/customers/export${searchQuery ? `?search=${searchQuery}` : ""}`);
      
      if (!response.ok) {
        throw new Error("Export failed");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting customers:", error);
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Customers</h1>
          <p className="text-muted-foreground">
            Manage your loyalty program customers
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <Button onClick={handleExportCsv} variant="outline" size="sm" disabled={exportLoading}>
            {exportLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
          <Button asChild>
            <a href={`/dashboard/projects/${projectId}/customers/new`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Customer
            </a>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <form onSubmit={handleSearch} className="md:max-w-xs w-full flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search customers..."
                  className="pl-8"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </form>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : customers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">
                            {customer.name || customer.email.split("@")[0]}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span>{customer.email}</span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.externalId && (
                            <Badge variant="outline" className="mt-1 text-xs w-fit">
                              ID: {customer.externalId}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.totalPoints.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{customer._count.activities}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{customer._count.rewards}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.lastActive 
                          ? format(new Date(customer.lastActive), "MMM d, yyyy")
                          : "Never"
                        }
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <a href={`/dashboard/projects/${projectId}/customers/${customer.id}`}>
                                <User className="mr-2 h-4 w-4" />
                                View Profile
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/dashboard/projects/${projectId}/points?customer=${customer.id}`}>
                                <Award className="mr-2 h-4 w-4" />
                                Issue Points
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={`/dashboard/projects/${projectId}/customers/${customer.id}/edit`}>
                                Edit Customer
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <User className="h-12 w-12 text-muted-foreground/60 mb-4" />
              <h3 className="text-lg font-medium mb-1">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? `No customers match the search term "${searchQuery}"`
                  : "Start by adding your first customer to the loyalty program"}
              </p>
              <Button asChild>
                <a href={`/dashboard/projects/${projectId}/customers/new`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Customer
                </a>
              </Button>
            </div>
          )}
          
          {!loading && customers.length > 0 && (
            <div className="mt-4">
              <Pagination
                totalItems={totalCount}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}