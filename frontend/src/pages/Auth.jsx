import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
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

  const inputClass =
    "h-11 w-full rounded-xl bg-card border border-border px-4 text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h1 className="text-[22px] font-bold leading-tight mb-1">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <div className="rc-card p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Full name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={150}
                className={inputClass}
                placeholder="Your full name"
                required
              />
            </div>
          )}

          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Phone (optional)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={30}
                className={inputClass}
                placeholder="Your phone number"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              className={inputClass}
              placeholder="Your email address"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className={`${inputClass} pr-12`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-9 px-2 rounded-lg
                  text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-sm"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl border border-destructive bg-card">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isSubmitting} className="rc-btn-primary w-full">
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

        <div className="mt-5 text-center">
          <p className="text-muted-foreground text-sm">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={toggleMode}
              className="text-primary font-semibold hover:underline"
              type="button"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <div className="mt-3 text-center">
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