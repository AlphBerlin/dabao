"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@workspace/auth/lib/actions/auth";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@workspace/ui/components/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await forgotPassword({ 
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Show success message
      setSuccess(true);
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
          <CardTitle className="text-2xl font-bold">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a reset link
          </CardDescription>
        </CardHeader>
        
        {success ? (
          <CardContent className="space-y-4">
            <Alert className="bg-green-50 text-green-800 border-green-200">
              <AlertDescription>
                Password reset link has been sent to your email. Please check your inbox.
              </AlertDescription>
            </Alert>
            
            <div className="text-center mt-4">
              <Link href="/auth/login" className="text-primary hover:underline">
                Back to login
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
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
            </CardContent>
            
            <CardFooter className="flex flex-col">
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
              
              <div className="mt-4 text-center text-sm">
                Remember your password?{" "}
                <Link href="/auth/login" className="text-primary hover:underline">
                  Back to login
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
