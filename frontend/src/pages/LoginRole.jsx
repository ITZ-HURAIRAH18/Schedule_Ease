import { useState } from "react";
import axios from "../api/axiosInstance";
import { useNavigate, useParams, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { Calendar, Loader2 } from "lucide-react";

const LoginRole = () => {
  const { roleParam } = useParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleLabel = { user: "User", host: "Host", admin: "Admin" }[roleParam] || "User";

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await axios.post("/auth/login", { ...form, role: roleParam });
      login(res.data.token);
      redirect(res.data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (response) => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.post("/auth/google-login", { token: response.credential, role: roleParam });
      login(res.data.token);
      redirect(res.data.user.role);
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    } finally {
      setLoading(false);
    }
  };

  const redirect = (role) => {
    if (role === "admin") navigate("/admin/dashboard");
    else if (role === "host") navigate("/host/dashboard");
    else navigate("/user/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] bg-white border border-[#E8E4DF] rounded-[16px] p-10 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-[#C8622A] rounded-[10px] flex items-center justify-center mb-6 shadow-sm">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-[22px] font-semibold text-[#1A1A1A]">Welcome back</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">Log in to your {roleLabel} account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full h-[44px] bg-white border-[1.5px] border-[#E8E4DF] rounded-[8px] px-4 text-[14px] text-[#1A1A1A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#C8622A] focus:ring-[3px] focus:ring-[#C8622A]/10 transition-all"
              placeholder="Email address"
            />
          </div>

          <div>
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full h-[44px] bg-white border-[1.5px] border-[#E8E4DF] rounded-[8px] px-4 text-[14px] text-[#1A1A1A] placeholder:text-[#B0B0B0] focus:outline-none focus:border-[#C8622A] focus:ring-[3px] focus:ring-[#C8622A]/10 transition-all"
              placeholder="Password"
            />
          </div>

          {error && (
            <p className="text-[#B91C1C] text-[13px] bg-[#FEF2F2] p-3 rounded-[6px] border border-[#FEF2F2]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[44px] bg-[#C8622A] text-white text-[14px] font-medium rounded-[10px] flex items-center justify-center transition-colors hover:bg-[#A84E20] disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
          </button>
        </form>

        {roleParam !== "admin" && (
          <>
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-[#E8E4DF]" />
              <span className="px-3 text-[12px] text-[#8A8A8A] font-medium uppercase tracking-wider">Or</span>
              <div className="flex-1 h-px bg-[#E8E4DF]" />
            </div>

            <div className="flex justify-center">
              <div className="w-full [&>div]:!w-full [&>div>div]:!justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setError("Google Sign-In failed")}
                  useOneTap
                  shape="rectangular"
                  theme="outline"
                  size="large"
                  width="100%"
                />
              </div>
            </div>
          </>
        )}

        <p className="text-center text-[14px] text-[#4A4A4A] mt-8">
          Don’t have an account?{" "}
          <Link
            to={`/signup/${roleParam}`}
            className="text-[#C8622A] font-semibold hover:text-[#A84E20] transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginRole;
