import logo from "../assets/ridecomparelogo.png";
import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function Register() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    password2: "",
    full_name: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password2) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      toast.success("Registration successful!");
      navigate("/");
    } catch (error) {
      toast.error(error.response?.data?.error || "Registration failed");
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
            <h2 className="text-2xl font-bold mb-6">Create Account</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0501234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="password2"
                  value={formData.password2}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>

            <p className="mt-6 text-center text-muted-foreground text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}