import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useAuthLogin } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const authLogin = useAuthLogin();
  const { toast } = useToast();

  const handleFillDemo = () => {
    setEmail("demo@tradevision.in");
    setPassword("TradeVision@2025");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    authLogin.mutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/dashboard");
        },
        onError: () => {
          toast({
            title: "Login failed",
            description: "Invalid email or password.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-3xl pointer-events-none" />

      <Link href="/" className="absolute top-6 left-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-indigo-600 z-10">
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <Sparkles className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-muted-foreground mt-1">Sign in to your premium dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="premium-card p-6 sm:p-8 space-y-5">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
                data-testid="input-email"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                data-testid="input-password"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            data-testid="button-login"
            className="w-full h-11 font-bold text-base bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-lg shadow-indigo-500/30"
            disabled={authLogin.isPending}
          >
            {authLogin.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-indigo-100" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-2 text-muted-foreground font-bold tracking-widest">Demo access</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            data-testid="button-fill-demo"
            className="w-full h-11 border-indigo-200 hover:bg-indigo-50 font-semibold"
            onClick={handleFillDemo}
          >
            Auto-fill demo credentials
          </Button>
        </form>
      </div>
    </div>
  );
}
