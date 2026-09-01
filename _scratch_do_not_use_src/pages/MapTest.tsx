import 'maplibre-gl/dist/maplibre-gl.css';
import Map from 'react-map-gl/maplibre';

export default function MapTest() {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}>
      <Map
        mapStyle="https://tiles.openfreemap.org/styles/positron"
        initialViewState={{ longitude: 78.9629, latitude: 22.5937, zoom: 4 }}
      />
    </div>
  );
}
