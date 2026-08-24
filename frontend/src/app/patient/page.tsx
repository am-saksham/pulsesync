"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Calendar, Clock, AlertCircle } from "lucide-react";

export default function PatientPortal() {
  const router = useRouter();
  const [symptoms, setSymptoms] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch actual doctors from the backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/doctors`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDoctors(data);
      })
      .catch(err => console.error(err));
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-12 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors font-medium">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Patient Dashboard</h1>
            <p className="text-slate-400 mt-2 text-lg">Book an appointment or view your upcoming visits.</p>
          </div>
          <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center font-bold text-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            P
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Booking Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Doctors */}
            <div className="glass-panel p-8 space-y-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                <Search size={24} className="mr-3 text-emerald-400" /> Find a Doctor
              </h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search by specialization (e.g. Cardiologist)" 
                  className="glass-input flex-1 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                />
                <button className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-500 transition-all shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                  Search
                </button>
              </div>

              {/* Doctor Results */}
              <div className="space-y-4 pt-2">
                {doctors.length === 0 && (
                  <p className="text-slate-400 text-center py-4">No doctors found. Please check back later.</p>
                )}
                {doctors.map(doc => (
                  <div key={doc.id} className="glass-panel p-5 flex items-center justify-between hover:scale-[1.02] hover:bg-white/10 transition-all duration-300 border border-white/5 hover:border-white/20">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xl shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                        {doc.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-white tracking-wide">{doc.name}</h3>
                        <p className="text-sm text-slate-400 mt-1">{doc.specialization || "General"}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setIsBooking(true);
                      }}
                      className="px-6 py-2.5 bg-white/5 border border-white/10 text-white font-medium rounded-lg hover:bg-white/20 hover:border-white/30 transition-colors"
                    >
                      Select
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Form (Conditional) */}
            {isBooking && selectedDoctor && (
              <div className="glass-panel p-8 space-y-6 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)] animate-in fade-in slide-in-from-bottom-8 duration-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Book Appointment</h2>
                    <p className="text-slate-400 mt-1">With {selectedDoctor.name}</p>
                  </div>
                  <button onClick={() => setIsBooking(false)} className="text-slate-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">×</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 border border-emerald-500/50 rounded-2xl bg-emerald-500/10 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-500/20 transition-colors">
                    <p className="font-bold text-white text-lg">Today, 2:00 PM</p>
                    <p className="text-sm text-emerald-400 font-medium mt-1">Available</p>
                  </div>
                  <div className="p-5 border border-white/5 rounded-2xl bg-white/5 opacity-50 cursor-not-allowed">
                    <p className="font-bold text-slate-300 text-lg">Today, 3:00 PM</p>
                    <p className="text-sm text-rose-400 font-medium mt-1">Booked</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-300 tracking-wide uppercase">What are your symptoms?</label>
                  <p className="text-xs text-emerald-400/80">Our AI will summarize this for the doctor before your visit.</p>
                  <textarea 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="E.g., I've had a mild chest pain and shortness of breath for 2 days..."
                    className="glass-input h-32 resize-none focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder:text-slate-500"
                  />
                </div>

                <button 
                  onClick={async () => {
                    try {
                      setIsBooking(false); // mock UI loading state
                      const token = localStorage.getItem("token");
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/book`, {
                        method: "POST",
                        headers: { 
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}` 
                        },
                        body: JSON.stringify({
                          doctorId: selectedDoctor.id,
                          startTime: new Date().toISOString(),
                          symptoms: symptoms
                        })
                      });
                      
                      const data = await res.json();
                      if (res.ok) {
                        alert(`Success! Appointment Booked. ${data.message || ''}`);
                        setSymptoms("");
                      } else {
                        alert(`Booking Failed: ${data.error || 'Unknown error'}`);
                      }
                    } catch (e) {
                      alert("Error reaching backend.");
                    }
                  }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl hover:from-emerald-400 hover:to-teal-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                >
                  Confirm Booking
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel p-6 space-y-5">
              <h2 className="text-lg font-bold text-white flex items-center">
                <Calendar size={20} className="mr-2 text-blue-400" /> Upcoming Visits
              </h2>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex gap-5 hover:bg-white/10 transition-colors cursor-default">
                <div className="flex flex-col items-center justify-center bg-slate-900/50 border border-white/10 w-14 h-14 rounded-xl text-white font-bold shadow-inner">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Oct</span>
                  <span className="text-lg">24</span>
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-bold text-white text-base">Dr. Alan Turing</h3>
                  <p className="text-xs text-blue-400 flex items-center mt-1 font-medium"><Clock size={12} className="mr-1"/> 10:00 AM</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 border-emerald-500/20 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
              <h2 className="text-lg font-bold text-emerald-400 flex items-center">
                <AlertCircle size={20} className="mr-2" /> AI Insights Ready
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Dr. Turing submitted notes from your last visit. Your AI-simplified summary and medication schedule are ready to view.
              </p>
              <button className="inline-flex items-center text-sm font-bold text-white bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                View Summary &rarr;
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Ambient Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none"></div>
    </div>
  );
}
