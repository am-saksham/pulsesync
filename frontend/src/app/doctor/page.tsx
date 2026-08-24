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

    fetch("http://localhost:3001/api/appointments/doctor", {
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
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold text-slate-900">Dr. Sarah Jenkins</h1>
            <p className="text-slate-500 mt-2">Cardiologist • Dashboard</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
            SJ
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="space-y-2">
            <button 
              onClick={() => setActiveTab("upcoming")}
              className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "upcoming" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <CalendarDays size={18} className="mr-3" /> Today's Schedule
            </button>
            <button 
              onClick={() => setActiveTab("patients")}
              className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === "patients" ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"}`}
            >
              <Users size={18} className="mr-3" /> My Patients
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Active Appointment View */}
            {activeAppointment ? (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 text-xs font-bold uppercase rounded-full tracking-wider ${
                      activeAppointment.urgencyLevel === 'HIGH' ? 'bg-rose-100 text-rose-700' : 
                      activeAppointment.urgencyLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {activeAppointment.urgencyLevel || 'STANDARD'} Urgency
                    </span>
                    <span className="text-slate-400 text-sm font-medium">
                      {new Date(activeAppointment.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{activeAppointment.patient?.name || 'Unknown Patient'}</h2>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-200">
                  Start Video Call
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* AI Pre-Visit Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center">
                    <BrainCircuit size={18} className="mr-2 text-blue-500" /> AI Pre-Visit Summary
                  </h3>
                  <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-3">
                    <p className="text-sm text-slate-700 leading-relaxed">
                      <strong className="text-slate-900">Chief Complaint:</strong> {activeAppointment.preVisitSummary || activeAppointment.symptoms || "No symptoms provided."}
                    </p>
                    {activeAppointment.suggestedQuestions && activeAppointment.suggestedQuestions.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Suggested Questions</p>
                      <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
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
                  <h3 className="text-lg font-bold text-slate-900 flex items-center">
                    <FileText size={18} className="mr-2 text-slate-400" /> Consultation Notes
                  </h3>
                  <textarea 
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Type your clinical notes here..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl h-[160px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none text-sm"
                  />
                  <button 
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        const res = await fetch(`http://localhost:3001/api/appointments/${activeAppointment.id}/post-visit`, {
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
                    className="w-full py-3 border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    Save & Generate Patient Summary
                  </button>
                </div>
              </div>

            </div>
            ) : (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center py-20">
                <p className="text-slate-500">No active appointments right now.</p>
              </div>
            )}

            {/* Upcoming Queue */}
            <h3 className="font-bold text-slate-900 pt-4">Up Next</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.filter(a => a.id !== activeAppointment?.id).map(appt => (
                <div 
                  key={appt.id}
                  onClick={() => setActiveAppointment(appt)}
                  className="p-5 bg-white border border-slate-200 rounded-2xl flex justify-between items-center hover:border-blue-300 transition-colors cursor-pointer"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{appt.patient?.name}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${appt.urgencyLevel === 'HIGH' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                </div>
              ))}
              {appointments.length <= 1 && (
                <p className="text-sm text-slate-400 p-4">No upcoming appointments.</p>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
