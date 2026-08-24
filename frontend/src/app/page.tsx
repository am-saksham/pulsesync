import Link from "next/link";
import { User, Stethoscope, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-6">
      <div className="max-w-4xl w-full text-center space-y-8">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-block p-3 rounded-2xl bg-blue-100 text-blue-600 mb-2">
            <Stethoscope size={40} />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
            Healthcare <span className="text-blue-600">Manager</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            Seamlessly book appointments, prevent double-bookings with Redis, and generate AI-powered summaries for both patients and doctors.
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          
          {/* Patient Portal */}
          <Link href="/patient" className="group">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <User size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Patient Portal</h2>
              <p className="text-slate-500 flex-1">
                Book appointments, describe your symptoms, and review your AI post-visit summaries.
              </p>
              <div className="text-emerald-600 font-semibold mt-4">Access Portal &rarr;</div>
            </div>
          </Link>

          {/* Doctor Portal */}
          <Link href="/doctor" className="group">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Stethoscope size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Doctor Portal</h2>
              <p className="text-slate-500 flex-1">
                View your schedule, read AI pre-visit summaries, and write consultation notes.
              </p>
              <div className="text-blue-600 font-semibold mt-4">Access Portal &rarr;</div>
            </div>
          </Link>

          {/* Admin Portal */}
          <Link href="/admin" className="group">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Admin Portal</h2>
              <p className="text-slate-500 flex-1">
                Manage the system, register new doctors, and handle doctor emergency leaves.
              </p>
              <div className="text-purple-600 font-semibold mt-4">Access Portal &rarr;</div>
            </div>
          </Link>

        </div>
      </div>
    </div>
  );
}
