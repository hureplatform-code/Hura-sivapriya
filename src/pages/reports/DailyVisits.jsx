import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Calendar, Users, Clock, ArrowUpRight, BarChart3, TrendingUp, Filter, Download, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import appointmentService from '../../services/appointmentService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function DailyVisits() {
  const [loading, setLoading] = useState(true);
  const [arrivals, setArrivals] = useState([]);
  const [hourlyStats, setHourlyStats] = useState([]);
  const [waitTimes, setWaitTimes] = useState([]);

  useEffect(() => {
    fetchDailyVisits();
  }, []);

  const fetchDailyVisits = async () => {
    try {
      setLoading(true);
      const appointments = await appointmentService.getAllAppointments();
      
      const today = new Date().toLocaleDateString();
      const todayAppointments = appointments.filter(a => new Date(a.date).toLocaleDateString() === today);
      
      // Sort by time
      const sorted = todayAppointments.sort((a, b) => {
        const timeA = new Date(`1970/01/01 ${a.time}`);
        const timeB = new Date(`1970/01/01 ${b.time}`);
        return timeB - timeA; // Most recent first
      });

      setArrivals(sorted.slice(0, 5));

      // Calculate hourly stats
      const hourly = {};
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      hours.forEach(h => hourly[h] = 0);

      todayAppointments.forEach(a => {
        const h = a.time.split(':')[0] + ':00';
        if (hourly.hasOwnProperty(h)) {
          hourly[h]++;
        } else {
          // Find closest hour slot
          const hourNum = parseInt(a.time.split(':')[0]);
          const slot = hours.find(hSlot => parseInt(hSlot) >= hourNum) || '18:00';
          hourly[slot]++;
        }
      });

      const maxCount = Math.max(...Object.values(hourly), 1);
      setHourlyStats(Object.entries(hourly).map(([hour, count]) => ({
        hour,
        count,
        status: count === maxCount ? 'peak' : count > maxCount / 2 ? 'high' : count > 0 ? 'medium' : 'low'
      })));

      // Mock wait times for now based on volume
      const avgWait = todayAppointments.length > 5 ? '18 min' : '8 min';
      setWaitTimes([
        { label: 'Triage', value: '4 min', status: 'optimal' },
        { label: 'Consultation', value: avgWait, status: todayAppointments.length > 10 ? 'high' : 'optimal' },
        { label: 'Pharmacy', value: '6 min', status: 'optimal' },
      ]);

    } catch (error) {
      console.error('Error fetching daily visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Daily Visit Logs', 14, 22);
    doc.setFontSize(12);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);

    const arrivalsTable = arrivals.map(a => [a.time, a.patient, a.type, a.status]);
    doc.autoTable({
      head: [['Time', 'Patient', 'Type', 'Status']],
      body: arrivalsTable,
      startY: 40,
    });

    doc.save(`Daily_Visits_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500">Monitoring Arrivals...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Daily Visit Logs</h1>
            <p className="text-slate-500 mt-1">Real-time monitoring of patient arrivals and consultation throughput.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
              <Calendar className="h-5 w-5" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Today)
            </button>
            <button 
              onClick={handleExportPDF}
              className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                Hourly Traffic Distribution
              </h3>
              
              <div className="flex items-end justify-between h-64 gap-2">
                {hourlyStats.map((v, i) => (
                  <div key={v.hour} className="flex-1 flex flex-col items-center gap-4">
                    <div className="w-full relative group">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(v.count / (Math.max(...hourlyStats.map(s => s.count)) || 1)) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 }}
                        className={`w-full rounded-t-xl transition-all ${v.status === 'peak' ? 'bg-primary-600 shadow-lg shadow-primary-100' : v.status === 'high' ? 'bg-primary-400' : v.status === 'medium' ? 'bg-slate-300' : 'bg-slate-200'}`}
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-black px-2 py-1 rounded-lg">
                        {v.count}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.hour}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Arrivals</h3>
              <div className="space-y-4">
                {arrivals.length > 0 ? arrivals.map((visit, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group hover:bg-slate-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-xs font-black text-slate-400 shadow-sm group-hover:text-primary-600 transition-colors">
                        {visit.time.split(':')[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{visit.patient}</p>
                        <p className="text-xs text-slate-500 font-medium">{visit.type}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${visit.status === 'arrived' ? 'bg-blue-50 text-blue-600' : visit.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {visit.status}
                    </span>
                  </div>
                )) : <div className="text-center py-10 text-slate-400">No arrivals recorded today.</div>}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-primary-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
              <div className="relative z-10">
                <TrendingUp className="h-10 w-10 text-primary-200 mb-4" />
                <h3 className="text-xl font-bold">Peak Efficiency</h3>
                <p className="text-primary-100 text-sm mt-2 leading-relaxed">System performance is at 98.4%. Wait times are managed efficiently based on current traffic.</p>
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary-200">System status</p>
                  <p className="text-sm font-bold mt-1">Normal operating conditions.</p>
                </div>
              </div>
              <div className="absolute -right-12 -top-12 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                Wait Time Metrics
              </h4>
              <div className="space-y-6">
                {waitTimes.map((m) => (
                  <div key={m.label} className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">{m.label}</span>
                    <div className="text-right">
                      <p className="font-black text-slate-900">{m.value}</p>
                      <p className={`text-[10px] font-black uppercase ${m.status === 'optimal' ? 'text-emerald-500' : 'text-amber-500'}`}>{m.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

