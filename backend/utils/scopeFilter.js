import { normalizeStateName, getDistrictQueryVariants, normalizeLocationName, getCanonicalDistrict } from '../data/indiaHierarchy.js';

/**
 * Authority Scope Filter Helper
 * Enforces server-side data isolation based on authenticated officer credentials.
 * Uses canonical geographic normalization to ensure valid projects are never
 * excluded due to case sensitivity, whitespace, or spelling aliases.
 */
export function getAuthorityScopeFilter(user) {
  if (!user) return {};

  const role = (user.role || '').toUpperCase();

  // 1. National Scope: Ministry / Super Admin -> Nationwide access
  if (['MINISTRY', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return {};
  }

  // Helper to build state filter matching both canonical and raw representation
  const buildStateCondition = (stateInput) => {
    if (!stateInput || stateInput === 'All India' || stateInput === 'ALL') return null;
    const canonical = normalizeStateName(stateInput);
    const variants = Array.from(new Set([
      stateInput.trim(),
      canonical,
      canonical ? canonical.toUpperCase() : null,
      canonical ? canonical.toLowerCase() : null
    ])).filter(Boolean);
    return { OR: variants.map(v => ({ state: { contains: v } })) };
  };

  // Helper to build district filter matching all query aliases and case variants
  const buildDistrictCondition = (distInput) => {
    if (!distInput || distInput === 'All Districts' || distInput === 'ALL') return null;
    const variants = getDistrictQueryVariants(distInput);
    return { OR: variants.map(v => ({ district: { contains: v } })) };
  };

  // 2. Minister Scope: Scoped to their assigned regional portfolio / State area
  if (role === 'MINISTER') {
    const andClauses = [];
    const stateCond = buildStateCondition(user.state);
    if (stateCond) andClauses.push(stateCond);

    const distCond = buildDistrictCondition(user.district);
    if (distCond) andClauses.push(distCond);

    if (andClauses.length === 0) return {};
    if (andClauses.length === 1) return andClauses[0];
    return { AND: andClauses };
  }

  // 3. State Authority Scope -> Restricted strictly to their assigned state
  if (role === 'STATE') {
    const stateCond = buildStateCondition(user.state);
    return stateCond || {};
  }

  // 4. District Authority Scope -> Restricted strictly to their assigned state AND district
  if (role === 'DISTRICT') {
    const andClauses = [];
    const stateCond = buildStateCondition(user.state);
    if (stateCond) andClauses.push(stateCond);

    const distCond = buildDistrictCondition(user.district);
    if (distCond) andClauses.push(distCond);

    if (andClauses.length === 0) return {};
    if (andClauses.length === 1) return andClauses[0];
    return { AND: andClauses };
  }

  return {};
}

/**
 * Validates whether a specific project is within the authority's permitted scope.
 * Returns true if permitted, false otherwise.
 */
export function isProjectInScope(user, project) {
  if (!user || !project) return false;

  const role = (user.role || '').toUpperCase();
  if (['MINISTRY', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return true;
  }

  const projState = normalizeLocationName(project.state);
  const projDistrict = normalizeLocationName(project.district);

  const userState = normalizeLocationName(user.state);
  const userDistrict = normalizeLocationName(user.district);

  const stateMatches = !userState || userState === 'all india' || userState === 'all' ||
    projState === userState || normalizeLocationName(normalizeStateName(project.state)) === normalizeLocationName(normalizeStateName(user.state));

  if (!stateMatches) return false;

  if (role === 'DISTRICT' || (role === 'MINISTER' && userDistrict && userDistrict !== 'all districts' && userDistrict !== 'all')) {
    const projCanonicalDist = normalizeLocationName(getCanonicalDistrict(project.district, project.state));
    const userCanonicalDist = normalizeLocationName(getCanonicalDistrict(user.district, user.state));
    const distMatches = projDistrict === userDistrict || 
      projCanonicalDist === userCanonicalDist || 
      projDistrict === userCanonicalDist || 
      projCanonicalDist === userDistrict;
    return distMatches;
  }

  return true;
}
