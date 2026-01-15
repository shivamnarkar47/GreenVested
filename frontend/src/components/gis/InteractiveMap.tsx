import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface CompanyLocation {
  bse_code: string;
  company_name: string;
  sector?: string;
  esg_score?: number;
  latitude: number;
  longitude: number;
  state: string;
}

interface StateAggregate {
  state: string;
  company_count: number;
  avg_esg_score: number;
  avg_e_score: number;
  avg_s_score: number;
  avg_g_score: number;
  top_company?: string;
  lowest_company?: string;
}

interface InteractiveMapProps {
  companies?: CompanyLocation[];
  stateAggregates?: StateAggregate[];
  selectedState?: string;
  onStateClick?: (state: string) => void;
  height?: string;
  showHeatmap?: boolean;
}

// Custom hook to fit map bounds
function FitBounds({ companies }: { companies: CompanyLocation[] }) {
  const map = useMap();

  useEffect(() => {
    if (companies.length > 0) {
      const bounds = L.latLngBounds(
        companies.map(company => [company.latitude, company.longitude])
      );
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [companies, map]);

  return null;
}

// Get color based on ESG score
function getESGColor(score: number): string {
  if (score >= 80) return '#22c55e'; // green-500
  if (score >= 70) return '#84cc16'; // lime-500
  if (score >= 60) return '#eab308'; // yellow-500
  if (score >= 50) return '#f97316'; // orange-500
  return '#ef4444'; // red-500
}

// Get circle radius based on company count or ESG score
function getCircleRadius(count: number, score: number): number {
  return Math.max(50000, Math.min(200000, count * 10000 + score * 1000));
}



const InteractiveMap: React.FC<InteractiveMapProps> = ({
  companies = [],
  stateAggregates = [],
  selectedState,
  onStateClick,
  height = "100vh",
  showHeatmap = true
}) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629]); // Center of India
  const [mapZoom, setMapZoom] = useState(5);

  // State coordinates for heatmap
  const stateCoordinates: Record<string, [number, number]> = {
    'Maharashtra': [19.0760, 72.8777],
    'Karnataka': [12.9716, 77.5946],
    'Tamil Nadu': [13.0827, 80.2707],
    'Delhi': [28.7041, 77.1025],
    'Gujarat': [23.0225, 72.5714],
    'Telangana': [17.3850, 78.4867],
    'West Bengal': [22.5726, 88.3639],
    'Rajasthan': [26.9124, 75.7873],
    'Uttar Pradesh': [26.8467, 80.9462],
    'Madhya Pradesh': [22.7196, 75.8577],
    'Haryana': [29.0588, 76.0856],
    'Punjab': [30.7333, 76.7794],
    'Bihar': [25.0961, 85.3131],
    'Odisha': [20.2961, 85.8245],
    'Jharkhand': [23.6102, 85.2799],
    'Chhattisgarh': [21.2514, 81.6296],
    'Uttarakhand': [30.0668, 79.0193],
    'Himachal Pradesh': [31.1048, 77.1734],
    'Jammu and Kashmir': [34.0837, 74.7973],
    'Goa': [15.2993, 74.1240],
    'Kerala': [8.5241, 76.9366],
    'Puducherry': [11.9416, 79.8083],
    'Chandigarh': [30.7333, 76.7794],
    'Dadra and Nagar Haveli and Daman and Diu': [20.3974, 72.8328],
    'Ladakh': [34.1526, 77.5771],
    'Lakshadweep': [10.5667, 72.6417],
    'Andaman and Nicobar Islands': [11.7401, 92.6586],
    'Sikkim': [27.5330, 88.5122],
    'Arunachal Pradesh': [27.1020, 93.6920],
    'Nagaland': [25.6738, 94.1086],
    'Manipur': [24.8170, 93.9368],
    'Mizoram': [23.1645, 92.9376],
    'Tripura': [23.9408, 91.9882],
    'Meghalaya': [25.4670, 91.3662],
    'Assam': [26.2006, 92.9376],
  };

  return (
    <div className="w-full rounded-lg overflow-hidden border border-border relative" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {companies.length > 0 && <FitBounds companies={companies} />}

        {/* ESG Heatmap Circles */}
        {showHeatmap && stateAggregates.map((state) => {
          const coords = stateCoordinates[state.state];
          if (!coords) return null;

          const color = getESGColor(state.avg_esg_score);
          const radius = getCircleRadius(state.company_count, state.avg_esg_score);

          return (
            <Circle
              key={state.state}
              center={coords}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onStateClick?.(state.state),
              }}
            >
              <Tooltip permanent>
                <div className="text-center">
                  <div className="font-semibold">{state.state}</div>
                  <div className="text-sm">ESG: {state.avg_esg_score.toFixed(1)}</div>
                  <div className="text-sm">Companies: {state.company_count}</div>
                </div>
              </Tooltip>
            </Circle>
          );
        })}

        {/* Company Markers */}
        {companies.map((company) => (
          <Marker
            key={company.bse_code}
            position={[company.latitude, company.longitude]}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-lg">{company.company_name}</h3>
                <p className="text-sm text-muted-foreground">{company.sector}</p>
                {company.esg_score && (
                  <div className="mt-2">
                    <span className="text-sm font-medium">ESG Score: </span>
                    <span
                      className="px-2 py-1 rounded text-white text-sm"
                      style={{ backgroundColor: getESGColor(company.esg_score) }}
                    >
                      {company.esg_score.toFixed(1)}
                    </span>
                  </div>
                )}
                <p className="text-sm mt-1">{company.state}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-background/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border z-10">
        <h4 className="font-semibold text-sm mb-2">ESG Score Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }}></div>
            <span>80-100: Excellent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#84cc16' }}></div>
            <span>70-79: Good</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#eab308' }}></div>
            <span>60-69: Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }}></div>
            <span>50-59: Below Average</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
            <span>0-49: Poor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveMap;