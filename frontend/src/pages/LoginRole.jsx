import { useState, useRef } from "react";
import axios from "../api/axiosInstance";
import { useNavigate, useParams, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

const LoginRole = () => {
  const { roleParam } = useParams();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleLabel = { user: "User", host: "Host", admin: "Admin" }[roleParam] || "User";

  // 3D Tilt Effect logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Email and password are required");
      return;
    }
    try {
      setLoading(true);
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
    <div className="min-h-screen w-full flex bg-[#0F172A] selection:bg-indigo-500/30 overflow-hidden">
      {/* Left Side: Animated Illustration (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#4F46E5]/20" />
        
        {/* Abstract animated shapes */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            borderRadius: ["20%", "40%", "20%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute w-96 h-96 bg-gradient-to-tr from-[#7C3AED] to-[#4F46E5] opacity-20 blur-3xl"
        />
        <motion.div
          animate={{
            x: [-100, 100, -100],
            y: [-50, 50, -50],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-64 h-64 bg-indigo-500 opacity-10 blur-3xl"
        />

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Seamless Connectivity</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Experience the next generation of digital interaction. Secure, fast, and intuitive.
            </p>
          </motion.div>

          {/* Floating Illustration Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-12 relative"
          >
            <div className="w-80 h-48 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl flex items-center justify-center">
               <ShieldCheck className="w-20 h-20 text-indigo-400" />
            </div>
            {/* Smaller floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-6 -right-6 w-16 h-16 bg-[#7C3AED]/30 backdrop-blur-xl rounded-full border border-white/10"
            />
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -bottom-4 -left-4 w-12 h-12 bg-[#4F46E5]/30 backdrop-blur-xl rounded-lg border border-white/10"
            />
          </motion.div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Background glow for mobile */}
        <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 to-[#4F46E5]/10 -z-10" />
        
        <div className="w-full max-w-md">
          {/* Back Link */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Link to="/" className="inline-flex items-center text-slate-400 hover:text-white transition-colors group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to home
            </Link>
          </motion.div>

          {/* Glass Card with 3D Tilt */}
          <motion.div
            style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl relative"
          >
            {/* Logo */}
            <div className="mb-8 flex flex-col items-center">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: "spring", damping: 12 }}
                className="w-16 h-16 bg-gradient-to-br from-[#7C3AED] to-[#4F46E5] rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4"
              >
                <Lock className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
              <p className="text-slate-400 mt-2">Log in to your {roleLabel} account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  id="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all peer"
                  placeholder="Email"
                />
                <label
                  htmlFor="email"
                  className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Email Address
                </label>
              </div>

              {/* Password Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  id="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-12 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all peer"
                  placeholder="Password"
                />
                <label
                  htmlFor="password"
                  className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
              </button>
            </form>

            {/* Divider */}
            {roleParam !== "admin" && (
              <>
                <div className="flex items-center my-8">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="px-4 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="flex justify-center">
                  <div className="w-full [&>div]:!w-full [&>div>div]:!justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleLogin}
                      onError={() => setError("Google Sign-In failed")}
                      useOneTap
                      theme="filled_black"
                      size="large"
                      text="signin_with"
                      shape="pill"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <p className="text-center text-slate-400 mt-8">
              Don’t have an account?{" "}
              <Link
                to={`/signup/${roleParam}`}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LoginRole;