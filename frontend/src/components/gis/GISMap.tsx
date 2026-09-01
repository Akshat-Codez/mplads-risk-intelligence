import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import circle from '@turf/circle';
import centroid from '@turf/centroid';
import { StateGISMetrics, DistrictGISMetrics, computeDistrictGISMetrics } from '../../services/gisService';
import { Project } from '../../types';

export type MapMode = 'NATIONAL_SHADED' | 'STATE_DISTRICT_SHADED' | 'DISTRICT_PROJECTS' | 'STANDARD';

interface GISMapProps {
  viewMode: 'NATIONAL' | 'STATE';
  mapMode?: MapMode;
  selectedState: string;
  selectedDistrict: string;
  stateMetrics: StateGISMetrics[];
  districtMetrics: DistrictGISMetrics[];
  projects: Project[];
  pinModeEnabled?: boolean;
  onSelectState: (state: string) => void;
  onSelectDistrict: (district: string) => void;
  onSelectProject: (project: Project) => void;
}

const INDIA_BOUNDS: [[number, number], [number, number]] = [
  [55.0, 0.0],
  [108.0, 42.0]
];

const normalizeName = (name: string): string => {
  if (!name) return '';
  let cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  // State Aliases
  if (cleaned === 'ORISSA' || cleaned === 'ODISHA') return 'ODISHA';
  if (cleaned === 'UTTARANCHAL' || cleaned === 'UTTARAKHAND') return 'UTTARAKHAND';
  if (cleaned === 'PONDICHERRY' || cleaned === 'PUDUCHERRY') return 'PUDUCHERRY';
  if (cleaned === 'TELANGANA' || cleaned === 'TELENGANA') return 'TELANGANA';
  if (cleaned === 'TAMILNADU' || cleaned === 'TAMILNAD') return 'TAMILNADU';
  if (cleaned === 'ANDHRAPRADESH' || cleaned === 'ANDHRA') return 'ANDHRAPRADESH';

  // AP 2022 District Reorganization Mapping to GeoJSON Polygons
  if (cleaned.includes('ANAKAPALLI') || cleaned.includes('ALLURISITHARAMA')) return 'VISAKHAPATNAM';
  if (cleaned.includes('KAKINADA') || cleaned.includes('KONASEEMA') || cleaned.includes('AMBEDKARKONASEEMA')) return 'EASTGODAVARI';
  if (cleaned.includes('ELURU')) return 'WESTGODAVARI';
  if (cleaned.includes('NTR')) return 'KRISHNA';
  if (cleaned.includes('PALNADU') || cleaned.includes('BAPATLA')) return 'GUNTUR';
  if (cleaned.includes('NANDYAL')) return 'KURNOOL';
  if (cleaned.includes('SRISATHYASAI')) return 'ANANTAPUR';
  if (cleaned.includes('ANNAMAYYA')) return 'CUDDAPAH';
  if (cleaned.includes('TIRUPATI')) return 'CHITTOOR';
  if (cleaned.includes('PARVATHIPURAM')) return 'SRIKAKULAM';

  // Telangana Reorganization Mapping to GeoJSON Polygons
  if (cleaned.includes('SIDDIPET') || cleaned.includes('MEDCHAL') || cleaned.includes('SANGAREDDY') || cleaned.includes('VIKARABAD')) return 'HYDERABAD';
  if (cleaned.includes('PEDDAPALLI') || cleaned.includes('JAGTIAL') || cleaned.includes('MANCHERIAL')) return 'KARIMNAGAR';
  if (cleaned.includes('BHADRADRI') || cleaned.includes('KOTHAGUDEM')) return 'KHAMMAM';
  if (cleaned.includes('JAYASHANKAR') || cleaned.includes('MULUGU') || cleaned.includes('MAHABUBABAD') || cleaned.includes('HANUMAKONDA')) return 'WARANGAL';
  if (cleaned.includes('NAGARKURNOOL') || cleaned.includes('WANAPARTHY') || cleaned.includes('JOGULAMBA')) return 'MAHABUBNAGAR';
  if (cleaned.includes('SURYAPET') || cleaned.includes('YADADRI')) return 'NALGONDA';

  // Karnataka Aliases
  if (cleaned.includes('BENGALURU') || cleaned.includes('BANGALORE')) {
    if (cleaned.includes('RURAL')) return 'BANGALORERURAL';
    return 'BANGALOREURBAN';
  }
  if (cleaned.includes('BELAGAVI') || cleaned.includes('BELGAUM')) return 'BELGAUM';
  if (cleaned.includes('VIJAYAPURA') || cleaned.includes('BIJAPUR')) return 'BIJAPUR';
  if (cleaned.includes('KALABURAGI') || cleaned.includes('GULBARGA')) return 'GULBARGA';
  if (cleaned.includes('BALLARI') || cleaned.includes('BELLARY')) return 'BELLARY';
  if (cleaned.includes('MYSURU') || cleaned.includes('MYSORE')) return 'MYSORE';
  if (cleaned.includes('SHIVAMOGGA') || cleaned.includes('SHIMOGA')) return 'SHIMOGA';
  if (cleaned.includes('TUMAKURU') || cleaned.includes('TUMKUR')) return 'TUMKUR';
  if (cleaned.includes('UTTARAKANNADA') || cleaned.includes('UTTARKANNAND') || cleaned.includes('NORTHCANARA')) return 'UTTARKANNAND';
  if (cleaned.includes('DAKSHINAKANNADA') || cleaned.includes('DAKSHINKANNAD') || cleaned.includes('SOUTHCANARA')) return 'DAKSHINKANNAD';

  // Bihar Aliases
  if (cleaned.includes('PURBI') || cleaned.includes('PURBA') || cleaned.includes('EASTCHAMPARAN')) return 'PURBACHAMPARAN';
  if (cleaned.includes('PASCHIM') || cleaned.includes('PASHCHIM') || cleaned.includes('WESTCHAMPARAN')) return 'PASHCHIMCHAMPARAN';

  // Nagaland Aliases
  if (cleaned.includes('CHUMOUKEDIMA') || cleaned.includes('TSEMINYU') || cleaned.includes('SHAMATOR') || cleaned.includes('NOKLAK') || cleaned.includes('PEREN') || cleaned.includes('LONGLENG') || cleaned.includes('KIPHIRE')) return 'KOHIMA';

  return cleaned;
};

