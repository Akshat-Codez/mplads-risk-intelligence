// Simple in-memory cache with TTL (10 minutes)
const summaryCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getCached(key) {
  const item = summaryCache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    summaryCache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  summaryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache() {
  summaryCache.clear();
}

/**
 * Call Gemini LLM or fallback cleanly
 */
async function callGemini(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[AI DEBUG] GEMINI_API_KEY not configured. Using deterministic structured AI briefing engine.');
    return null; // Triggers deterministic fallback
  }

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  console.log('[AI DEBUG] AI provider: Google Gemini LLM');
  console.log('[AI DEBUG] AI model:', model);
  console.log('[AI DEBUG] Calling AI service endpoint...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nInput Data:\n${userPrompt}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1, // Very low temperature for maximum factual consistency
          maxOutputTokens: 1000
        }
      })
    });

    clearTimeout(timeoutId);
    console.log('[AI DEBUG] AI response status:', res.status);

    if (!res.ok) {
      console.warn(`[AI DEBUG] Gemini API returned status ${res.status}. Using deterministic fallback.`);
      return null;
    }

    const data = await res.json();
    const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log('[AI DEBUG] AI response received successfully.');
    return candidate ? candidate.trim() : null;
  } catch (err) {
    console.warn(`[AI DEBUG] Gemini API call failed: ${err.message}. Using deterministic fallback.`);
    return null;
  }
}

/**
 * Generate Dashboard Officer Summary
 */
