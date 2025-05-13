// Dynamic auth page that handles different modes (login, signup, forgot-password)
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

// Define valid auth modes
const validModes = ["login", "signup", "forgot-password"];

export default async function AuthPage({ params, searchParams }: { params: { mode: string }, searchParams: any }) {
  const { mode } = await params;
  
  // Validate the mode parameter
  if (!validModes.includes(mode)) {
    return notFound();
  }

  // Dynamically import the appropriate auth page based on mode
  try {
    // For login mode
    if (mode === "login") {
      const LoginPage = (await import("@workspace/auth/app/auth/login/page")).default;
      return <LoginPage />;
    }
    
    // For signup mode
    if (mode === "signup") {
      const SignupPage = (await import("@workspace/auth/app/auth/signup/page")).default;
      return <SignupPage />;
    }
    
    // For forgot-password mode
    if (mode === "auth-code-error") {
      const ForgotPasswordPage = (await import("@workspace/auth/app/auth/auth-code-error/page")).default;
      return <ForgotPasswordPage />;
    }
  
    // For forgot-password mode
    if (mode === "forgot-password") {
      const ForgotPasswordPage = (await import("@workspace/auth/app/auth/forgot-password/page")).default;
      return <ForgotPasswordPage />;
    }
  } catch (error) {
    console.error(`Failed to load auth page for mode: ${mode}`, error);
    return notFound();
  }
  
  // Fallback
  return notFound();
}
