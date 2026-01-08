import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { supabase } from "@/supabaseClient";

const Login = () => {
  const [sapId, setSapId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(sapId, password);
      toast.success("Logged in successfully");
      navigate("/student/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Invalid SAP ID or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/student/dashboard`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error("Google login error:", error);
      toast.error(error.message || "Failed to sign in with Google");
    }
  };

  return (
    <AuthLayout>
      <Card className="w-full shadow-lg border-muted/40">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Sign in to your account to continue tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sapId">SAP ID</Label>
              <Input
                id="sapId"
                placeholder="Enter SAP ID"
                value={sapId}
                onChange={(e) => setSapId(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background/50"
              />
            </div>
            <Button className="w-full font-semibold" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
              Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6 bg-muted/5">
          <div className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
};

export default Login;