import { Project, Vendor, InvestigationCase, AuditLog } from '../types';

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    projectId: 'MPL-2026-00481',
    workTitle: 'Construction of Community Hall at Village Kashi',
    category: 'Community Infrastructure',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    constituency: 'Varanasi',
    mpName: 'Honble MP (Varanasi)',
    implementingAgency: 'PWD Division 1',
    vendorName: 'Shree Infra Tech Pvt Ltd',
    recommendedAmount: 4500000,
    sanctionedAmount: 4200000,
    actualExpenditure: 4200000,
    peerMedianAmount: 2580000,
    recommendationDate: '2024-02-10',
    sanctionDate: '2024-03-01',
    targetCompletionDate: '2024-08-30',
    status: 'Work Started',
    riskScore: 91,
    riskLevel: 'CRITICAL',
    regLatitude: 25.3176,
    regLongitude: 82.9739,
    photoLatitude: 26.8467,
    photoLongitude: 80.9462,
    gpsDistanceMeters: 8400,
    beforePhotoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=400',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    anomalies: [
      {
        id: 'a1',
        projectId: 'p1',
        type: 'FINANCIAL',
        severity: 'HIGH',
        title: 'Expenditure Deviation',
        explanation: 'Actual expenditure is 41% above the median expenditure of comparable community hall projects.',
        supportingMetric: 'Rs 42.0 L vs Rs 25.8 L Peer Median',
        scoreContribution: 32
      },
      {
        id: 'a2',
        projectId: 'p1',
        type: 'VENDOR',
        severity: 'CRITICAL',
        title: 'Vendor Concentration Anomaly',
        explanation: 'Vendor Shree Infra Tech holds an unusually high project concentration (87%) across 2 local agencies without open competitive bidding.',
        supportingMetric: '87% Single-Vendor Allocation',
        scoreContribution: 24
      },
      {
        id: 'a3',
        projectId: 'p1',
        type: 'TIMELINE',
        severity: 'MODERATE',
        title: 'Execution Stasis Gap',
        explanation: 'Project completion duration displays a 180-day delay gap relative to sanctioned milestones.',
        supportingMetric: '180 Days Stasis Gap',
        scoreContribution: 18
      },
      {
        id: 'a4',
        projectId: 'p1',
        type: 'GEOGRAPHIC',
        severity: 'CRITICAL',
        title: 'Geo-Location Mismatch',
        explanation: 'Uploaded photo EXIF embedded GPS coordinates are 8.4 km away from the registered worksite bounds.',
        supportingMetric: '8.4 km GPS Distance Mismatch',
        scoreContribution: 9
      }
    ]
  },
  {
    id: 'p2',
    projectId: 'MPL-2026-00102',
    workTitle: 'Installation of Solar Street Lights (50 Units)',
    category: 'Road & Transport',
    state: 'Bihar',
    district: 'Patna',
    constituency: 'Patna Sahib',
    mpName: 'Honble MP (Patna Sahib)',
    implementingAgency: 'REO Division 2',
    vendorName: 'Apex Trading & Energy Services',
    recommendedAmount: 4500000,
    sanctionedAmount: 4200000,
    actualExpenditure: 4200000,
    peerMedianAmount: 1425000,
    recommendationDate: '2024-01-15',
    sanctionDate: '2024-02-12',
    targetCompletionDate: '2024-06-30',
    status: 'Completed',
    riskScore: 78,
    riskLevel: 'HIGH',
    regLatitude: 25.5941,
    regLongitude: 85.1376,
    photoLatitude: 25.5945,
    photoLongitude: 85.1380,
    gpsDistanceMeters: 45,
    beforePhotoUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=400',
    afterPhotoUrl: 'https://images.unsplash.com/photo-1508873696983-2df515122519?w=400',
    anomalies: [
      {
        id: 'a5',
        projectId: 'p2',
        type: 'FINANCIAL',
        severity: 'HIGH',
        title: 'SSR Rate Inflation',
        explanation: 'Unit cost of Rs 84,000/unit is 2.9x higher than CPWD Standard Schedule of Rates benchmark (Rs 28,500/unit).',
        supportingMetric: '294% SSR Benchmark Deviation',
        scoreContribution: 45
      }
    ]
  },
  {
    id: 'p3',
    projectId: 'MPL-2026-00942',
    workTitle: 'Deep Borewell Drinking Water Supply Scheme',
    category: 'Drinking Water',
    state: 'Maharashtra',
    district: 'Pune',
    constituency: 'Pune',
    mpName: 'Honble MP (Pune)',
    implementingAgency: 'Zilla Parishad Water Wing',
    vendorName: 'Vanguard Buildcon Pvt Ltd',
    recommendedAmount: 1500000,
    sanctionedAmount: 1400000,
    actualExpenditure: 950000,
    peerMedianAmount: 1200000,
    recommendationDate: '2024-04-01',
    sanctionDate: '2024-04-20',
    targetCompletionDate: '2024-09-30',
    status: 'Work Started',
    riskScore: 24,
    riskLevel: 'LOW',
    regLatitude: 18.5204,
    regLongitude: 73.8567,
    anomalies: []
  }
];

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    vendorId: 'VND-UP-8841',
    name: 'Shree Infra Tech Pvt Ltd',
    gstin: '09AAACS8841F1Z2',
    totalProjects: 18,
    totalExpenditure: 38200000,
    riskLevel: 'CRITICAL',
    agencyCount: 2,
    districtCount: 1
  },
  {
    id: 'v2',
    vendorId: 'VND-BR-4102',
    name: 'Apex Trading & Energy Services',
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
    name: 'Vanguard Buildcon Pvt Ltd',
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
    title: 'Investigation into Financial & Geo-Location Mismatch at Kashi Community Hall',
    priority: 'CRITICAL',
    status: 'OPEN',
    assignedRole: 'DISTRICT',
    assignedState: 'Uttar Pradesh',
    assignedDistrict: 'Varanasi',
    createdAt: '2026-08-30 10:21 AM',
    actions: [
      {
        id: 'act1',
        timestamp: '10:21 AM',
        user: 'NIRMAN AI Risk Engine',
        role: 'MINISTRY',
        action: 'Anomaly Detected',
        notes: 'AI Risk Score 91/100 triggered automatically.'
      },
      {
        id: 'act2',
        timestamp: '10:25 AM',
        user: 'District Collector Varanasi',
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
    timestamp: '2026-08-30 10:21:04',
    user: 'AI Risk Engine v2.4',
    role: 'MINISTRY',
    action: 'FLAGGED_ANOMALY',
    entity: 'Project #MPL-2026-00481',
    details: 'Flagged Critical Risk (Score: 91/100). Reason: Financial + Vendor + Geo location mismatch.'
  },
  {
    id: 'log2',
    timestamp: '2026-08-30 10:25:30',
    user: 'District Collector Varanasi',
    role: 'DISTRICT',
    action: 'CREATED_CASE',
    entity: 'Case #CASE-MPL-2026-00481',
    details: 'Investigation initiated. Disbursal freeze order requested.'
  }
];
