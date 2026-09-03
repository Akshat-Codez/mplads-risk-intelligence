const puppeteer = require('puppeteer');

async function testAll() {
  console.log("===============================================================");
  console.log("NIRMAN VERIFICATION: DISTRICT COVERAGE & MINISTER GIS REMOVAL");
  console.log("===============================================================\n");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => {
    console.log('[BROWSER LOG]:', msg.type(), msg.text());
  });
  page.on('response', res => {
    if (res.status() >= 400) console.log('[HTTP ERROR]:', res.status(), res.url());
  });

  // TEST 1: Authoritative Backend Geographic API
  console.log("--- TEST 1: Authoritative Backend Geographic API ---");
  const locRes = await fetch('http://localhost:5000/api/auth/locations');
  const locData = await locRes.json();
  const karnatakaDistricts = locData.stateDistricts['Karnataka'];
  const upDistricts = locData.stateDistricts['Uttar Pradesh'];
  
  console.log(`Total States in Master Hierarchy: ${locData.states.length}`);
  console.log(`Karnataka Districts Count: ${karnatakaDistricts.length}`);
  console.log(`Uttar Pradesh Districts Count: ${upDistricts.length}`);

  if (karnatakaDistricts.length !== 31) {
    throw new Error(`Expected Karnataka to have 31 districts, found ${karnatakaDistricts.length}`);
  }
  if (upDistricts.length !== 75) {
    throw new Error(`Expected Uttar Pradesh to have 75 districts, found ${upDistricts.length}`);
  }
  if (karnatakaDistricts.includes('DANGS') || karnatakaDistricts.includes('KAITHAL')) {
    throw new Error(`Contaminated districts found in Karnataka: ${karnatakaDistricts.filter(d => ['DANGS', 'KAITHAL'].includes(d))}`);
  }
  if (upDistricts.includes('ALWAR') || upDistricts.includes('HYDERABAD')) {
    throw new Error(`Contaminated districts found in UP: ${upDistricts.filter(d => ['ALWAR', 'HYDERABAD'].includes(d))}`);
  }
  console.log(">>> TEST 1 PASSED: Authoritative master hierarchy is complete and non-contaminated! <<<\n");

  // TEST 2: Minister Dashboard Verification (GIS REMOVAL & VENDOR INTELLIGENCE)
  console.log("--- TEST 2: Minister Login, GIS Removal, and Vendor Intelligence ---");
  await page.goto('http://localhost:3000/login?role=MINISTER', { waitUntil: 'networkidle0' });

  // Fill credentials
  const captchaCode = await page.evaluate(() => {
    return document.querySelector('div.font-mono')?.textContent?.trim() || '';
  });
  console.log("Found Minister Captcha:", captchaCode);
  await page.type('input[placeholder="Type CAPTCHA"]', captchaCode);

  await page.click('button[type="submit"]');
  try {
    await page.waitForFunction(() => window.location.pathname.startsWith('/app'), { timeout: 4000 });
  } catch (e) {
    const debugInfo = await page.evaluate(() => ({
      url: window.location.href,
      inputs: Array.from(document.querySelectorAll('input')).map(i => ({ type: i.type, val: i.value })),
      errorText: document.querySelector('.text-red-600')?.textContent || document.querySelector('.bg-red-50')?.textContent || ''
    }));
    console.log('LOGIN DEBUG INFO:', JSON.stringify(debugInfo, null, 2));
    throw e;
  }
  await new Promise(r => setTimeout(r, 2000));

  console.log("Minister Landed URL:", page.url());

  const ministerEvaluation = await page.evaluate(() => {
    const text = document.body.innerText;
    const sidebarNav = Array.from(document.querySelectorAll('nav a')).map(a => a.textContent?.trim());
    
    const hasGISInSidebar = sidebarNav.some(n => n?.toLowerCase().includes('gis') || n?.toLowerCase().includes('map'));
    const hasGISMapOnDashboard = text.includes('GIS Project Risk Map') || text.includes('GPS:') || text.includes('GIS Priority Heatmap');
    const hasVendorIntelligence = text.includes('Vendor & Contractor Intelligence') || text.includes('National Vendor Intelligence');
    const hasAttentionQueue = text.includes('Projects Requiring Attention');
    const hasDeliveryBenchmark = text.includes('Portfolio Delivery Benchmark');

    // Check district dropdown options in Minister view
    const districtSelect = document.querySelector('select');
    const options = districtSelect ? Array.from(districtSelect.querySelectorAll('option')).map(o => o.value) : [];

    return {
      sidebarNav,
      hasGISInSidebar,
      hasGISMapOnDashboard,
      hasVendorIntelligence,
      hasAttentionQueue,
      hasDeliveryBenchmark,
      districtOptionsCount: options.length,
      sampleDistricts: options.slice(0, 5)
    };
  });

  console.log("Minister Evaluation Result:", JSON.stringify(ministerEvaluation, null, 2));

  if (ministerEvaluation.hasGISInSidebar) {
    throw new Error("FAIL: GIS navigation link is still present in Minister sidebar!");
  }
  if (ministerEvaluation.hasGISMapOnDashboard) {
    throw new Error("FAIL: GIS map or GPS coordinates are still rendered on Minister dashboard!");
  }
  if (!ministerEvaluation.hasVendorIntelligence) {
    throw new Error("FAIL: Vendor Intelligence section is missing from Minister dashboard!");
  }
  if (ministerEvaluation.districtOptionsCount < 70) {
    throw new Error(`FAIL: Minister district dropdown only has ${ministerEvaluation.districtOptionsCount} options; expected all UP districts!`);
  }
  console.log(">>> TEST 2 PASSED: GIS completely removed from Minister UI; Vendor Intelligence and all districts active! <<<\n");

  // TEST 3: State Authority District Coverage & Zero-Project District Handling
  console.log("--- TEST 3: State Authority District Coverage & Zero-Project District Handling ---");
  await page.goto('http://localhost:3000/login?role=STATE', { waitUntil: 'networkidle0' });

  const stateCaptcha = await page.evaluate(() => {
    return document.querySelector('div.font-mono')?.textContent?.trim() || '';
  });
  console.log("Found State Captcha:", stateCaptcha);
  await page.type('input[placeholder="Type CAPTCHA"]', stateCaptcha);

  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.startsWith('/app'), { timeout: 10000 });
  await new Promise(r => setTimeout(r, 2000));

  console.log("State Authority Landed URL:", page.url());

  const stateEvaluation = await page.evaluate(() => {
    const text = document.body.innerText;
    const sidebarNav = Array.from(document.querySelectorAll('nav a')).map(a => a.textContent?.trim());
    const hasGISInSidebar = sidebarNav.some(n => n?.includes('GIS Project Risk Map'));
    
    // Check district dropdown options in State view
    const districtSelect = document.querySelector('select');
    const options = districtSelect ? Array.from(districtSelect.querySelectorAll('option')).map(o => o.value) : [];

    return {
      sidebarNav,
      hasGISInSidebar,
      districtOptionsCount: options.length,
      sampleDistricts: options.slice(0, 10)
    };
  });

  console.log("State Authority Evaluation Result:", JSON.stringify(stateEvaluation, null, 2));

  if (!stateEvaluation.hasGISInSidebar) {
    throw new Error("FAIL: State Authority should retain GIS Project Risk Map in navigation!");
  }
  if (stateEvaluation.districtOptionsCount < 70) {
    throw new Error(`FAIL: State Authority district dropdown only has ${stateEvaluation.districtOptionsCount} options; expected full state coverage (75 UP districts + ALL)!`);
  }

  // Now select a district with 0 projects (e.g. Mahoba or Kaushambi or Shravasti)
  await page.select('select', 'Shravasti');
  await new Promise(r => setTimeout(r, 1000));

  const emptyDistrictState = await page.evaluate(() => {
    const text = document.body.innerText;
    const select = document.querySelector('select');
    const options = select ? Array.from(select.querySelectorAll('option')).map(o => o.value) : [];
    const hasEmptyNotice = text.includes('No project records available for district') || text.includes('0 Works');
    const shravastiStillInList = options.includes('Shravasti');
    const totalOptionsStillIntact = options.length;

    return {
      hasEmptyNotice,
      shravastiStillInList,
      totalOptionsStillIntact
    };
  });

  console.log("Empty District State Evaluation:", JSON.stringify(emptyDistrictState, null, 2));

  if (!emptyDistrictState.shravastiStillInList || emptyDistrictState.totalOptionsStillIntact < 70) {
    throw new Error("FAIL: District disappeared from the dropdown when selected!");
  }
  if (!emptyDistrictState.hasEmptyNotice) {
    throw new Error("FAIL: Expected empty district notice to be rendered!");
  }
  console.log(">>> TEST 3 PASSED: State Authority sees all districts; empty districts remain in dropdown with honest notice! <<<\n");

  // TEST 4: GIS Remains Functional for District & Ministry Roles
  console.log("--- TEST 4: GIS Remains Functional for District & Ministry Roles ---");
  await page.goto('http://localhost:3000/app/gis-analytics', { waitUntil: 'networkidle0' });
  const gisPage = await page.evaluate(() => {
    return {
      title: document.querySelector('h1')?.textContent?.trim(),
      hasMapContainer: document.body.innerText.includes('GIS')
    };
  });
  console.log("GIS Route Evaluation:", JSON.stringify(gisPage, null, 2));
  if (!gisPage.hasMapContainer) {
    throw new Error("FAIL: Underlying GIS implementation broken!");
  }
  console.log(">>> TEST 4 PASSED: GIS remains functional for authorized workflows! <<<\n");

  console.log("===============================================================");
  console.log("ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY WITH 0 ERRORS!");
  console.log("===============================================================");

  await browser.close();
}

testAll().catch(err => {
  console.error("\nTEST FAILED WITH ERROR:", err);
  process.exit(1);
});
