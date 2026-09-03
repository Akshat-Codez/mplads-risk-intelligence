import { Project } from '../types';
import { getCanonicalDistrict, normalizeStateName } from '../data/indiaHierarchy';

export interface StateGISMetrics {
  state: string;
  lat: number;
  lng: number;
  totalWorks: number;
  totalSanctionedCr: number;
  highRiskCount: number;
  avgRiskScore: number;
  riskCategory: 'HIGH' | 'MODERATE' | 'LOW';
  color: string;
}

export interface DistrictGISMetrics {
  district: string;
  state: string;
  lat: number;
  lng: number;
  totalWorks: number;
  totalSanctionedLakhs: number;
  highRiskCount: number;
  avgRiskScore: number;
  riskCategory: 'HIGH' | 'MODERATE' | 'LOW';
  color: string;
}

// Bounding Centroids for Indian States & UTs
const STATE_COORDINATES: Record<string, [number, number]> = {
  'KARNATAKA': [15.3173, 75.7139],
  'BIHAR': [25.0961, 85.3131],
  'UTTAR PRADESH': [26.8467, 80.9462],
  'KERALA': [10.8505, 76.2711],
  'NAGALAND': [26.1584, 94.5624],
  'MAHARASHTRA': [19.7515, 75.7139],
  'RAJASTHAN': [27.0238, 74.2179],
  'MADHYA PRADESH': [22.9734, 78.6569],
  'TAMIL NADU': [11.1271, 78.6569],
  'WEST BENGAL': [22.9868, 87.8550],
  'GUJARAT': [22.2587, 71.1924],
  'PUNJAB': [31.1471, 75.3412],
  'HARYANA': [29.0588, 76.0856],
  'ODISHA': [20.9517, 85.0985],
  'ASSAM': [26.2006, 92.9376]
};

// Bounding Centroids for Key Districts
const DISTRICT_COORDINATES: Record<string, [number, number]> = {
  'BENGALURU URBAN': [12.9716, 77.5946],
  'PATNA': [25.5941, 85.1376],
  'PURBI CHAMPARAN': [26.6500, 84.9167],
  'KHERI': [27.9500, 80.7833],
  'UNNAO': [26.5500, 80.4833],
  'VARANASI': [25.3176, 82.9739],
  'KOHIMA': [25.6701, 94.1077],
  'THIRUVANANTHAPURAM': [8.5241, 76.9366],
  'LUCKNOW': [26.8467, 80.9462],
  'GORAKHPUR': [26.7606, 83.3732]
};

/**
 * Centralized Official Risk Level & Color Mapping Function
 * Used across GIS Maps, Project Detail Dossiers, and Dashboard Tables
 */
export function getRiskCategoryAndColor(score: number, level?: string): { category: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'; color: string } {
  const normLevel = (level || '').toUpperCase().trim();

  // 1. Critical tier (score >= 80 or explicit CRITICAL level)
  if (normLevel === 'CRITICAL' || score >= 80) {
    return { category: 'CRITICAL', color: '#991B1B' }; // Dark Red
  }

  // 2. High Risk Review tier (score >= 50 or explicit HIGH level)
  if (normLevel === 'HIGH' || score >= 50) {
    return { category: 'HIGH', color: '#EF4444' }; // Red
  }

  // 3. Moderate / Medium Watch tier (score >= 25 or explicit MEDIUM/MODERATE level)
  if (normLevel === 'MEDIUM' || normLevel === 'MODERATE' || score >= 25) {
    return { category: 'MODERATE', color: '#F59E0B' }; // Amber / Yellow
  }

  // 4. Low Risk Baseline tier (score < 25 or explicit LOW level)
  return { category: 'LOW', color: '#10B981' }; // Green
}

/**
 * Dynamically computes State-level GIS Risk Metrics from dataset
 */
