import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const loginGreetings = ["Welcome back", "Hey again", "Good to see you", "Hello there", "Hi again", "Nice to see you", "Hey you"];
const signupGreetings = ["Create account", "Join us", "Get started", "Let's go", "Welcome aboard", "Sign up", "Start here"];

const loginSubtitles = ["Sign in to access your saved data", "Sign in to continue where you left off", "Sign in to unlock all features"];
const signupSubtitles = ["Sign up to save your price alerts", "Create an account to sync across devices", "Join to save your favourite locations"];

function mapAuthError(err) {
  const apiData = err?.response?.data;

  if (apiData?.password) return typeof apiData.password === "string" ? apiData.password : apiData.password?.[0];
  if (apiData?.email) return typeof apiData.email === "string" ? apiData.email : apiData.email?.[0];
  if (apiData?.full_name) return typeof apiData.full_name === "string" ? apiData.full_name : apiData.full_name?.[0];
  if (apiData?.detail) return apiData.detail;
  if (apiData?.error) return apiData.error;

  const msg = err?.message || "Something went wrong";
  const lower = String(msg).toLowerCase();

  if (lower.includes("invalid") && (lower.includes("credentials") || lower.includes("password"))) {
    return "Invalid email or password. Please try again.";
  }
  if (lower.includes("already") && (lower.includes("exists") || lower.includes("registered"))) {
    return "This email is already registered. Please sign in instead.";
  }
  if (lower.includes("network")) return "Network error. Please check your connection and try again.";

  return msg;
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login, register } = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    if (next && next.startsWith("/")) return next;
    return "/compare";
  }, [location.search]);

  useEffect(() => {
    if (!loading && user) navigate(nextPath, { replace: true });
  }, [loading, user, navigate, nextPath]);

  const greeting = useMemo(() => {
    const arr = isLogin ? loginGreetings : signupGreetings;
    return arr[Math.floor(Math.random() * arr.length)];
  }, [isLogin]);

  const subtitle = useMemo(() => {
    const arr = isLogin ? loginSubtitles : signupSubtitles;
    return arr[Math.floor(Math.random() * arr.length)];
  }, [isLogin]);

  const validate = () => {
    try {
      emailSchema.parse(email);
    } catch (e) {
      setError(e?.errors?.[0]?.message || "Invalid email");
      return false;
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      setError(e?.errors?.[0]?.message || "Invalid password");
      return false;
    }

    if (!isLogin) {
      const name = displayName.trim();
      if (!name) {
        setError("Please enter your full name");
        return false;
      }
    }

    return true;
  };

  const canSubmit = useMemo(() => {
    const e = email.trim();
    const p = password;
    if (!e || !p || p.length < 6) return false;
    if (!isLogin && !displayName.trim()) return false;
    return true;
  }, [email, password, isLogin, displayName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login(email.trim(), password);
      } else {
        await register({
          email: email.trim(),
          password,
          password2: password,
          full_name: displayName.trim(),
          phone: phone.trim() || "",
        });
      }
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((v) => !v);
    setError(null);
  };

  const inputBase =
    "w-full h-11 rounded-xl bg-card/70 backdrop-blur-md border border-border/70 pl-11 pr-4 text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const iconCls = "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground";

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">{greeting}</h1>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/80 backdrop-blur-xl p-4 sm:p-6 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Full name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={150}
                className="w-full h-11 rounded-xl bg-card/70 backdrop-blur-md border border-border/70 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your full name"
                required
              />
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                className="w-full h-11 rounded-xl bg-card/70 backdrop-blur-md border border-border/70 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Your phone number"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className={iconCls} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className={inputBase}
                placeholder="Your email address"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
            <div className="relative">
              <Lock className={iconCls} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className={inputBase + " pr-12"}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg
                  text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-destructive/40 bg-card/70 backdrop-blur-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isSubmitting || !canSubmit} className="rc-btn-primary">
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : isLogin ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={toggleMode} className="text-primary font-medium hover:underline" type="button">
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/compare")}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
            type="button"
          >
            Continue without signing in →
          </button>
        </div>
      </div>
    </div>
  );
}