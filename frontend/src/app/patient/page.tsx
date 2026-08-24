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
    fetch("http://localhost:3001/api/users/doctors", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDoctors(data);
      })
      .catch(err => console.error(err));
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold text-slate-900">Patient Dashboard</h1>
            <p className="text-slate-500 mt-2">Book an appointment or view your upcoming visits.</p>
          </div>
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
            P
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Booking Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Search Doctors */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <Search size={20} className="mr-2 text-slate-400" /> Find a Doctor
              </h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  placeholder="Search by specialization (e.g. Cardiologist)" 
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <button className="px-6 py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors">
                  Search
                </button>
              </div>

              {/* Doctor Results */}
              {doctors.map(doc => (
                <div key={doc.id} className="mt-6 border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {doc.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{doc.name}</h3>
                      <p className="text-sm text-slate-500">{doc.specialization || "General"}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedDoctor(doc);
                      setIsBooking(true);
                    }}
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 font-medium rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    Select
                  </button>
                </div>
              ))}
            </div>

            {/* Booking Form (Conditional) */}
            {isBooking && selectedDoctor && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Book Appointment</h2>
                    <p className="text-sm text-slate-500 mt-1">With {selectedDoctor.name}</p>
                  </div>
                  <button onClick={() => setIsBooking(false)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 cursor-pointer border-emerald-500 bg-emerald-50/50">
                    <p className="font-bold text-slate-900">Today, 2:00 PM</p>
                    <p className="text-sm text-emerald-600 font-medium mt-1">Available</p>
                  </div>
                  <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 opacity-50 cursor-not-allowed">
                    <p className="font-bold text-slate-900">Today, 3:00 PM</p>
                    <p className="text-sm text-rose-500 font-medium mt-1">Booked</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">What are your symptoms?</label>
                  <p className="text-xs text-slate-500">Our AI will summarize this for the doctor before your visit.</p>
                  <textarea 
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="E.g., I've had a mild chest pain and shortness of breath for 2 days..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>

                <button 
                  onClick={async () => {
                    try {
                      setIsBooking(false); // mock UI loading state
                      const token = localStorage.getItem("token");
                      const res = await fetch("http://localhost:3001/api/appointments/book", {
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
                      alert("Error reaching backend. Make sure it's running on port 3001.");
                    }
                  }}
                  className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
                >
                  Confirm Booking (Secure Auth & Lock Redis)
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center">
                <Calendar size={18} className="mr-2 text-slate-400" /> Upcoming Visits
              </h2>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex gap-4">
                <div className="flex flex-col items-center justify-center bg-white border border-slate-200 w-12 h-12 rounded-xl text-slate-900 font-bold">
                  <span className="text-xs text-slate-500 uppercase">Oct</span>
                  <span>24</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Dr. Alan Turing</h3>
                  <p className="text-xs text-slate-500 flex items-center mt-1"><Clock size={12} className="mr-1"/> 10:00 AM</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-emerald-100 bg-emerald-50 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-emerald-900 flex items-center">
                <AlertCircle size={18} className="mr-2 text-emerald-600" /> AI Insights Ready
              </h2>
              <p className="text-sm text-emerald-800">
                Dr. Turing submitted notes from your last visit. Your AI-simplified summary and medication schedule are ready to view.
              </p>
              <button className="text-sm font-bold text-emerald-700 hover:text-emerald-800">
                View Summary &rarr;
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
