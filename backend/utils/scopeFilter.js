/**
 * Authority Scope Filter Helper
 * Enforces server-side data isolation based on authenticated officer credentials.
 */

export function getAuthorityScopeFilter(user) {
  if (!user) return {};

  const role = (user.role || '').toUpperCase();

  // 1. National Scope: Ministry / Super Admin -> Nationwide access
  if (['MINISTRY', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
    return {};
  }

  // 2. Minister Scope: Scoped to their assigned regional portfolio / State area
  if (role === 'MINISTER') {
    const andClauses = [];
    if (user.state && user.state !== 'All India') {
      andClauses.push({ state: { equals: user.state.trim() } });
    }
    if (user.district && user.district !== 'All Districts') {
      andClauses.push({ district: { equals: user.district.trim() } });
    }
    if (andClauses.length === 0) return {};
    if (andClauses.length === 1) return andClauses[0];
    return { AND: andClauses };
  }

  // 3. State Authority Scope -> Restricted strictly to their assigned state
  if (role === 'STATE') {
    if (!user.state || user.state === 'All India') {
      return {};
    }
    return {
      state: {
        equals: user.state.trim()
      }
    };
  }

  // 3. District Authority Scope -> Restricted strictly to their assigned state AND district
  if (role === 'DISTRICT') {
    const andClauses = [];

    if (user.state && user.state !== 'All India') {
      andClauses.push({
        state: { equals: user.state.trim() }
      });
    }

    if (user.district && user.district !== 'All Districts') {
      andClauses.push({
        district: { equals: user.district.trim() }
      });
    }

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

  const projState = (project.state || '').trim().toLowerCase();
  const projDistrict = (project.district || '').trim().toLowerCase();

  const userState = (user.state || '').trim().toLowerCase();
  const userDistrict = (user.district || '').trim().toLowerCase();

  // Minister Scope Validation
  if (role === 'MINISTER') {
    if (userState && userState !== 'all india' && projState !== userState) {
      return false;
    }
    if (userDistrict && userDistrict !== 'all districts' && projDistrict !== userDistrict) {
      return false;
    }
    return true;
  }

  if (role === 'STATE') {
    if (!userState || userState === 'all india') return true;
    return projState === userState;
  }

  if (role === 'DISTRICT') {
    const stateMatch = (!userState || userState === 'all india') || (projState === userState);
    const districtMatch = (!userDistrict || userDistrict === 'all districts') || (projDistrict === userDistrict);
    return stateMatch && districtMatch;
  }

  return false;
}
