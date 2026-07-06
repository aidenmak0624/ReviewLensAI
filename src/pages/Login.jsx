import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BarChart3, Loader2, AlertCircle, MailCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { session, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Already logged in — go straight to the app
  if (session) {
    return <Navigate to="/" replace />;
  }

  const from = location.state?.from?.pathname ?? "/";
  const isSignup = mode === "signup";

  const toggleMode = () => {
    setMode(isSignup ? "signin" : "signup");
    setError(null);
    setNotice(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    if (isSignup && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setPending(true);
    try {
      if (isSignup) {
        const { data, error: signUpError } = await signUp(email.trim(), password);
        if (signUpError) {
          setError(signUpError.message);
        } else if (data?.session) {
          // Email confirmation disabled — session is live immediately
          navigate(from, { replace: true });
        } else if (data?.user) {
          // Email confirmation enabled — no session until the link is clicked
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        const { error: signInError } = await signIn(email.trim(), password);
        if (signInError) {
          setError(signInError.message);
        } else {
          navigate(from, { replace: true });
        }
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold text-foreground">
          ReviewLens
          <span className="text-primary ml-0.5">AI</span>
        </span>
      </div>

      <div className="w-full max-w-sm bg-white rounded-lg border border-border p-6">
        <h1 className="text-lg font-semibold mb-1">
          {isSignup ? "Create your account" : "Sign in"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {isSignup
            ? "Start analysing customer reviews in minutes."
            : "Welcome back — sign in to continue."}
        </p>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        )}

        {notice && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4 flex items-start gap-3">
            <MailCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{notice}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={pending}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-1.5">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "At least 6 characters" : "Your password"}
              disabled={pending}
              className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignup ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            onClick={toggleMode}
            className="text-primary font-medium hover:underline"
          >
            {isSignup ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
