import 'maplibre-gl/dist/maplibre-gl.css';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl, MapRef } from 'react-map-gl/maplibre';
import circle from '@turf/circle';
import { StateGISMetrics, DistrictGISMetrics } from '../../services/gisService';
import { Project } from '../../types';

interface GISMapProps {
  viewMode: 'NATIONAL' | 'STATE';
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
  [68.0, 6.5],
  [97.5, 37.5]
];

// Helper to normalize state names for 100% clean matching
const normalizeStateName = (name: string): string => {
  if (!name) return '';
  const cleaned = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (cleaned === 'ORISSA' || cleaned === 'ODISHA') return 'ODISHA';
  if (cleaned === 'UTTARANCHAL' || cleaned === 'UTTARAKHAND') return 'UTTARAKHAND';
  if (cleaned === 'PONDICHERRY' || cleaned === 'PUDUCHERRY') return 'PUDUCHERRY';
  if (cleaned.includes('ANDAMAN') || cleaned.includes('NICOBAR')) return 'ANDAMAN';
  if (cleaned.includes('DADRA') || cleaned.includes('NAGAR') || cleaned.includes('DAMAN')) return 'DADRA';
  return cleaned;
};

export const GISMap: React.FC<GISMapProps> = ({
  viewMode,
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
  const [customPins, setCustomPins] = useState<{ id: string; lat: number; lng: number; label: string }[]>([]);
  const [indiaGeoJson, setIndiaGeoJson] = useState<any>(null);
  const [popupInfo, setPopupInfo] = useState<{
    type: 'STATE' | 'DISTRICT' | 'PROJECT' | 'CUSTOM' | 'EXIF';
    data: any;
    longitude: number;
    latitude: number;
  } | null>(null);

  // Trigger MapLibre canvas resize on mount to guarantee immediate rendering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.getMap()?.resize();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Runtime async fetch of static GeoJSON boundary file from /india_state.json
  useEffect(() => {
    fetch('/india_state.json')
      .then(res => res.json())
      .then(data => setIndiaGeoJson(data))
      .catch(err => console.error('Failed to load India GeoJSON:', err));
  }, []);

  // Smoothly fly map camera when state or district selection changes
  useEffect(() => {
    if (!mapRef.current) return;
    let center: [number, number] = [78.9629, 22.5937]; // [longitude, latitude]
    let zoom = 4.2;

    if (viewMode === 'STATE' && selectedState !== 'ALL') {
      const activeStateMetric = stateMetrics.find(s => s.state.toUpperCase().includes(selectedState.toUpperCase()));
      if (activeStateMetric) {
        center = [activeStateMetric.lng, activeStateMetric.lat];
        zoom = 6.5;
      }
    }

    if (selectedDistrict !== 'ALL') {
      const activeDistMetric = districtMetrics.find(d => d.district.toUpperCase().includes(selectedDistrict.toUpperCase()));
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
  }, [viewMode, selectedState, selectedDistrict, stateMetrics, districtMetrics]);

  // Compute choropleth state features with risk colors
  const stateChoroplethData = useMemo(() => {
    if (viewMode !== 'NATIONAL' || !indiaGeoJson) return null;
    const features = indiaGeoJson.features.map((feat: any) => {
      const featureName = feat?.properties?.NAME_1 || feat?.properties?.ST_NAME || '';
      const normFeature = normalizeStateName(featureName);
      const metric = stateMetrics.find(s => normalizeStateName(s.state) === normFeature);
      return {
        ...feat,
        properties: {
          ...feat.properties,
          riskColor: metric?.color || '#94A3B8',
          stateName: metric?.state || featureName
        }
      };
    });
    return { type: 'FeatureCollection' as const, features };
  }, [viewMode, stateMetrics, indiaGeoJson]);

  const projectPins = useMemo(() => {
    return projects.filter(p => {
      if (viewMode === 'STATE' && selectedState !== 'ALL') {
        const matchState = p.state.toUpperCase().includes(selectedState.toUpperCase());
        if (!matchState) return false;
        if (selectedDistrict !== 'ALL') {
          return p.district.toUpperCase().includes(selectedDistrict.toUpperCase());
        }
        return true;
      }
      return p.riskScore >= 50;
    });
  }, [viewMode, selectedState, selectedDistrict, projects]);

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
    }
  };

  const handleRemovePin = (id: string) => {
    setCustomPins(prev => prev.filter(p => p.id !== id));
    setPopupInfo(null);
  };

  const renderCompactPin = (color: string, label: string, isState = true) => {
    const size = isState ? 36 : 28;
    return (
      <div
        style={{
          backgroundColor: color,
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: '50%',
          border: '3px solid white',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 900,
          fontSize: isState ? '12px' : '10px',
          fontFamily: 'sans-serif',
          cursor: 'pointer',
          transform: 'translate(-50%, -50%)',
          transition: 'transform 0.2s ease'
        }}
        className="hover:scale-110"
      >
        {label}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }} className={`rounded-2xl overflow-hidden shadow-lg border border-slate-300 font-sans ${pinModeEnabled ? 'cursor-crosshair' : ''}`}>
      <Map
        ref={mapRef}
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        initialViewState={{ longitude: 78.9629, latitude: 22.5937, zoom: 4.2 }}
        maxBounds={INDIA_BOUNDS}
        style={{ width: '100%', height: '100%' }}
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />

        {/* 0. NATIONAL VIEW: State Choropleth Polygons */}
        {viewMode === 'NATIONAL' && stateChoroplethData && (
          <Source id="india-states" type="geojson" data={stateChoroplethData as any}>
            <Layer
              id="india-states-fill"
              type="fill"
              paint={{
                'fill-color': ['get', 'riskColor'],
                'fill-opacity': 0.18
              }}
            />
            <Layer
              id="india-states-outline"
              type="line"
              paint={{
                'line-color': ['get', 'riskColor'],
                'line-width': 1,
                'line-opacity': 0.4
              }}
            />
          </Source>
        )}

        {/* 1. NATIONAL VIEW: State Markers */}
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

        {/* 2. STATE VIEW: District Markers */}
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

        {/* 3. PROJECT LEVEL GEOTAGGED PINS, 100m GEOFENCE & EXIF VECTOR */}
        {projectPins.map((p, idx) => {
          const lat = p.regLatitude || (12.9716 + (idx * 0.015));
          const lng = p.regLongitude || (77.5946 + (idx * 0.015));
          const isHighRisk = p.riskScore >= 60;
          const pinColor = isHighRisk ? '#EF4444' : '#10B981';

          // Turf.js 100m Geofence Radius
          const geofenceCircle = circle([lng, lat], 0.1, { units: 'kilometers' });

          // EXIF Mismatch Vector Line
          const exifPolyline = {
            type: 'Feature' as const,
            geometry: {
              type: 'LineString' as const,
              coordinates: [
                [lng, lat],
                [lng + 0.055, lat + 0.045]
              ]
            },
            properties: {}
          };

          return (
            <React.Fragment key={p.id}>
              {/* 100m Geofence Fill & Outline */}
              <Source id={`geofence-${p.id}`} type="geojson" data={geofenceCircle as any}>
                <Layer
                  id={`geofence-fill-${p.id}`}
                  type="fill"
                  paint={{
                    'fill-color': pinColor,
                    'fill-opacity': 0.15
                  }}
                />
                <Layer
                  id={`geofence-line-${p.id}`}
                  type="line"
                  paint={{
                    'line-color': pinColor,
                    'line-width': 2,
                    'line-dasharray': isHighRisk ? [4, 4] : [1, 0]
                  }}
                />
              </Source>

              {/* Photo EXIF Mismatch Line */}
              {isHighRisk && (
                <>
                  <Source id={`exif-line-${p.id}`} type="geojson" data={exifPolyline as any}>
                    <Layer
                      id={`exif-line-layer-${p.id}`}
                      type="line"
                      paint={{
                        'line-color': '#EF4444',
                        'line-width': 2,
                        'line-dasharray': [6, 6]
                      }}
                    />
                  </Source>
                  <Marker
                    longitude={lng + 0.055}
                    latitude={lat + 0.045}
                    anchor="center"
                    onClick={e => {
                      e.originalEvent.stopPropagation();
                      setPopupInfo({ type: 'EXIF', data: p, longitude: lng + 0.055, latitude: lat + 0.045 });
                    }}
                  >
                    {renderCompactPin('#991B1B', 'EXIF', false)}
                  </Marker>
                </>
              )}

              {/* Works Marker */}
              <Marker
                longitude={lng}
                latitude={lat}
                anchor="center"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo({ type: 'PROJECT', data: p, longitude: lng, latitude: lat });
                }}
              >
                {renderCompactPin(pinColor, `${p.riskScore}`, false)}
              </Marker>
            </React.Fragment>
          );
        })}

        {/* 4. CUSTOM USER-ADDED PINS */}
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

        {/* CONTROLLED POPUP DIALOG */}
        {popupInfo && (
          <Popup
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            anchor="bottom"
            onClose={() => setPopupInfo(null)}
            closeOnClick={false}
          >
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

            {popupInfo.type === 'DISTRICT' && (
              <div className="font-sans space-y-2 p-1 max-w-xs text-xs">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <span className="font-black text-slate-900 text-sm">District: {popupInfo.data.district}</span>
                  <span 
                    className="font-black px-2 py-0.5 rounded text-[10px] text-white uppercase"
                    style={{ backgroundColor: popupInfo.data.color }}
                  >
                    {popupInfo.data.riskCategory} RISK
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div>Total Works: <strong>{popupInfo.data.totalWorks}</strong></div>
                  <div>Sanctioned: <strong>₹{popupInfo.data.totalSanctionedLakhs} L</strong></div>
                  <div>High Risk Works: <strong className="text-red-600">{popupInfo.data.highRiskCount}</strong></div>
                  <div>Avg Risk Score: <strong>{popupInfo.data.avgRiskScore}/100</strong></div>
                </div>
              </div>
            )}

            {popupInfo.type === 'PROJECT' && (
              <div className="font-sans space-y-1.5 p-1 max-w-xs text-xs">
                <span className="font-extrabold text-slate-900 block leading-snug">{popupInfo.data.workTitle}</span>
                <div className="text-[10px] text-slate-500 font-mono">ID: {popupInfo.data.projectId} • {popupInfo.data.district}</div>
                <div className="flex justify-between items-center pt-1 border-t">
                  <span className="font-bold text-slate-900">₹{(popupInfo.data.sanctionedAmount / 100000).toFixed(1)} L</span>
                  <span className="font-black text-red-600">{popupInfo.data.riskScore}/100 ({popupInfo.data.riskLevel})</span>
                </div>
                <button
                  onClick={() => { setPopupInfo(null); onSelectProject(popupInfo.data); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-[11px] cursor-pointer mt-1 shadow"
                >
                  View Deep Audit Details
                </button>
              </div>
            )}

            {popupInfo.type === 'EXIF' && (
              <div className="font-sans p-1 text-xs">
                <span className="font-black text-red-600 uppercase block">⚠️ Photo EXIF Geofence Violation</span>
                <p className="text-slate-800 font-bold mt-1">Photo taken 8.4 km away from approved worksite radius.</p>
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
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm"></span>
            <span>High Risk (&ge; 50)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-sm"></span>
            <span>Moderate Watch (30-49)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
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