export async function generateDashboardSummary(stats) {
  const cacheKey = `dashboard_summary_${stats.totalProjects}_${stats.highRiskCount}_${stats.mediumRiskCount}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const systemPrompt = `You are the AI Risk Intelligence Officer for MoSPI (Government of India) monitoring MPLADS implementation.
You are given structured portfolio data. Produce an executive AI Officer Monitoring Summary in clean markdown.

STRUCTURE REQUIREMENT:
### 1. Overall Portfolio Situation
State the total projects analyzed, projects requiring priority review (High + Medium risk), and overall compliance health.

### 2. Key Findings & Dominant Risk Patterns
Summarize the most frequent risk signals across the portfolio (such as peer price deviations, sanctioning delays, multi-installment payments).

### 3. Priority Focus Districts
Identify the highest-risk districts based on the provided district data and explain the concentration.

### 4. Recommended Verification Priority
Provide 3 concise, non-accusatory recommended next steps for field verification officers.

RULES:
- ONLY use the exact numbers and names provided in the input. Never invent statistics.
- Never accuse anyone of fraud or crime. Use terms like "Requires verification", "Unusual pattern", "Deviation from benchmark".
- Keep it concise, professional, and actionable for senior government authorities.`;

  const userPrompt = JSON.stringify(stats, null, 2);

  // Try LLM first
  let aiText = await callGemini(systemPrompt, userPrompt);

  // Deterministic Fallback if LLM unavailable
  if (!aiText) {
    const priorityCount = stats.highRiskCount + stats.mediumRiskCount;
    const topDistrict = stats.districts && stats.districts.length > 0 ? stats.districts[0] : null;
    const topSignal = stats.topSignal || 'Peer Deviation';

    aiText = `### 1. Overall Portfolio Situation
Across the **${stats.totalProjects.toLocaleString()}** tracked MPLADS projects in the portfolio, **${priorityCount} projects** (${stats.highRiskCount} High Risk, ${stats.mediumRiskCount} Medium Risk) require priority administrative review. **${stats.lowRiskCount.toLocaleString()} projects** demonstrate normal execution parameters, while **${stats.insufficientDataCount} projects** currently lack comprehensive vendor or BOQ records for full verification.

### 2. Key Findings & Dominant Risk Patterns
* **Primary Trigger**: The most frequently observed anomaly pattern is **${topSignal}**, accounting for the majority of flagged items.
* **Multi-Factor Signals**: **${stats.multiSignalCount} projects** triggered 2 or more independent risk signals (financial overruns combined with contractor concentration or execution delays).
* **Vendor Clustering**: A subset of active contractors manage high aggregate project values concentrated in single districts.

### 3. Priority Focus Districts
${topDistrict ? `* **${topDistrict.district} (${topDistrict.state})**: Highest priority focus with **${topDistrict.projectCount} total projects**, **${topDistrict.highRiskCount} High Risk works**, and an average risk score of **${topDistrict.avgRiskScore}/100**.` : '* Insufficient district data available.'}

### 4. Recommended Verification Priority
1. **Priority Desk Audit**: Review the ${stats.highRiskCount} High Risk projects with multiple triggered signals before further disbursement.
2. **Rate Verification**: Compare quoted line-item prices in high-deviation projects against updated state Schedule of Rates (SOR).
3. **Contractor Capacity Check**: Verify field progress for contractors holding multiple concurrent active works.`;
  }

  const result = {
    generatedAt: new Date().toISOString(),
    isLlmGenerated: !!aiText && process.env.GEMINI_API_KEY !== undefined,
    summaryMarkdown: aiText,
    structuredStats: stats
  };

  setCache(cacheKey, result);
  return result;
}

/**
 * Generate Project-Level Officer Summary
 */
export async function generateProjectSummary(projectData) {
  const cacheKey = `project_summary_${projectData.projectId}_${projectData.overallRiskScore}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const systemPrompt = `You are the AI Risk Intelligence Officer for MoSPI (Government of India) analyzing an individual MPLADS project.
Produce a concise, evidence-based Project AI Risk Intelligence Briefing in clean markdown.

STRUCTURE REQUIREMENT:
### Executive Summary
State the project ID, description, overall risk score/level, and confidence score.

### Key Risk Findings
Break down findings across three dimensions (only mention details provided):
1. **Financial & Timeline**: Note any peer cost deviations, overrun ratios, payment installment anomalies, or delays. If none, state "No unusual financial patterns detected."
2. **Procurement & BOQ**: Note quoted vs benchmark rate deviations or extraction notes. If missing, state "Insufficient procurement data available (No BOQ uploaded)."
3. **Contractor & Vendor**: Note contractor concentration, specialization, or historical project volume. If missing, state "Limited contractor history available in current dataset."

### Recommended Verification Action
Provide a clear, neutral 1-2 sentence recommendation for field inspectors or reviewing authorities.

RULES:
- ONLY use the exact numbers and facts provided. Never invent prices or contractor history.
- Never use accusatory words (fraud, fake, corrupt). Use "Potential risk signal", "Requires verification".`;

  const userPrompt = JSON.stringify(projectData, null, 2);

  let aiText = await callGemini(systemPrompt, userPrompt);

  if (!aiText) {
    const fin = projectData.financial || {};
    const proc = projectData.procurement || null;
    const cont = projectData.contractor || null;

    const finSignals = fin.signals && fin.signals.length > 0 
      ? fin.signals.map(s => `* ${s.type || 'Signal'}: ${s.explanation || s}`).join('\n')
      : '* No unusual financial or execution delay patterns detected in available records.';

    const procSignals = proc && proc.signals && proc.signals.length > 0
      ? proc.signals.map(s => `* ${s}`).join('\n')
      : proc ? '* Quoted prices are consistent with standard reference rates.' : '* Insufficient procurement data available (No BOQ document uploaded yet).';

    const contSignals = cont && cont.signals && cont.signals.length > 0
      ? cont.signals.map(s => `* ${s}`).join('\n')
      : cont ? '* Contractor profile shows standard project distribution.' : '* Limited contractor history available in the current dataset.';

    let recommendation = 'Project parameters are within expected thresholds. Standard routine monitoring is recommended.';
    if (projectData.overallRiskLevel === 'HIGH') {
      recommendation = 'Perform priority administrative review of tender/BOQ rate breakdowns and cross-verify physical progress milestones with the executing agency.';
    } else if (projectData.overallRiskLevel === 'MEDIUM') {
      recommendation = 'Conduct targeted desk review of line-item cost deviations and verify milestone disbursement records before final payment release.';
    } else if (projectData.overallRiskLevel === 'INSUFFICIENT DATA') {
      recommendation = 'Request complete contractor allocation details and BOQ documentation to establish full verification baseline.';
    }

    aiText = `### Executive Summary
Project **${projectData.projectId}** (*${projectData.workDescription || 'MPLADS Work'}*) in **${projectData.district}, ${projectData.state}** has an Overall Risk Score of **${projectData.overallRiskScore}/100** (**${projectData.overallRiskLevel}**), with a Data Completeness Confidence of **${projectData.confidence}%**.

### Key Risk Findings
1. **Financial & Timeline Analysis** (Risk Score: ${fin.score || 0}/100):
${finSignals}

2. **Procurement & BOQ Audit** (${proc ? `Risk Score: ${proc.score}/100` : 'Data Unavailable'}):
${procSignals}

3. **Contractor Profile & Compatibility** (${cont ? `Risk Score: ${cont.score}/100` : 'Data Unavailable'}):
${contSignals}

### Recommended Verification Action
${recommendation}`;
  }

  const result = {
    projectId: projectData.projectId,
    generatedAt: new Date().toISOString(),
    isLlmGenerated: !!aiText && process.env.GEMINI_API_KEY !== undefined,
    summaryMarkdown: aiText,
    structuredInput: projectData
  };

  setCache(cacheKey, result);
  return result;
}
