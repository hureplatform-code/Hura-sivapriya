import firestoreService from './firestoreService';
import { where, orderBy, limit, query, collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import auditService from './auditService';

const claimService = {
  collection: 'insurance_claims',

  async createClaimSnapshot(invoice, soapRecord, appointment, userData) {
    // Check if claim already exists to avoid duplicates
    const existingQ = [where('invoiceId', '==', invoice.id)];
    const existing = await firestoreService.getAll(this.collection, existingQ);
    
    if (existing.length > 0 && existing[0].status !== 'Ready') {
      // If already submitted or paid, don't overwrite the snapshot
      return existing[0];
    }

    const claimData = {
      invoiceId: invoice.id,
      invoiceNo: invoice.invoiceNo,
      patientId: invoice.patientId,
      patientName: invoice.patientName,
      appointmentId: invoice.invAppId,
      facilityId: userData?.facilityId,
      
      // Snapshot of Insurance Info used at time of claim
      insuranceProvider: invoice.insuranceScheme || 'Standard Insurance',
      insuranceMemberNo: invoice.insuranceMemberNo || '--',
      
      // Totals
      totalAmount: invoice.totalAmount,
      currency: invoice.currency || 'KES',
      
      // Status Workflow (Draft/Ready/Submitted Manual/Paid/Rejected)
      status: 'Ready', 
      
      // Metadata
      hasSoap: !!soapRecord,
      hasLabs: !!(appointment?.labResults || appointment?.structuredResults?.length > 0),
      
      createdAt: new Date(),
      createdBy: userData?.name || 'System',
      lastUpdated: new Date()
    };

    if (existing.length > 0) {
      return await firestoreService.update(this.collection, existing[0].id, claimData);
    }

    const claim = await firestoreService.create(this.collection, claimData);
    
    await auditService.logActivity({
      userId: userData?.uid,
      userName: userData?.name,
      action: 'PREPARE_CLAIM',
      module: 'FINANCIAL',
      description: `Prepared insurance claim snapshot for Invoice #${invoice.invoiceNo}`,
      metadata: { claimId: claim.id, invoiceId: invoice.id }
    });

    return claim;
  },

  // Connector Layer Stubs (Future-ready)
  async checkEligibility(cardNo) {
    console.log("Future API: Checking eligibility for", cardNo);
    return { status: 'mock_active', name: 'NHIF Standard' };
  },
  
  async requestPreAuth(data) {
    console.log("Future API: Requesting Pre-Auth", data);
    return { authCode: 'PA-' + Math.random().toString(36).substr(2, 9).toUpperCase() };
  },

  async submitOneClick(claimId) {
    console.log("Future API: One-click submission for", claimId);
    throw new Error("API Connectors not configured for this facility (STUB)");
  },

  async getAllClaims(facilityId) {
    const q = [where('facilityId', '==', facilityId), orderBy('createdAt', 'desc')];
    try {
      return await firestoreService.getAll(this.collection, q);
    } catch (e) {
      // Fallback if index missing
      const fallbackQ = [where('facilityId', '==', facilityId)];
      const results = await firestoreService.getAll(this.collection, fallbackQ);
      return results.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    }
  },

  async updateClaimStatus(claimId, status, userData) {
    const result = await firestoreService.update(this.collection, claimId, { 
      status, 
      lastUpdated: new Date() 
    });

    await auditService.logActivity({
      userId: userData?.uid,
      userName: userData?.name,
      action: 'UPDATE_CLAIM_STATUS',
      module: 'FINANCIAL',
      description: `Updated claim status to ${status}`,
      metadata: { claimId }
    });

    return result;
  }
};

export default claimService;
