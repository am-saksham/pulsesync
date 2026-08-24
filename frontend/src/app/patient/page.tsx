"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Calendar, Clock, AlertCircle, Settings } from "lucide-react";

export default function PatientPortal() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<any>(null);
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch current user
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/me`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.id) {
          setUser(data);
          setEditName(data.name);
        }
      })
      .catch(err => console.error(err));

    // Fetch actual doctors from the backend
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/doctors`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDoctors(data);
      })
      .catch(err => console.error(err));

    // Fetch patient appointments
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/appointments/patient`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAppointments(data);
      })
      .catch(err => console.error(err));
  }, [router]);

  // Generate slots when a doctor is selected
  useEffect(() => {
    if (!selectedDoctor || !selectedDoctor.workingHours) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }
    
    const slots: Date[] = [];
    const { start, end } = selectedDoctor.workingHours;
    const duration = selectedDoctor.slotDuration || 30;
    
    // Create base date for today
    const now = new Date();
    
    // Parse start time
    const startParts = start.split(':');
    const startHour = parseInt(startParts[0] || '9');
    const startMin = parseInt(startParts[1] || '0');
    let currentTime = new Date(now);
    currentTime.setHours(startHour, startMin, 0, 0);
    
    // Parse end time
    const endParts = end.split(':');
    const endHour = parseInt(endParts[0] || '17');
    const endMin = parseInt(endParts[1] || '0');
    const endTime = new Date(now);
    endTime.setHours(endHour, endMin, 0, 0);

    // If start time is in the past, shift to tomorrow for demo purposes
    if (endTime < now) {
      currentTime.setDate(currentTime.getDate() + 1);
      endTime.setDate(endTime.getDate() + 1);
    }

    // Generate slots
    while (currentTime < endTime) {
      // Only add future slots if it's today
      if (currentTime > now) {
        slots.push(new Date(currentTime));
      }
      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }
    
    // Limit to 6 slots for UI purposes
    setAvailableSlots(slots.slice(0, 6));
    setSelectedSlot(null);
  }, [selectedDoctor]);

  const saveSettings = async () => {
    setIsSaving(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/me`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ name: editName })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        setShowSettings(false);
      } else {
        alert(data.error || "Failed to update settings");
      }
    } catch (e) {
      alert("Network error saving settings");
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-12 font-sans text-slate-200">
      <div className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-4 transition-colors font-medium">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              {user ? `Welcome, ${user.name.split(' ')[0]}` : "Patient Dashboard"}
            </h1>
            <p className="text-slate-400 mt-2 text-lg">Book an appointment or view your upcoming visits.</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/5 border border-white/10 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors shadow-[0_0_10px_rgba(255,255,255,0.05)]"
            >
              <Settings size={20} />
            </button>
            <div className="w-14 h-14 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-full flex items-center justify-center font-bold text-2xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {user ? user.name.charAt(0).toUpperCase() : "P"}
            </div>
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

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-300 tracking-wide uppercase flex justify-between">
                    <span>Select Time</span>
                    <span className="text-emerald-400 font-normal normal-case">{selectedDoctor.slotDuration || 30} min slots</span>
                  </label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-3">
                      {availableSlots.map((slot, i) => {
                        const isSelected = selectedSlot?.getTime() === slot.getTime();
                        return (
                          <div 
                            key={i}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center gap-1 ${
                              isSelected 
                                ? 'border-emerald-500/80 bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)] transform scale-[1.02]' 
                                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                            }`}
                          >
                            <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                              {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {isSelected && <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Selected</p>}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-5 border border-white/5 rounded-2xl bg-white/5 opacity-70 text-center">
                      <p className="font-bold text-slate-300">No slots available today.</p>
                      <p className="text-sm text-slate-400 mt-1">Please try searching for another doctor.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-300 tracking-wide uppercase">What are your symptoms?</label>
                  <p className="text-xs text-emerald-400/80">Our AI will summarize this for the doctor before your visit.</p>
                  <textarea 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="E.g., I've had a mild chest pain and shortness of breath for 2 days..."
                    className="glass-input h-32 resize-none focus:ring-emerald-500/50 focus:border-emerald-500/50 text-white placeholder:text-slate-500 w-full"
                  />
                </div>

                <button 
                  disabled={!selectedSlot}
                  onClick={async () => {
                    if (!selectedSlot) return;
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
                          startTime: selectedSlot.toISOString(),
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
              {appointments
                .filter(a => a.status === 'SCHEDULED' && new Date(a.startTime) >= new Date())
                .sort((a,b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                .map(appt => (
                <div key={appt.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 flex gap-5 hover:bg-white/10 transition-colors cursor-default">
                  <div className="flex flex-col items-center justify-center bg-slate-900/50 border border-white/10 w-14 h-14 rounded-xl text-white font-bold shadow-inner">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">{new Date(appt.startTime).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-lg">{new Date(appt.startTime).getDate()}</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="font-bold text-white text-base">{appt.doctor?.name}</h3>
                    <p className="text-xs text-blue-400 flex items-center mt-1 font-medium">
                      <Clock size={12} className="mr-1"/> 
                      {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {appointments.filter(a => a.status === 'SCHEDULED' && new Date(a.startTime) >= new Date()).length === 0 && (
                <div className="p-5 border border-white/5 border-dashed flex items-center justify-center opacity-50 rounded-2xl">
                  <p className="text-sm font-bold text-slate-400">No upcoming visits</p>
                </div>
              )}
            </div>

            {appointments.filter(a => a.status === 'COMPLETED' && (a.postVisitSummary || a.doctorNotes)).slice(0, 1).map(appt => (
              <div key={appt.id} className="glass-panel p-6 border-emerald-500/20 bg-emerald-950/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all duration-700"></div>
                <h2 className="text-lg font-bold text-emerald-400 flex items-center">
                  <AlertCircle size={20} className="mr-2" /> AI Insights Ready
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {appt.doctor?.name} submitted notes from your last visit on {new Date(appt.startTime).toLocaleDateString()}. Your AI-simplified summary and medication schedule are ready to view.
                </p>
                <button 
                  onClick={() => setSelectedSummary(appt)}
                  className="inline-flex items-center text-sm font-bold text-white bg-emerald-500/20 px-4 py-2 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors cursor-pointer relative z-10"
                >
                  View Summary &rarr;
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>
      
      {/* AI Summary Modal */}
      {selectedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto pt-24 pb-12">
          <div className="glass-panel p-8 w-full max-w-2xl border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center">
                  <AlertCircle size={24} className="mr-2 text-emerald-400" /> Post-Visit Summary
                </h2>
                <p className="text-slate-400 mt-1">Consultation with {selectedSummary.doctor?.name}</p>
              </div>
              <button onClick={() => setSelectedSummary(null)} className="text-slate-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">×</button>
            </div>
            
            <div className="space-y-6">
              {selectedSummary.postVisitSummary && (
                <div className="p-5 bg-emerald-950/30 border border-emerald-500/20 rounded-xl space-y-2">
                  <p className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">AI Simplified Summary</p>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">{selectedSummary.postVisitSummary}</p>
                </div>
              )}
              
              <div className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Doctor's Clinical Notes</p>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedSummary.doctorNotes || "No notes provided."}</p>
              </div>

              {selectedSummary.prescription && selectedSummary.prescription !== "N/A" && (
                <div className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <p className="text-[11px] font-black text-rose-400 uppercase tracking-widest">Prescription / Medication</p>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{selectedSummary.prescription}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setSelectedSummary(null)}
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="glass-panel p-8 w-full max-w-md border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Settings</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300 uppercase tracking-wide">Full Name</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="glass-input text-white"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowSettings(false)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={saveSettings}
                disabled={isSaving || !editName.trim()}
                className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ambient Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none"></div>
    </div>
  );
}
