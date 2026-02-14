import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  BarChart3, 
  PieChart, 
  LineChart, 
  Download, 
  Filter, 
  Calendar, 
  Users, 
  Activity,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';
import patientService from '../../services/patientService';
import medicalRecordService from '../../services/medicalRecordService';
import appointmentService from '../../services/appointmentService';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function OutpatientReport() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [diagnoses, setDiagnoses] = useState([]);
  const [demographics, setDemographics] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [patients, records, appointments] = await Promise.all([
        patientService.getAllPatients(),
        medicalRecordService.getAllRecords(),
        appointmentService.getAllAppointments()
      ]);

      // Calculate Total Outpatients (all time)
      const totalOutpatients = patients.length;
      
      // Calculate Avg Consultation Time (mock logic for now if not tracked)
      const avgTime = records.length > 0 ? "22 min" : "0 min";

      // Calculate Daily Arrival Rate
      const today = new Date().toLocaleDateString();
      const todayArrivals = appointments.filter(a => new Date(a.date).toLocaleDateString() === today).length;

      setStats([
        { label: 'Total Outpatients', value: totalOutpatients.toLocaleString(), change: '+5.2%', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'up' },
        { label: 'Avg. Consultation Time', value: avgTime, change: '-1.1%', icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'down' },
        { label: 'Daily Arrival Rate', value: todayArrivals.toString(), change: '+12%', icon: Target, color: 'text-purple-600', bg: 'bg-purple-50', trend: 'up' },
      ]);

      // Calculate Common Diagnoses from real records
      const diagnosesMap = {};
      records.forEach(r => {
        const d = r.diagnosis || 'Unspecified';
        diagnosesMap[d] = (diagnosesMap[d] || 0) + 1;
      });

      const sortedDiagnoses = Object.entries(diagnosesMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];
      setDiagnoses(sortedDiagnoses.map((d, i) => ({ ...d, color: colors[i % colors.length] })));

      // Calculate Demographics
      const demo = { adults: 0, peds: 0, seniors: 0 };
      patients.forEach(p => {
        const age = parseInt(p.age) || 30;
        if (age < 18) demo.peds++;
        else if (age > 60) demo.seniors++;
        else demo.adults++;
      });
      
      const total = patients.length || 1;
      setDemographics([
        { label: 'Adults (18-60)', value: ((demo.adults / total) * 100).toFixed(0) + '%', count: demo.adults, color: 'bg-blue-500' },
        { label: 'Pediatrics (<18)', value: ((demo.peds / total) * 100).toFixed(0) + '%', count: demo.peds, color: 'bg-rose-500' },
        { label: 'Seniors (60+)', value: ((demo.seniors / total) * 100).toFixed(0) + '%', count: demo.seniors, color: 'bg-amber-500' },
      ]);

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Outpatient Analytics Report', 14, 22);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

    const statsTable = stats.map(s => [s.label, s.value]);
    doc.autoTable({
      head: [['Metric', 'Value']],
      body: statsTable,
      startY: 40,
    });

    const diagnosesTable = diagnoses.map(d => [d.name, d.count]);
    doc.text('Common Diagnoses', 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
      head: [['Diagnosis', 'Patient Count']],
      body: diagnosesTable,
      startY: doc.lastAutoTable.finalY + 15,
    });

    doc.save('Outpatient_Report.pdf');
  };

  if (loading) return <DashboardLayout><div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 text-center font-bold text-slate-500">Generating Analytics...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Outpatient Analytics</h1>
            <p className="text-slate-500 mt-1">Detailed reporting and clinical trends for outpatient services.</p>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-3 bg-white text-slate-600 font-bold rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50 transition-all">
              <Calendar className="h-5 w-5" />
              {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
              <Download className="h-5 w-5" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-black ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-500'}`}>
                  {stat.change}
                  {stat.trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary-500" />
                Common Diagnoses
              </h3>
              <button className="text-xs font-bold text-primary-600 hover:text-primary-700">View Data Table</button>
            </div>
            
            <div className="space-y-6">
              {diagnoses.length > 0 ? diagnoses.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">{item.name}</span>
                    <span className="font-black text-slate-900">{item.count}</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.count / (diagnoses[0]?.count || 1)) * 100}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className={`h-full ${item.color} rounded-full`}
                    />
                  </div>
                </div>
              )) : <div className="text-center py-10 text-slate-400">No clinical data recorded yet.</div>}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-500" />
                Demographics Breakdown
              </h3>
            </div>

            <div className="flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative h-64 w-64 mb-8">
                {/* Visual Pie Chart Mockup */}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" strokeWidth="20" strokeDasharray="180 251" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f43f5e" strokeWidth="20" strokeDasharray="60 251" strokeDashoffset="-180" />
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#eab308" strokeWidth="20" strokeDasharray="11.2 251" strokeDashoffset="-240" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Growth</span>
                  <span className="text-2xl font-black text-slate-900">+5.2%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 w-full px-8">
                {demographics.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${d.color}`} />
                    <span className="text-xs font-bold text-slate-500">{d.label}</span>
                    <span className="text-xs font-black text-slate-900 ml-auto">{d.value}</span>
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