// Color threshold helper matching legend (3 tiers)
const getRiskColor = (score: number): string => {
  if (score >= 60) return '#EF4444'; // Red (High Risk)
  if (score >= 30) return '#F59E0B'; // Amber (Moderate Risk)
  return '#10B981'; // Green (Low Risk)
};

export const GISMap: React.FC<GISMapProps> = ({
  viewMode,
  mapMode = 'NATIONAL_SHADED',
  selectedState,
  selectedDistrict,
  stateMetrics,
  districtMetrics,
  projects,
  pinModeEnabled = false,
  onSelectState,
  onSelectDistrict,
  onSelectProject
}) => {
  const mapRef = useRef<MapRef>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [customPins, setCustomPins] = useState<{ id: string; lat: number; lng: number; label: string }[]>([]);
  const [indiaStatesGeoJson, setIndiaStatesGeoJson] = useState<any>(null);
  const [indiaDistrictsGeoJson, setIndiaDistrictsGeoJson] = useState<any>(null);
  const [popupInfo, setPopupInfo] = useState<{
    type: 'STATE' | 'DISTRICT' | 'PROJECT' | 'CUSTOM' | 'EXIF';
    data: any;
    longitude: number;
    latitude: number;
  } | null>(null);

  const handleResetIndiaView = () => {
    onSelectState('ALL');
    onSelectDistrict('ALL');
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [78.9629, 22.5937],
        zoom: 3.6,
        pitch: 0,
        bearing: 0,
        duration: 1200
      });
    }
  };

  // Trigger MapLibre canvas resize on mount to guarantee immediate rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.getMap()?.resize();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Async fetch static state & district GeoJSON files from /public
  useEffect(() => {
    fetch('/indiaStates.geojson')
      .then(res => res.json())
      .then(data => setIndiaStatesGeoJson(data))
      .catch(err => console.error('Failed to load India States GeoJSON:', err));

    fetch('/indiaDistricts.geojson')
      .then(res => res.json())
      .then(data => setIndiaDistrictsGeoJson(data))
      .catch(err => console.error('Failed to load India Districts GeoJSON:', err));
  }, []);

  // PHASE 1: National Shaded State GeoJSON with injected risk_color
  const nationalShadedData = useMemo(() => {
    if (mapMode !== 'NATIONAL_SHADED' || !indiaStatesGeoJson) return null;

    const unMatchedStates: string[] = [];
    const features = indiaStatesGeoJson.features.map((feat: any) => {
      const rawName = feat?.properties?.NAME_1 || feat?.properties?.ST_NAME || '';
      const normRaw = normalizeName(rawName);
      const metric = stateMetrics.find(s => normalizeName(s.state) === normRaw);

      if (!metric && rawName) {
        unMatchedStates.push(rawName);
      }

      return {
        ...feat,
        properties: {
          ...feat.properties,
          state_name: metric?.state || rawName,
          risk_color: metric?.color || '#94A3B8'
        }
      };
    });

    if (unMatchedStates.length > 0) {
      console.warn('⚠️ States defaulting to neutral grey (#94A3B8):', Array.from(new Set(unMatchedStates)));
    }

    return { type: 'FeatureCollection' as const, features };
  }, [mapMode, stateMetrics, indiaStatesGeoJson]);

  // PHASE 2: User State Bold Outline & District Shaded GeoJSON
  const phase2Data = useMemo(() => {
    if (mapMode !== 'STATE_DISTRICT_SHADED' || !indiaStatesGeoJson || !indiaDistrictsGeoJson) return null;

    const activeStateName = selectedState !== 'ALL' ? selectedState : 'Uttar Pradesh';
    const normActiveState = normalizeName(activeStateName);

    // 1. Filter state GeoJSON to user's active state
    const stateFeatures = indiaStatesGeoJson.features.filter((feat: any) => {
      const rawName = feat?.properties?.NAME_1 || feat?.properties?.ST_NAME || '';
      return normalizeName(rawName) === normActiveState;
    });

    // 2. Filter district GeoJSON to user's active state & inject risk_color
    const currentDistrictMetrics = computeDistrictGISMetrics(projects, activeStateName);

    const districtFeatures = indiaDistrictsGeoJson.features
      .filter((feat: any) => {
        const rawStateName = feat?.properties?.NAME_1 || feat?.properties?.ST_NAME || '';
        return normalizeName(rawStateName) === normActiveState;
      })
      .map((feat: any) => {
        const rawDistName = feat?.properties?.NAME_2 || feat?.properties?.DISTRICT || '';
        const normDist = normalizeName(rawDistName);
        const metric = currentDistrictMetrics.find(d => normalizeName(d.district) === normDist);

        return {
          ...feat,
          properties: {
            ...feat.properties,
            district_name: metric?.district || rawDistName,
            risk_color: metric?.color || '#94A3B8'
          }
        };
      });

    // 3. Compute Turf.js Centroids (1 pin per district)
    const districtPins = districtFeatures.map((feat: any) => {
      const rawDistName = feat?.properties?.NAME_2 || feat?.properties?.DISTRICT || '';
      const normDist = normalizeName(rawDistName);
      const metric = currentDistrictMetrics.find(d => normalizeName(d.district) === normDist) || {
        district: rawDistName,
        state: activeStateName,
        totalWorks: 0,
        highRiskCount: 0,
        avgRiskScore: 0,
        totalSanctionedLakhs: 0,
        riskCategory: 'LOW' as const,
        color: '#10B981',
        lat: 0,
        lng: 0
      };

      let lat = 0;
      let lng = 0;
      try {
        const cent = centroid(feat);
        lng = cent.geometry.coordinates[0];
        lat = cent.geometry.coordinates[1];
      } catch (err) {
        lat = metric.lat || 26.8467;
        lng = metric.lng || 80.9462;
      }

      return {
        id: `dist-pin-${rawDistName}`,
        districtName: metric.district,
        metric,
        lat,
        lng
      };
    });

    return {
      stateBoundaryGeoJSON: { type: 'FeatureCollection' as const, features: stateFeatures },
      districtGeoJSON: { type: 'FeatureCollection' as const, features: districtFeatures },
      districtPins
    };
  }, [mapMode, selectedState, projects, indiaStatesGeoJson, indiaDistrictsGeoJson]);

  // PHASE 3: Single District Boundary & Per-Project Pins (No Faked Positions)
  const phase3Data = useMemo(() => {
    if (mapMode !== 'DISTRICT_PROJECTS' || !indiaDistrictsGeoJson) return null;

    const activeDistrictName = selectedDistrict !== 'ALL' ? selectedDistrict : 'Varanasi';
    const normActiveDist = normalizeName(activeDistrictName);

    // 1. Filter district GeoJSON to ONLY the single target district boundary of the logged-in District Collector
    const singleDistrictFeatures = indiaDistrictsGeoJson.features.filter((feat: any) => {
      const rawDistName = feat?.properties?.NAME_2 || feat?.properties?.DISTRICT || '';
      const normRaw = normalizeName(rawDistName);
      return normRaw === normActiveDist || (normRaw.length > 3 && normActiveDist.length > 3 && (normRaw.includes(normActiveDist) || normActiveDist.includes(normRaw)));
    });

    // 2. Process projects array: Filter valid coordinates vs missing coordinates
    const validProjectPins: { project: Project; color: string; lat: number; lng: number }[] = [];
    const skippedProjectIds: string[] = [];

    projects.forEach(p => {
      const lat = p.regLatitude;
      const lng = p.regLongitude;

      if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
        validProjectPins.push({
          project: p,
          color: getRiskColor(p.riskScore),
          lat,
          lng
        });
      } else {
        skippedProjectIds.push(p.id || p.projectId || 'Unknown-ID');
      }
    });

    if (skippedProjectIds.length > 0) {
      console.warn('⚠️ Skipped project pins due to missing coordinates:', skippedProjectIds);
    }

    // 3. EXIF Geofence circles & line vectors ONLY for high-risk EXIF anomaly projects
    const geofenceFeatures: any[] = [];
    validProjectPins.forEach(item => {
      const p = item.project;
      if (p.riskScore >= 60 && p.photoLatitude && p.photoLongitude && (p.photoLatitude !== p.regLatitude || p.photoLongitude !== p.regLongitude)) {
        try {
          const circlePoly = circle([item.lng, item.lat], 0.1, { units: 'kilometers' });
          geofenceFeatures.push({
            ...circlePoly,
            properties: { id: `circle-${p.id}`, color: '#EF4444' }
          });
        } catch (e) {}

        geofenceFeatures.push({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [item.lng, item.lat],
              [p.photoLongitude, p.photoLatitude]
            ]
          },
          properties: { id: `line-${p.id}`, color: '#DC2626' }
        });
      }
    });

    return {
      districtBoundaryGeoJSON: { type: 'FeatureCollection' as const, features: singleDistrictFeatures },
      validProjectPins,
      skippedProjectIds,
      geofenceGeoJSON: { type: 'FeatureCollection' as const, features: geofenceFeatures }
    };
  }, [mapMode, selectedDistrict, projects, indiaDistrictsGeoJson]);

  // Dynamic Camera Fly: Recenter map directly over target state or district polygon centroid!
  useEffect(() => {
    if (!mapRef.current) return;
    let center: [number, number] = [78.9629, 22.5937];
    let zoom = 4.2;

    if (mapMode === 'DISTRICT_PROJECTS' && phase3Data?.districtBoundaryGeoJSON?.features?.length > 0) {
      try {
        const distCent = centroid(phase3Data.districtBoundaryGeoJSON as any);
        center = [distCent.geometry.coordinates[0], distCent.geometry.coordinates[1]];
        zoom = 10.5;
      } catch (e) {
        if (phase3Data.validProjectPins.length > 0) {
          center = [phase3Data.validProjectPins[0].lng, phase3Data.validProjectPins[0].lat];
          zoom = 11.5;
        }
      }
    } else if (mapMode === 'STATE_DISTRICT_SHADED' || (viewMode === 'STATE' && selectedState !== 'ALL')) {
      const activeStateMetric = stateMetrics.find(s => normalizeName(s.state) === normalizeName(selectedState));
      if (activeStateMetric) {
        center = [activeStateMetric.lng, activeStateMetric.lat];
        zoom = 6.8;
      } else {
        center = [80.9462, 26.8467]; // UP Default
        zoom = 6.5;
      }
    }

    if (selectedDistrict !== 'ALL' && mapMode !== 'DISTRICT_PROJECTS') {
      const activeDistMetric = districtMetrics.find(d => normalizeName(d.district) === normalizeName(selectedDistrict));
      if (activeDistMetric) {
        center = [activeDistMetric.lng, activeDistMetric.lat];
        zoom = 9.5;
      }
    }

    mapRef.current.flyTo({
      center,
      zoom,
      duration: 1200
    });
  }, [mapMode, viewMode, selectedState, selectedDistrict, stateMetrics, districtMetrics, phase3Data]);

  // Handle map click for Phase 1 State Fill queries & custom pin creation
  const handleMapClick = (e: any) => {
    if (pinModeEnabled) {
      const lng = e.lngLat.lng;
      const lat = e.lngLat.lat;
      const label = window.prompt("Enter a label for this custom GIS pin:");
      if (label && label.trim()) {
        setCustomPins(prev => [
          ...prev,
          { id: crypto.randomUUID(), lat, lng, label: label.trim() }
        ]);
      }
      return;
    }

    if (mapMode === 'NATIONAL_SHADED' && mapRef.current) {
      const map = mapRef.current.getMap();
      const features = map.queryRenderedFeatures(e.point, { layers: ['state-fills'] });
      if (features && features.length > 0) {
        const clickedState = features[0].properties?.state_name || features[0].properties?.NAME_1;
        if (clickedState) {
          onSelectState(clickedState);
        }
      }
    }
  };

  const handleRemovePin = (id: string) => {
    setCustomPins(prev => prev.filter(p => p.id !== id));
    setPopupInfo(null);
  };

  // Compact, Sleek Glowing Ambient Pin UI
  const renderCompactPin = (color: string, label: string, isState = true) => {
    const size = isState ? 24 : 18;
    return (
      <div 
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: '2px solid rgba(255, 255, 255, 0.95)',
          boxShadow: `0 0 10px ${color}, 0 2px 6px rgba(0,0,0,0.25)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontSize: isState ? '10px' : '8px',
          fontFamily: 'sans-serif',
          cursor: 'pointer',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.2s ease'
        }}
        className="hover:scale-125 select-none"
      >
        {label}
      </div>
    );
  };

  return (
    <div
      style={{ position: 'relative', width: '100%', height: isMinimized ? '360px' : '620px' }}
      className={`rounded-2xl overflow-hidden shadow-lg border border-slate-300 font-sans transition-all duration-300 ${pinModeEnabled ? 'cursor-crosshair' : ''}`}
    >
      <Map
        ref={mapRef}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        initialViewState={{ longitude: 78.9629, latitude: 22.5937, zoom: 3.6 }}
        minZoom={2.8}
        maxBounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />

        {/* TOP-LEFT OVERLAY CONTROLS: RESET ALL INDIA & MINIMIZE/EXPAND MAP */}
        <div className="absolute top-4 left-4 z-[1000] flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetIndiaView}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-900 font-extrabold text-xs px-3.5 py-2 rounded-xl border border-slate-200 shadow-md flex items-center space-x-2 transition cursor-pointer hover:shadow-lg active:scale-95"
            title="Reset camera zoom & filters to view the complete map of India"
          >
            <span className="text-base">🇮🇳</span>
            <span>Fit All India Map</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMinimized(prev => !prev);
              setTimeout(() => mapRef.current?.getMap()?.resize(), 320);
            }}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 font-bold text-xs px-3 py-2 rounded-xl border border-slate-200 shadow-md flex items-center space-x-1.5 transition cursor-pointer hover:shadow-lg active:scale-95"
            title={isMinimized ? "Expand map to full height" : "Minimize map height to view dashboard below"}
          >
            {isMinimized ? (
              <>
                <span>📖 Expand Map</span>
              </>
            ) : (
              <>
                <span>📉 Minimize Map</span>
              </>
            )}
          </button>
        </div>

        {/* PHASE 1: NATIONAL_SHADED MODE (State-Only Shading, NO Pins) */}
        {mapMode === 'NATIONAL_SHADED' && nationalShadedData && (
          <Source id="india-states-national" type="geojson" data={nationalShadedData as any}>
            <Layer
              id="state-fills"
              type="fill"
              paint={{
                'fill-color': ['get', 'risk_color'],
                'fill-opacity': 0.35
              }}
            />
            <Layer
              id="state-borders"
              type="line"
              paint={{
                'line-color': '#94A3B8',
                'line-width': 1
              }}
            />
          </Source>
        )}

        {/* PHASE 2: STATE_DISTRICT_SHADED MODE (Bold State Outline, District Shading & 1 Pin/District) */}
        {mapMode === 'STATE_DISTRICT_SHADED' && phase2Data && (
          <>
            <Source id="user-state-outline" type="geojson" data={phase2Data.stateBoundaryGeoJSON as any}>
              <Layer
                id="bold-state-border"
                type="line"
                paint={{
                  'line-color': '#000000',
                  'line-width': 3
                }}
              />
            </Source>

            <Source id="user-districts" type="geojson" data={phase2Data.districtGeoJSON as any}>
              <Layer
                id="district-fills"
                type="fill"
                paint={{
                  'fill-color': ['get', 'risk_color'],
                  'fill-opacity': 0.35
                }}
              />
              <Layer
                id="district-borders"
                type="line"
                paint={{
                  'line-color': '#64748B',
                  'line-width': 1
                }}
              />
            </Source>

            {phase2Data.districtPins.map(pin => (
              <Marker
                key={pin.id}
                longitude={pin.lng}
                latitude={pin.lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo({
                    type: 'DISTRICT',
                    data: pin.metric,
                    longitude: pin.lng,
                    latitude: pin.lat
                  });
                }}
              >
                {renderCompactPin(pin.metric.color, `${pin.metric.highRiskCount > 0 ? pin.metric.highRiskCount : '✓'}`, false)}
              </Marker>
            ))}
          </>
        )}

        {/* PHASE 3: DISTRICT_PROJECTS MODE (District Boundary & Individual Per-Project Pins) */}
        {mapMode === 'DISTRICT_PROJECTS' && phase3Data && (
          <>
            {/* 1. Target District Boundary */}
            <Source id="single-district-boundary" type="geojson" data={phase3Data.districtBoundaryGeoJSON as any}>
              <Layer
                id="single-district-fill"
                type="fill"
                paint={{
                  'fill-color': '#0F172A',
                  'fill-opacity': 0.06
                }}
              />
              <Layer
                id="single-district-border"
                type="line"
                paint={{
                  'line-color': '#0F172A',
                  'line-width': 2.5
                }}
              />
            </Source>

            {/* 2. Geofence 100m Radius Circles & Line Vectors ONLY for High Risk EXIF Anomaly Projects */}
            {phase3Data.geofenceGeoJSON.features.length > 0 && (
              <Source id="district-geofences" type="geojson" data={phase3Data.geofenceGeoJSON as any}>
                <Layer
                  id="geofence-circles-fill"
                  type="fill"
                  filter={['==', ['$type'], 'Polygon']}
                  paint={{
                    'fill-color': '#EF4444',
                    'fill-opacity': 0.15
                  }}
                />
                <Layer
                  id="geofence-lines"
                  type="line"
                  filter={['==', ['$type'], 'LineString']}
                  paint={{
                    'line-color': '#DC2626',
                    'line-width': 2,
                    'line-dasharray': [3, 2]
                  }}
                />
              </Source>
            )}

            {/* 3. Individual Project Markers at Real Coordinates */}
            {phase3Data.validProjectPins.map(item => (
              <Marker
                key={`proj-pin-${item.project.id}`}
                longitude={item.lng}
                latitude={item.lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  onSelectProject(item.project);
                  setPopupInfo({
                    type: 'PROJECT',
                    data: item.project,
                    longitude: item.lng,
                    latitude: item.lat
                  });
                }}
              >
                {renderCompactPin(item.color, item.project.riskScore > 0 ? `${item.project.riskScore}` : '✓', false)}
              </Marker>
            ))}
          </>
        )}

        {/* STANDARD MODE: Legacy Markers & Project Pins */}
        {mapMode === 'STANDARD' && (
          <>
            {viewMode === 'NATIONAL' && stateMetrics.map(st => (
              <Marker
                key={st.state}
                longitude={st.lng}
                latitude={st.lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo({ type: 'STATE', data: st, longitude: st.lng, latitude: st.lat });
                }}
              >
                {renderCompactPin(st.color, `${st.highRiskCount > 0 ? st.highRiskCount : '✓'}`, true)}
              </Marker>
            ))}

            {viewMode === 'STATE' && districtMetrics.map(dst => (
              <Marker
                key={dst.district}
                longitude={dst.lng}
                latitude={dst.lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo({ type: 'DISTRICT', data: dst, longitude: dst.lng, latitude: dst.lat });
                }}
              >
                {renderCompactPin(dst.color, `${dst.highRiskCount > 0 ? dst.highRiskCount : '✓'}`, false)}
              </Marker>
            ))}
          </>
        )}

        {/* CUSTOM USER-ADDED PINS */}
        {customPins.map(pin => (
          <Marker
            key={pin.id}
            longitude={pin.lng}
            latitude={pin.lat}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setPopupInfo({ type: 'CUSTOM', data: pin, longitude: pin.lng, latitude: pin.lat });
            }}
          >
            {renderCompactPin('#7C3AED', '📍', false)}
          </Marker>
        ))}

        {/* POPUP CARD DIALOG */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
          >
            {popupInfo.type === 'PROJECT' && (
              <div className="font-sans space-y-2 p-1.5 max-w-xs text-xs bg-white rounded-xl">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-extrabold text-slate-900 text-xs truncate max-w-[180px]">{popupInfo.data.workTitle}</span>
                  <span 
                    className="font-black px-2 py-0.5 rounded text-[10px] text-white uppercase shadow-sm"
                    style={{ backgroundColor: getRiskColor(popupInfo.data.riskScore) }}
                  >
                    SCORE {popupInfo.data.riskScore}/100
                  </span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-700">
                  <p>Vendor: <strong className="text-slate-900">{popupInfo.data.vendorName}</strong></p>
                  <p>Sanctioned: <strong className="text-slate-900">₹{(popupInfo.data.sanctionedAmount / 100000).toFixed(2)} Lakhs</strong></p>
                  <p>Category: <span className="font-semibold text-slate-600">{popupInfo.data.category}</span></p>
                </div>
                <button
                  onClick={() => { setPopupInfo(null); onSelectProject(popupInfo.data); }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded transition cursor-pointer text-xs mt-1 shadow"
                >
                  View Full Work Audit →
                </button>
              </div>
            )}

            {popupInfo.type === 'DISTRICT' && (
              <div className="font-sans space-y-2.5 p-1.5 max-w-xs text-xs bg-white rounded-xl">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-extrabold text-slate-900 text-sm">District: {popupInfo.data.district}</span>
                  <span 
                    className="font-black px-2 py-0.5 rounded text-[10px] text-white uppercase shadow-sm"
                    style={{ backgroundColor: popupInfo.data.color }}
                  >
                    {popupInfo.data.riskCategory} RISK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Total Works</span>
                    <strong className="text-slate-900 text-sm">{popupInfo.data.totalWorks}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Sanctioned (₹ L)</span>
                    <strong className="text-slate-900 text-sm">₹{popupInfo.data.totalSanctionedLakhs} L</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">High Risk Works</span>
                    <strong className="text-red-600 text-sm">{popupInfo.data.highRiskCount}</strong>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="text-[10px] text-slate-500 block">Avg Risk Score</span>
                    <strong className="text-slate-900 text-sm">{popupInfo.data.avgRiskScore}/100</strong>
                  </div>
                </div>
              </div>
            )}

            {popupInfo.type === 'STATE' && (
              <div className="font-sans space-y-2 p-1 max-w-xs text-xs">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-black text-slate-900 text-sm">{popupInfo.data.state}</span>
                  <span 
                    className="font-black px-2 py-0.5 rounded text-[10px] text-white uppercase"
                    style={{ backgroundColor: popupInfo.data.color }}
                  >
                    {popupInfo.data.riskCategory} RISK ({popupInfo.data.avgRiskScore}/100)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div>Tracked Works: <strong>{popupInfo.data.totalWorks}</strong></div>
                  <div>Sanctioned: <strong>₹{popupInfo.data.totalSanctionedCr} Cr</strong></div>
                  <div>High Risk Works: <strong className="text-red-600">{popupInfo.data.highRiskCount}</strong></div>
                  <div>Avg Risk Score: <strong>{popupInfo.data.avgRiskScore}/100</strong></div>
                </div>
                <button
                  onClick={() => { setPopupInfo(null); onSelectState(popupInfo.data.state); }}
                  className="w-full bg-[#0A2540] hover:bg-[#002B49] text-white font-bold py-1.5 rounded transition cursor-pointer text-xs mt-1 shadow"
                >
                  Drill Down into {popupInfo.data.state} District Map →
                </button>
              </div>
            )}

            {popupInfo.type === 'CUSTOM' && (
              <div className="font-sans space-y-2 p-1 text-xs min-w-[160px]">
                <div className="flex items-center space-x-1.5 border-b pb-1">
                  <span className="font-extrabold text-purple-900 text-xs">📍 Custom User Pin</span>
                </div>
                <p className="font-bold text-slate-800 text-xs leading-snug">{popupInfo.data.label}</p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Lat: {popupInfo.data.lat.toFixed(4)}, Lng: {popupInfo.data.lng.toFixed(4)}
                </div>
                <button
                  onClick={() => handleRemovePin(popupInfo.data.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 rounded text-[11px] cursor-pointer mt-1 shadow"
                >
                  Remove pin
                </button>
              </div>
            )}
          </Popup>
        )}
      </Map>

      {/* Spatial Risk Legend Card */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md text-slate-900 p-3.5 rounded-2xl border border-slate-200/80 text-xs font-sans shadow-md z-[1000] space-y-2">
        <div className="font-extrabold text-[11px] uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-1 font-serif">
          🇮🇳 Spatial Risk & Choropleth Scale
        </div>
        <div className="flex items-center space-x-4 text-[11px] font-bold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm shadow-red-500/50"></span>
            <span>High Risk (&ge; 60)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm shadow-amber-500/50"></span>
            <span>Moderate Watch (30-59)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm shadow-emerald-500/50"></span>
            <span>Low Risk (&lt; 30)</span>
          </div>
        </div>
      </div>

      {/* OpenFreeMap Official Attribution */}
      <div className="absolute bottom-1 right-2 text-[9px] text-slate-500 font-sans pointer-events-none z-[1000] bg-white/80 px-1.5 py-0.5 rounded">
        &copy; OpenFreeMap &copy; OpenMapTiles Data from OpenStreetMap
      </div>
    </div>
  );
};
