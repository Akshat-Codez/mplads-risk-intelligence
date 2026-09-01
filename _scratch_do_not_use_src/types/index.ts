export type Role = 'MINISTER' | 'MINISTRY' | 'STATE' | 'DISTRICT';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type CaseStatus = 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface User {
  id: string;
  authorityId: string;
  name: string;
  email: string;
  role: Role;
  state?: string;
  district?: string;
}

export interface MP {
  id: string;
  name: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  constituency: string;
  state: string;
  sanctionedRatio: number;
}

export interface Vendor {
  id: string;
  vendorId: string;
  name: string;
  gstin: string;
  totalProjects: number;
  totalExpenditure: number;
  riskLevel: RiskLevel;
  agencyCount: number;
  districtCount: number;
}

export interface Anomaly {
  id: string;
  projectId: string;
  type: 'FINANCIAL' | 'VENDOR' | 'TIMELINE' | 'PEER_DEVIATION' | 'GEOGRAPHIC';
  severity: RiskLevel;
  title: string;
  explanation: string;
  supportingMetric: string;
  scoreContribution: number;
}

export interface Project {
  id: string;
  projectId: string;
  workTitle: string;
  category: 'Road & Transport' | 'Drinking Water' | 'Education' | 'Health' | 'Community Infrastructure';
  state: string;
  district: string;
  constituency: string;
  mpName: string;
  implementingAgency: string;
  vendorName: string;
  recommendedAmount: number;
  sanctionedAmount: number;
  actualExpenditure: number;
  peerMedianAmount: number;
  recommendationDate: string;
  sanctionDate: string;
  targetCompletionDate: string;
  status: 'Recommended' | 'Sanctioned' | 'Work Started' | 'Completed';
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  regLatitude: number;
  regLongitude: number;
  photoLatitude?: number;
  photoLongitude?: number;
  gpsDistanceMeters?: number;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  anomalies: Anomaly[];
}

export interface CaseAction {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  notes?: string;
}

export interface InvestigationCase {
  id: string;
  caseNumber: string;
  projectId: string;
  project: Project;
  title: string;
  priority: Priority;
  status: CaseStatus;
  assignedRole: Role;
  assignedState: string;
  assignedDistrict: string;
  createdAt: string;
  actions: CaseAction[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: Role;
  action: string;
  entity: string;
  details: string;
}
