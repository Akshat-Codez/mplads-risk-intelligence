import { Project, Vendor, InvestigationCase, AuditLog } from '../types';
import REAL_DATASET from './realDataset.json';

export const MOCK_PROJECTS: Project[] = REAL_DATASET as Project[];

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    vendorId: 'VND-KAR-8841',
    name: 'N G GANESH BABU',
    gstin: '29AAACS8841F1Z2',
    totalProjects: 18,
    totalExpenditure: 38200000,
    riskLevel: 'CRITICAL',
    agencyCount: 2,
    districtCount: 1
  },
  {
    id: 'v2',
    vendorId: 'VND-BR-4102',
    name: 'GUDIYA KUMARI',
    gstin: '10AABCA4102G1Z8',
    totalProjects: 12,
    totalExpenditure: 24500000,
    riskLevel: 'HIGH',
    agencyCount: 3,
    districtCount: 2
  },
  {
    id: 'v3',
    vendorId: 'VND-MH-1109',
    name: 'ASSISTANT ENGINEER DIGHA',
    gstin: '27AABCV1109H1Z4',
    totalProjects: 6,
    totalExpenditure: 11200000,
    riskLevel: 'LOW',
    agencyCount: 4,
    districtCount: 3
  }
];

export const MOCK_CASES: InvestigationCase[] = [
  {
    id: 'c1',
    caseNumber: 'CASE-MPL-2026-00481',
    projectId: 'p1',
    project: MOCK_PROJECTS[0],
    title: 'Investigation into Financial & Cost Deviation in Bangalore Urban',
    priority: 'CRITICAL',
    status: 'OPEN',
    assignedRole: 'DISTRICT',
    assignedState: 'Karnataka',
    assignedDistrict: 'BENGALURU URBAN',
    createdAt: '2026-08-31 10:21 AM',
    actions: [
      {
        id: 'act1',
        timestamp: '10:21 AM',
        user: 'NIRMAN AI Risk Engine',
        role: 'MINISTRY',
        action: 'Anomaly Detected',
        notes: 'AI Risk Score 65/100 triggered automatically for Peer Cost Deviation.'
      },
      {
        id: 'act2',
        timestamp: '10:25 AM',
        user: 'District Collector Bengaluru',
        role: 'DISTRICT',
        action: 'Investigation Created',
        notes: 'Case registered and field inspector assigned.'
      }
    ]
  }
];

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log1',
    timestamp: '2026-08-31 10:21:04',
    user: 'AI Scored Pipeline (Records: 1051)',
    role: 'MINISTRY',
    action: 'FLAGGED_ANOMALY',
    entity: 'Dataset #MPLADS-eSAKSHI-1051',
    details: 'Flagged 6 High Risk & 23 Potentially Similar Works across 1,051 records.'
  }
];
