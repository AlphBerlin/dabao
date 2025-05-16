"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@workspace/auth/lib/actions/auth";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@workspace/ui/components/card";
import { createCustomer } from "@/lib/api/customers";
import { useProjectContext } from "@/hooks/useProjectContext";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { projectId, project } = useProjectContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 1. Create the Supabase user
      const { data, error } = await signUp({ 
        email, 
        password,
        redirectTo: `${window.location.origin}/auth/callback?redirect=/`
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // 2. Create the customer record if we have a project and user
      if (projectId && data?.user?.id) {
        try {
          await createCustomer({
            projectId,
            email,
            name,
            phone,
            supabaseUserId: data.user.id
          });
        } catch (err) {
          console.error("Failed to create customer record:", err);
          // Continue even if customer creation fails, as we can recover later
        }
      }

      // Show success message
      setSuccess("Signup successful! Please check your email to verify your account.");
      setLoading(false);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your details to create your account
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name"
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)} 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input 
                id="phone"
                type="tel" 
                placeholder="+1234567890" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)} 
                required
                minLength={8}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <Button className="w-full" type="submit" disabled={loading || !!success}>
              {loading ? "Creating account..." : "Sign up"}
            </Button>
            
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
