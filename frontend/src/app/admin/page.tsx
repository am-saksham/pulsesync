"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldAlert, UserPlus, CalendarX } from "lucide-react";

export default function AdminPortal() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<any[]>([]);
  
  // Onboard State
  const [newDocName, setNewDocName] = useState("");
  const [newDocEmail, setNewDocEmail] = useState("");
  const [newDocSpec, setNewDocSpec] = useState("");

  // Leave State
  const [leaveDoctorId, setLeaveDoctorId] = useState("");
  const [leaveDate, setLeaveDate] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchDoctors(token);
  }, [router]);

  const fetchDoctors = (token: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/doctors`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDoctors(data);
          if (data.length > 0) setLeaveDoctorId(data[0].id);
        }
      })
      .catch(err => console.error(err));
  };
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-500 hover:text-slate-900 mb-4 transition-colors">
              <ArrowLeft size={16} className="mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-extrabold text-slate-900">Admin Operations</h1>
            <p className="text-slate-500 mt-2">Manage clinic staff and emergency overrides.</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold text-xl">
            A
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Register New Doctor */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-900 flex items-center">
              <UserPlus size={20} className="mr-2 text-purple-600" /> Onboard Doctor
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Full Name</label>
                <input 
                  type="text" 
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Email Address</label>
                <input 
                  type="email" 
                  value={newDocEmail}
                  onChange={(e) => setNewDocEmail(e.target.value)}
                  className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Specialization</label>
                <input 
                  type="text" 
                  value={newDocSpec}
                  onChange={(e) => setNewDocSpec(e.target.value)}
                  className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all" 
                />
              </div>
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/admin/doctors`, {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({ name: newDocName, email: newDocEmail, specialization: newDocSpec })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert("Success! Doctor Onboarded.");
                      setNewDocName(""); setNewDocEmail(""); setNewDocSpec("");
                      fetchDoctors(token!);
                    } else alert(data.error || "Failed");
                  } catch (e) {
                    alert("Network error");
                  }
                }}
                className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Manage Leaves & Cancellations */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center">
                <ShieldAlert size={20} className="mr-2 text-rose-500" /> Emergency Override
              </h2>
              <p className="text-sm text-slate-500">Mark a doctor on leave. This will automatically cancel their appointments and notify patients.</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Select Doctor</label>
                <select 
                  value={leaveDoctorId}
                  onChange={(e) => setLeaveDoctorId(e.target.value)}
                  className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-slate-900"
                >
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialization}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Date of Leave</label>
                <input 
                  type="date" 
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all" 
                />
              </div>
              <button 
                onClick={async () => {
                  try {
                    const token = localStorage.getItem("token");
                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/users/admin/leaves`, {
                      method: "POST",
                      headers: { 
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify({ doctorId: leaveDoctorId, date: leaveDate })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      alert(`Emergency Leave applied. ${data.cancelledCount} appointments were cancelled.`);
                    } else alert(data.error || "Failed");
                  } catch (e) {
                    alert("Network error");
                  }
                }}
                className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-colors shadow-lg shadow-rose-200 flex justify-center items-center"
              >
                <CalendarX size={18} className="mr-2" /> Apply Leave & Cancel Bookings
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
