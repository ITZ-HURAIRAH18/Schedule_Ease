import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 text-center px-6">
        {/* Logo / Icon */}
        <div className="mb-6 inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-2xl backdrop-blur-sm border border-white/20">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 animate-gradient-text">
          NexGen Schedule
        </h1>
        <p className="text-lg md:text-xl text-blue-100/80 max-w-xl mx-auto mb-10">
          Effortlessly manage your time, appointments, and meetings in one unified platform built for speed and clarity.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {/* User */}
          <div className="group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">User</h3>
            <p className="text-sm text-blue-100/60 mb-5">Book and manage your appointments seamlessly.</p>
            <div className="flex gap-3">
              <Link to="/login/user" className="flex-1 bg-white text-blue-900 py-2.5 rounded-lg font-semibold hover:bg-blue-50 active:scale-95 transition">
                Log In
              </Link>
              <Link to="/signup/user" className="flex-1 bg-white/10 border border-white/20 py-2.5 rounded-lg font-semibold hover:bg-white/20 active:scale-95 transition">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Host */}
          <div className="group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Host</h3>
            <p className="text-sm text-blue-100/60 mb-5">Create availability and let others book your time.</p>
            <div className="flex gap-3">
              <Link to="/login/host" className="flex-1 bg-white text-blue-900 py-2.5 rounded-lg font-semibold hover:bg-blue-50 active:scale-95 transition">
                Log In
              </Link>
              <Link to="/signup/host" className="flex-1 bg-white/10 border border-white/20 py-2.5 rounded-lg font-semibold hover:bg-white/20 active:scale-95 transition">
                Sign Up
              </Link>
            </div>
          </div>

          {/* Admin */}
          <div className="group bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:border-white/30 transition-all duration-300 hover:-translate-y-1">
            <div className="w-12 h-12 mb-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Admin</h3>
            <p className="text-sm text-blue-100/60 mb-5">Oversee the platform and manage all accounts.</p>
            <Link to="/login/admin" className="w-full block bg-white text-blue-900 py-2.5 rounded-lg font-semibold hover:bg-blue-50 active:scale-95 transition">
              Admin Portal
            </Link>
          </div>
        </div>

        <p className="mt-10 text-xs text-blue-100/40">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Landing;