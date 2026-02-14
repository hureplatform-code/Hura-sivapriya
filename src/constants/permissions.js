export const PERMISSION_MODULES = [
  {
    id: 'master',
    name: 'Master Setup',
    type: 'parent',
    key: 'ur_master'
  },
  {
    id: 'usermanage',
    name: 'Manage User',
    type: 'child',
    rights: [
      { key: 'ur_usermanage', label: 'View' },
      { key: 'ur_user_add', label: 'Add' },
      { key: 'ur_user_edit', label: 'Edit' },
      { key: 'ur_user_delete', label: 'Delete' }
    ]
  },
  {
    id: 'account',
    name: 'Account Creation',
    type: 'child',
    rights: [
      { key: 'ur_acc_view', label: 'View' },
      { key: 'ur_acc_add', label: 'Add' },
      { key: 'ur_acc_edit', label: 'Edit' },
      { key: 'ur_acc_delete', label: 'Delete' }
    ]
  },
  {
    id: 'pharmacy_store',
    name: 'Pharmacy & Store',
    type: 'child',
    rights: [
      { key: 'ur_prs_view', label: 'View' },
      { key: 'ur_prs_add', label: 'Add' },
      { key: 'ur_prs_edit', label: 'Edit' },
      { key: 'ur_prs_delete', label: 'Delete' }
    ]
  },
  {
    id: 'icd',
    name: 'ICD-10/CDT Code',
    type: 'child',
    rights: [
      { key: 'ur_icd_view', label: 'View' },
      { key: 'ur_icd_add', label: 'Add' },
      { key: 'ur_icd_edit', label: 'Edit' },
      { key: 'ur_icd_delete', label: 'Delete' }
    ]
  },
  {
    id: 'lab',
    name: 'Lab Investigation',
    type: 'child',
    rights: [
      { key: 'ur_lab_view', label: 'View' },
      { key: 'ur_lab_add', label: 'Add' },
      { key: 'ur_lab_edit', label: 'Edit' },
      { key: 'ur_lab_delete', label: 'Delete' }
    ]
  },
  {
    id: 'imaging',
    name: 'Imaging Investigation',
    type: 'child',
    rights: [
      { key: 'ur_img_view', label: 'View' },
      { key: 'ur_img_add', label: 'Add' },
      { key: 'ur_img_edit', label: 'Edit' },
      { key: 'ur_img_delete', label: 'Delete' }
    ]
  },
  {
    id: 'appointment',
    name: 'Appointment Schedule',
    type: 'child',
    rights: [
      { key: 'ur_app_view', label: 'View' },
      { key: 'ur_app_add', label: 'Add' },
      { key: 'ur_app_edit', label: 'Edit' },
      { key: 'ur_app_delete', label: 'Delete' }
    ]
  },
  {
    id: 'clinical_notes',
    name: 'Clinical Notes',
    type: 'child',
    rights: [
      { key: 'ur_cn_view', label: 'View' },
      { key: 'ur_cn_add', label: 'Add' },
      { key: 'ur_cn_edit', label: 'Edit' },
      { key: 'ur_cn_delete', label: 'Delete' }
    ]
  },
  {
    id: 'investigation',
    name: 'Investigation',
    type: 'child',
    rights: [
      { key: 'ur_invest_view', label: 'View' },
      { key: 'ur_invest_add', label: 'Add' },
      { key: 'ur_invest_edit', label: 'Edit' },
      { key: 'ur_invest_delete', label: 'Delete' }
    ]
  },
  {
    id: 'pharmacy_mgmt',
    name: 'Pharmacy Management',
    type: 'child',
    rights: [
      { key: 'ur_prsm_view', label: 'View' },
      { key: 'ur_prsm_add', label: 'Add' },
      { key: 'ur_prsm_edit', label: 'Edit' },
      { key: 'ur_prsm_delete', label: 'Delete' }
    ]
  },
  {
    id: 'billing',
    name: 'Billing / ICD-10',
    type: 'child',
    rights: [
      { key: 'ur_bill_view', label: 'View' },
      { key: 'ur_bill_add', label: 'Add' },
      { key: 'ur_bill_edit', label: 'Edit' },
      { key: 'ur_bill_delete', label: 'Delete' }
    ]
  },
  {
    id: 'reports',
    name: 'Reports',
    type: 'parent',
    key: 'ur_report',
    children: [
      { key: 'ur_report_out', label: 'Out Patient Report' },
      { key: 'ur_repout_daily', label: 'Daily Visit Report' },
      { key: 'ur_repout_diagnosis', label: 'Diagnosis Report' },
      { key: 'ur_repout_consul', label: 'Consultation Outcomes' },
      { key: 'ur_repout_service', label: 'Service Utilization' }
    ]
  }
];