export function computeStateGISMetrics(projects: Project[]): StateGISMetrics[] {
  const stateMap: Record<string, { total: number; sumSanctioned: number; highRisk: number; sumScore: number }> = {};

  projects.forEach(p => {
    const st = (p.state || 'Karnataka').toUpperCase();
    if (!stateMap[st]) {
      stateMap[st] = { total: 0, sumSanctioned: 0, highRisk: 0, sumScore: 0 };
    }
    stateMap[st].total += 1;
    stateMap[st].sumSanctioned += p.sanctionedAmount || 0;
    const s = p.riskScore ?? p.prototype_risk_score ?? 0;
    stateMap[st].sumScore += s;
    const l = p.riskLevel || p.risk_level;
    if (s >= 50 || l === 'HIGH' || l === 'CRITICAL') {
      stateMap[st].highRisk += 1;
    }
  });

  return Object.keys(stateMap).map(stKey => {
    const data = stateMap[stKey];
    const avgScore = Math.round(data.sumScore / (data.total || 1));
    const highRiskRatio = data.highRisk / (data.total || 1);

    let riskCategory: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    let color = '#10B981'; // Green (Low risk)

    if (avgScore >= 50 || highRiskRatio > 0.15 || data.highRisk >= 3) {
      riskCategory = 'HIGH';
      color = '#EF4444'; // Red (High risk priority)
    } else if (avgScore >= 25 || highRiskRatio > 0.05 || data.highRisk >= 1) {
      riskCategory = 'MODERATE';
      color = '#F59E0B'; // Yellow/Amber (Moderate watch)
    }

    const coords = STATE_COORDINATES[stKey] || [20.5937, 78.9629];

    return {
      state: stKey,
      lat: coords[0],
      lng: coords[1],
      totalWorks: data.total,
      totalSanctionedCr: parseFloat((data.sumSanctioned / 10000000).toFixed(2)),
      highRiskCount: data.highRisk,
      avgRiskScore: avgScore,
      riskCategory,
      color
    };
  });
}

/**
 * Dynamically computes District-level GIS Risk Metrics for a given State
 */
export function computeDistrictGISMetrics(projects: Project[], selectedState: string): DistrictGISMetrics[] {
  const normState = normalizeStateName(selectedState);
  const stateProjects = selectedState === 'ALL'
    ? projects
    : projects.filter(p => normalizeStateName(p.state) === normState || (p.state && p.state.toUpperCase().includes(selectedState.toUpperCase())));

  const districtMap: Record<string, { total: number; sumSanctioned: number; highRisk: number; sumScore: number; state: string; canonicalName: string }> = {};

  stateProjects.forEach(p => {
    const rawDst = p.district || 'Bengaluru Urban';
    const canonicalDst = getCanonicalDistrict(rawDst, selectedState);
    const key = canonicalDst.toUpperCase();
    const st = (p.state || selectedState).toUpperCase();

    if (!districtMap[key]) {
      districtMap[key] = { total: 0, sumSanctioned: 0, highRisk: 0, sumScore: 0, state: st, canonicalName: canonicalDst };
    }
    districtMap[key].total += 1;
    districtMap[key].sumSanctioned += p.sanctionedAmount || 0;
    const s = p.riskScore ?? p.prototype_risk_score ?? 0;
    districtMap[key].sumScore += s;
    const l = p.riskLevel || p.risk_level;
    if (s >= 50 || l === 'HIGH' || l === 'CRITICAL') {
      districtMap[key].highRisk += 1;
    }
  });

  return Object.keys(districtMap).map(dstKey => {
    const data = districtMap[dstKey];
    const avgScore = Math.round(data.sumScore / (data.total || 1));
    const highRiskRatio = data.highRisk / (data.total || 1);

    let riskCategory: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    let color = '#10B981'; // Green

    if (avgScore >= 50 || highRiskRatio > 0.15 || data.highRisk >= 2) {
      riskCategory = 'HIGH';
      color = '#EF4444'; // Red
    } else if (avgScore >= 25 || highRiskRatio > 0.05 || data.highRisk >= 1) {
      riskCategory = 'MODERATE';
      color = '#F59E0B'; // Yellow/Amber
    }

    const coords = DISTRICT_COORDINATES[dstKey] || [12.9716, 77.5946];

    return {
      district: data.canonicalName || dstKey,
      state: data.state,
      lat: coords[0],
      lng: coords[1],
      totalWorks: data.total,
      totalSanctionedLakhs: parseFloat((data.sumSanctioned / 100000).toFixed(1)),
      highRiskCount: data.highRisk,
      avgRiskScore: avgScore,
      riskCategory,
      color
    };
  });
}
