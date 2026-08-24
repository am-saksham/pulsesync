"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, ShieldCheck, Zap } from "lucide-react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem("token", data.token);
        if (data.user.role === "PATIENT") router.push("/patient");
        else if (data.user.role === "DOCTOR") router.push("/doctor");
        else if (data.user.role === "ADMIN") router.push("/admin");
        else router.push("/");
      } else {
        setError(data.error || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      setError("Failed to connect to backend");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      
      {/* Left Side: Vibrant Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-16">
        {/* Abstract Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-blue-900 to-slate-900 opacity-90 z-0"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-pulse-glow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center text-white/70 hover:text-white transition-colors text-sm font-medium">
            <ArrowLeft size={16} className="mr-2" /> Back to Home
          </Link>
          <div className="mt-20">
            <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
              Healthcare, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">Intelligently Synced.</span>
            </h1>
            <p className="mt-6 text-xl text-emerald-50/80 max-w-md font-light leading-relaxed">
              Experience the future of medical management. Powered by autonomous AI and secure integrations.
            </p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center space-x-4 glass-panel p-4 rounded-2xl animate-float">
            <div className="bg-emerald-500/20 p-3 rounded-xl text-emerald-400">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Lightning Fast</h3>
              <p className="text-emerald-100/60 text-xs mt-1">Real-time asynchronous syncing.</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 glass-panel p-4 rounded-2xl animate-float" style={{ animationDelay: '0.5s' }}>
            <div className="bg-blue-500/20 p-3 rounded-xl text-blue-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Bank-grade Security</h3>
              <p className="text-blue-100/60 text-xs mt-1">Pessimistic concurrency locking.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative">
        <Link href="/" className="lg:hidden absolute top-8 left-8 inline-flex items-center text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
          <ArrowLeft size={16} className="mr-2" /> Back
        </Link>
        
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start space-x-3 mb-6">
              <div className="bg-slate-900 p-2.5 rounded-xl text-white shadow-lg shadow-slate-200">
                <Activity size={24} />
              </div>
              <span className="text-2xl font-bold text-slate-900 tracking-tight">PulseSync</span>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
            <p className="mt-3 text-slate-500">Please enter your credentials to continue.</p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-rose-50/80 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl text-sm font-medium flex items-center shadow-sm">
                <ShieldCheck size={16} className="mr-2 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm text-slate-900"
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm text-slate-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-emerald-500/30 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Authenticating..." : "Sign in to Dashboard"}
              </button>
            </div>
          </form>
          
          <div className="text-center text-sm font-medium">
            <span className="text-slate-500">Don't have an account? </span>
            <Link href="/register" className="text-emerald-600 hover:text-emerald-700 transition-colors">
              Create an account &rarr;
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
