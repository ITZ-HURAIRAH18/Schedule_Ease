import { useState } from "react";
import axios from "../api/axiosInstance";
import { useNavigate, useParams, Link } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, Loader2, User, UserPlus } from "lucide-react";

const SignupRole = () => {
  const { roleParam } = useParams();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", role: roleParam });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const roleLabel = { user: "User", host: "Host" }[roleParam] || "User";

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

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post("/auth/signup", form);
      setSuccess(res.data.message || "Account created successfully");
      setError("");
      setTimeout(() => navigate(`/login/${roleParam}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (response) => {
    if (!response?.credential) {
      setError("Google Sign-In failed: no credential");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post("/auth/google-signup", { token: response.credential, role: form.role });
      setSuccess(res.data.message || "Google signup successful");
      setError("");
      setTimeout(() => navigate(`/login/${roleParam}`), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Google signup failed");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0F172A] selection:bg-indigo-500/30 overflow-hidden">
      {/* Left Side: Animated Illustration (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/20 to-[#4F46E5]/20" />
        
        {/* Abstract animated shapes */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            borderRadius: ["30%", "50%", "30%"],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute w-[500px] h-[500px] bg-gradient-to-tr from-[#7C3AED] to-[#4F46E5] opacity-20 blur-3xl"
        />

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">Join the Community</h2>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Start your journey today and connect with thousands of like-minded individuals.
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
               <UserPlus className="w-20 h-20 text-indigo-400" />
            </div>
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
                <UserPlus className="w-8 h-8 text-white" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white">Create Account</h1>
              <p className="text-slate-400 mt-2">Join as a {roleLabel}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSignup} className="space-y-6">
              {/* Full Name Input */}
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all peer"
                  placeholder="Full Name"
                />
                <label
                  htmlFor="fullName"
                  className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-1/2 peer-focus:top-0 peer-focus:text-xs peer-focus:text-indigo-400 peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:text-xs"
                >
                  Full Name
                </label>
              </div>

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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-sm"
                >
                  {error}
                </motion.p>
              )}
              {success && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-400 text-sm"
                >
                  {success}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#7C3AED] to-[#4F46E5] hover:from-[#8B5CF6] hover:to-[#6366F1] text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-8">
              <div className="flex-1 h-px bg-white/10" />
              <span className="px-4 text-xs text-slate-500 uppercase tracking-wider">Or continue with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex justify-center">
              <div className="w-full [&>div]:!w-full [&>div>div]:!justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSignup}
                  onError={() => setError("Google Sign-In failed")}
                  useOneTap
                  theme="filled_black"
                  size="large"
                  text="signup_with"
                  shape="pill"
                />
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-slate-400 mt-8">
              Already have an account?{" "}
              <Link
                to={`/login/${roleParam}`}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SignupRole;