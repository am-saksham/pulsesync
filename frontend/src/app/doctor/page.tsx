"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, CalendarDays, BrainCircuit, FileText } from "lucide-react";

export default function DoctorPortal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/doctor`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAppointments(data);
          if (data.length > 0) setActiveAppointment(data[0]);
        }
      })
      .catch(err => console.error(err));
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-12 font-sans text-slate-200">
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors font-medium">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">Dr. Sarah Jenkins</h1>
            <p className="text-slate-400 mt-2 text-lg">Cardiologist • Dashboard</p>
          </div>
          <div className="w-14 h-14 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-full flex items-center justify-center font-bold text-2xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            SJ
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="space-y-3">
            <button 
              onClick={() => setActiveTab("upcoming")}
              className={`w-full flex items-center px-5 py-4 rounded-xl font-bold transition-all duration-300 ${activeTab === "upcoming" ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
            >
              <CalendarDays size={20} className={`mr-3 ${activeTab === "upcoming" ? "text-blue-400" : ""}`} /> Today's Schedule
            </button>
            <button 
              onClick={() => setActiveTab("patients")}
              className={`w-full flex items-center px-5 py-4 rounded-xl font-bold transition-all duration-300 ${activeTab === "patients" ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"}`}
            >
              <Users size={20} className={`mr-3 ${activeTab === "patients" ? "text-blue-400" : ""}`} /> My Patients
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Appointment View */}
            {activeAppointment ? (
            <div className="glass-panel p-8 md:p-10 border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.05)] relative overflow-hidden">
              {/* Subtle inner glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

              <div className="flex justify-between items-start mb-10 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`px-4 py-1 text-[10px] font-black uppercase rounded-full tracking-widest ${
                      activeAppointment.urgencyLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                      activeAppointment.urgencyLevel === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {activeAppointment.urgencyLevel || 'STANDARD'} Urgency
                    </span>
                    <span className="text-slate-400 text-sm font-bold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      {new Date(activeAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white">{activeAppointment.patient?.name || 'Unknown Patient'}</h2>
                </div>
                <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                  Start Video Call
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                {/* AI Pre-Visit Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <BrainCircuit size={20} className="mr-3 text-blue-400" /> AI Pre-Visit Summary
                  </h3>
                  <div className="p-6 bg-blue-950/40 border border-blue-500/30 rounded-2xl space-y-4 shadow-[inset_0_0_20px_rgba(59,130,246,0.1)]">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      <strong className="text-white">Chief Complaint:</strong> {activeAppointment.preVisitSummary || activeAppointment.symptoms || "No symptoms provided."}
                    </p>
                    {activeAppointment.suggestedQuestions && activeAppointment.suggestedQuestions.length > 0 && (
                    <div className="pt-3 border-t border-blue-500/20">
                      <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-3">Suggested Questions</p>
                      <ul className="text-sm text-slate-300 list-disc list-outside ml-4 space-y-2">
                        {activeAppointment.suggestedQuestions.map((q: string, i: number) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ul>
                    </div>
                    )}
                  </div>
                </div>

                {/* Consultation Notes Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <FileText size={20} className="mr-3 text-slate-400" /> Consultation Notes
                  </h3>
                  <textarea 
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Type your clinical notes here..."
                    className="glass-input h-48 resize-none focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder:text-slate-500"
                  />
                  <button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/${activeAppointment.id}/post-visit`, {
                          method: "POST",
                          headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${token}`
                          },
                          body: JSON.stringify({ doctorNotes: consultationNotes, prescription: "N/A" })
                        });
                        const data = await res.json();
                        if (res.ok) {
                          alert(`Success! ${data.message || 'AI is generating the summary in the background.'}`);
                          setConsultationNotes("");
                          // Remove the appointment from the queue
                          setAppointments(prev => prev.filter(a => a.id !== activeAppointment.id));
                          setActiveAppointment(null);
                        } else {
                          alert(data.error || "Error");
                        }
                      } catch (err) {
                        alert("Network error");
                      }
                    }}
                    className="w-full py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/30 transition-all"
                  >
                    Save & Generate Patient Summary
                  </button>
                </div>
              </div>

            </div>
            ) : (
              <div className="glass-panel p-8 text-center py-24 border-white/5">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <CalendarDays size={32} className="text-slate-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">You're all caught up!</h3>
                <p className="text-slate-400">No active appointments right now.</p>
              </div>
            )}

            {/* Upcoming Queue */}
            <h3 className="font-bold text-white text-xl pt-6">Up Next</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {appointments.filter(a => a.id !== activeAppointment?.id).map(appt => (
                <div 
                  key={appt.id}
                  onClick={() => setActiveAppointment(appt)}
                  className="p-5 glass-panel border border-white/5 flex justify-between items-center hover:border-blue-400/50 hover:bg-white/10 transition-all duration-300 hover:translate-x-1 cursor-pointer group"
                >
                  <div>
                    <h4 className="font-bold text-white text-lg group-hover:text-blue-300 transition-colors">{appt.patient?.name}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                      {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] ${appt.urgencyLevel === 'HIGH' ? 'bg-rose-500 text-rose-500' : 'bg-emerald-500 text-emerald-500'}`}></span>
                </div>
              ))}
              {appointments.length <= 1 && (
                <div className="p-5 glass-panel border border-white/5 border-dashed flex items-center justify-center opacity-50">
                  <p className="text-sm font-bold text-slate-400">Queue is empty</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Ambient Background Glows */}
      <div className="fixed top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
    </div>
  );
}
