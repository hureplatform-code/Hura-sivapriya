export const LAB_STANDARDS = [
  { 
    name: 'Complete Blood Count (CBC)', 
    code: 'CBC', 
    category: 'Hematology', 
    price: 1500,
    fields: [
      { id: 'hb', label: 'Hemoglobin', unit: 'g/dL', ref: '13.0-17.0' },
      { id: 'wbc', label: 'Total WBC', unit: 'cells/cu.mm', ref: '4000-11000' },
      { id: 'rbc', label: 'RBC Count', unit: 'mill/cu.mm', ref: '4.5-5.5' },
      { id: 'platelets', label: 'Platelet Count', unit: 'lakhs/cu.mm', ref: '1.5-4.5' },
    ]
  },
  { 
    name: 'Lipid Profile', 
    code: 'LIPID', 
    category: 'Biochemistry', 
    price: 2500,
    fields: [
      { id: 'chol', label: 'Total Cholesterol', unit: 'mg/dL', ref: '< 200' },
      { id: 'trig', label: 'Triglycerides', unit: 'mg/dL', ref: '< 150' },
      { id: 'hdl', label: 'HDL Chol.', unit: 'mg/dL', ref: '> 40' },
      { id: 'ldl', label: 'LDL Chol.', unit: 'mg/dL', ref: '< 100' },
    ]
  },
  { 
    name: 'Liver Function Test (LFT)', 
    code: 'LFT', 
    category: 'Biochemistry', 
    price: 1800,
    fields: [
      { id: 'bil_t', label: 'Bilirubin Total', unit: 'mg/dL', ref: '0.2-1.2' },
      { id: 'sgpt', label: 'SGPT (ALT)', unit: 'U/L', ref: '7-56' },
      { id: 'alp', label: 'Alkaline Phos.', unit: 'U/L', ref: '44-147' },
    ]
  },
  { 
    name: 'Renal Function Test (RFT)', 
    code: 'RFT', 
    category: 'Biochemistry', 
    price: 1800,
    fields: [
      { id: 'urea', label: 'Urea', unit: 'mg/dL', ref: '15-45' },
      { id: 'creat', label: 'Creatinine', unit: 'mg/dL', ref: '0.6-1.2' },
    ] 
  },
  { 
    name: 'Blood Sugar Panel', 
    code: 'GLUCOSE', 
    category: 'Biochemistry', 
    price: 1200,
    fields: [
      { id: 'fbs', label: 'Fasting (FBS)', unit: 'mg/dL', ref: '70-100' },
      { id: 'ppbs', label: 'Post Prandial (PPBS)', unit: 'mg/dL', ref: '70-140' },
    ]
  },
  { 
    name: 'Thyroid Profile (T3, T4, TSH)', 
    code: 'THYROID', 
    category: 'Endocrinology', 
    price: 3200,
    fields: [
      { id: 't3', label: 'Total T3', unit: 'ng/dL', ref: '80-200' },
      { id: 't4', label: 'Total T4', unit: 'μg/dL', ref: '5.1-14.1' },
      { id: 'tsh', label: 'TSH', unit: 'μIU/mL', ref: '0.27-4.20' }
    ]
  }
];

export const IMAGING_STANDARDS = [
  { name: 'Chest X-Ray', code: 'CXR', category: 'Radiology', price: 1200 },
  { name: 'Abdominal Ultrasound', code: 'USG-ABD', category: 'Radiology', price: 3500 },
  { name: 'Pelvic Scan', code: 'USG-PEL', category: 'Radiology', price: 3000 }
];
