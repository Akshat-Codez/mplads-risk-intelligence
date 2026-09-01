function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

export default function calculateGisRisk(project, allProjects) {
  let score = 0;
  const signals = [];
  const dataUsed = [];
  const missingData = [];

  const { latitude, longitude, contractorId, district, description } = project;

  if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
    missingData.push('latitude', 'longitude');
    return { score: 0, level: 'LOW', signals, dataUsed, missingData };
  }
  
  dataUsed.push('latitude', 'longitude');

  if (allProjects && Array.isArray(allProjects)) {
    dataUsed.push('allProjects');
    let nearbySameContractor = 0;
    let projectsWithin2km = 0;
    let highRiskInDistrict = 0;
    let totalInDistrict = 0;
    let similarNearby = 0;

    const minLat = latitude - 0.05;
    const maxLat = latitude + 0.05;
    const minLng = longitude - 0.05;
    const maxLng = longitude + 0.05;

    for (let i = 0; i < allProjects.length; i++) {
      const p = allProjects[i];
      if (p.id === project.id) continue;
      
      if (p.district === district) {
        totalInDistrict++;
        if (p.riskLevel === 'HIGH' || p.riskScore >= 50) highRiskInDistrict++;
      }

      if (p.latitude && p.longitude) {
        if (p.latitude < minLat || p.latitude > maxLat || p.longitude < minLng || p.longitude > maxLng) continue;
        const dist = haversine(latitude, longitude, p.latitude, p.longitude);
        
        if (dist < 1 && p.contractorId === contractorId) nearbySameContractor++;
        if (dist <= 2) projectsWithin2km++;
        
        if (dist < 1 && description && p.description && p.description.substring(0, 10) === description.substring(0, 10)) {
           similarNearby++;
        }
      }
    }

    if (nearbySameContractor > 0) {
      score += 15;
      signals.push({ signal: 'Geographic concentration', description: 'Nearby projects (<1km) with same contractor', points: 15, evidence: `Found ${nearbySameContractor} projects` });
    }

    if (projectsWithin2km > 5) {
      score += 8;
      signals.push({ signal: 'Spatial clustering', description: '> 5 projects within 2km', points: 8, evidence: `Found ${projectsWithin2km} projects` });
    }

    if (totalInDistrict > 0 && (highRiskInDistrict / totalInDistrict) > 0.4) {
      score += 10;
      signals.push({ signal: 'District risk concentration', description: '> 40% high-risk projects in district', points: 10, evidence: `${((highRiskInDistrict / totalInDistrict)*100).toFixed(1)}% high risk` });
    }

    if (similarNearby > 0) {
      score += 12;
      signals.push({ signal: 'Repeated works', description: 'Similar description within 1km', points: 12, evidence: `Found ${similarNearby} similar works` });
    }
  } else {
    missingData.push('allProjects');
  }

  score = Math.min(score, 100);
  let level = 'LOW';
  if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';

  return { score, level, signals, dataUsed, missingData };
}
