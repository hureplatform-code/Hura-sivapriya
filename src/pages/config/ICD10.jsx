import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Search, ListFilter, Plus, CheckCircle2, MoreVertical, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

const icd10Codes = [
  { code: 'A00.0', description: 'Cholera due to Vibrio cholerae 01, biotype cholerae', category: 'Infectious Diseases' },
  { code: 'B00.0', description: 'Eczema herpeticum', category: 'Viral Infections' },
  { code: 'C00.0', description: 'Malignant neoplasm of external upper lip', category: 'Neoplasms' },
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', category: 'Metabolic Diseases' },
  { code: 'I10', description: 'Essential (primary) hypertension', category: 'Circulatory System' },
];

export default function ICD10() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">ICD-10 Catalogue</h1>
            <p className="text-slate-500 mt-1">Official WHO International Classification of Diseases for clinical diagnosis.</p>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200">
            <Plus className="h-5 w-5" />
            Add Custom Code
          </button>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search by ICD Code or Disease Description..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-none focus:ring-2 focus:ring-primary-100 rounded-2xl text-sm transition-all outline-none font-medium"
              />
            </div>
            <button className="p-3.5 bg-slate-50 text-slate-600 rounded-2xl hover:bg-slate-100 transition-colors">
              <ListFilter className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-slate-50">
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">ICD Code</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">Description</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4">Category</th>
                  <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-widest px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {icd10Codes.map((icd, i) => (
                  <motion.tr 
                    key={icd.code}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="group hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-5 px-4">
                      <span className="px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-black">
                        {icd.code}
                      </span>
                    </td>
                    <td className="py-5 px-4 font-bold text-slate-700 text-sm max-w-md">{icd.description}</td>
                    <td className="py-5 px-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{icd.category}</span>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <button className="p-2.5 text-slate-400 hover:text-slate-900 rounded-xl">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
