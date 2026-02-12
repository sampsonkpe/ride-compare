import logo from "../assets/ridecomparelogo.png";
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-xl bg-card border border-border px-4 text-foreground " +
    "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  const primaryBtn =
    "w-full inline-flex items-center justify-center gap-2 h-11 px-4 rounded-xl text-sm font-semibold " +
    "bg-primary text-primary-foreground hover:opacity-90 transition " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
    "disabled:opacity-50 disabled:pointer-events-none";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <img src={logo} alt="ridecompare logo" className="h-8 mx-auto mb-2" />
            <p className="text-muted-foreground">Compare. Choose. Ride.</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <h2 className="text-2xl font-bold mb-6">Login</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-6 text-center text-muted-foreground text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}