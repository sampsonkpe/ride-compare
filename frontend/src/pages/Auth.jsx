import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthContext } from "../context/AuthContext";
import logo from "../assets/ridecomparelogo.png";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

const loginGreetings = [
  "Welcome back",
  "Hey again",
  "Good to see you",
  "Hello there",
  "Hi again",
  "Nice to see you",
  "Hey you",
];

const signupGreetings = [
  "Create account",
  "Join us",
  "Get started",
  "Let's go",
  "Welcome aboard",
  "Sign up",
  "Start here",
];

const loginSubtitles = [
  "Sign in to access your saved data",
  "Sign in to continue where you left off",
  "Sign in to unlock all features",
];

const signupSubtitles = [
  "Sign up to save your price alerts",
  "Create an account to sync across devices",
  "Join to save your favorite locations",
];

function mapAuthError(err) {
  const apiData = err?.response?.data;

  if (apiData?.password) {
    return typeof apiData.password === "string" ? apiData.password : apiData.password?.[0];
  }
  if (apiData?.email) {
    return typeof apiData.email === "string" ? apiData.email : apiData.email?.[0];
  }
  if (apiData?.full_name) {
    return typeof apiData.full_name === "string" ? apiData.full_name : apiData.full_name?.[0];
  }
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
  if (lower.includes("network")) {
    return "Network error. Please check your connection and try again.";
  }

  return msg;
}

export default function Auth() {
  const navigate = useNavigate();
  const { user, loading, login, register } = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState(true);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/compare", { replace: true });
    }
  }, [loading, user, navigate]);

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

    // Backend requires full_name on registration
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

      navigate("/compare", { replace: true });
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="w-full py-4 px-4 md:py-6 border-b border-white/5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/compare")}
            className="p-2 -ml-2 rounded-full hover:bg-white/5 transition-colors"
            aria-label="Go back"
            type="button"
          >
            ←
          </button>

          <img src={logo} alt="RideCompare" className="h-7 md:h-8" />

          <div className="w-9" />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 pb-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">{greeting}</h1>
            <p className="text-gray-400">{subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name (signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={150}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Your full name"
                  required
                />
              </div>
            )}

            {/* Phone (optional, signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone (optional)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={30}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="Your phone number"
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                placeholder="Your email address"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="w-full px-4 py-3 pr-12 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors text-sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? "Signing in..." : "Creating account..."}
                </>
              ) : (
                isLogin ? "Sign In" : "Create Account"
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-blue-400 font-medium hover:underline"
                type="button"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>

          {/* Skip option */}
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/compare")}
              className="text-gray-400 text-sm hover:text-white transition-colors"
              type="button"
            >
              Continue without signing in →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}