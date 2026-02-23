import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Layers, X, Clock, Trash2, Recycle, Flame, Route,
  ChevronRight, Info, AlertCircle, Search
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { mapBackendContainer, mapWasteType } from '../services/types';
import { type Container } from '../data/mockData';

const getFillColor = (level: number) => {
  if (level >= 80) return '#EF4444';
  if (level >= 50) return '#F59E0B';
  return '#22C55E';
};

const getStatusInfo = (level: number) => {
  if (level >= 80) return { label: 'Critical', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  if (level >= 50) return { label: 'Warning', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { label: 'Normal', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
};

const wasteTypeIcon = (type: string) => {
  switch (type) {
    case 'Recycling': return <Recycle className="w-3.5 h-3.5 text-blue-500" />;
    case 'Organic': return <Flame className="w-3.5 h-3.5 text-amber-500" />;
    case 'Hazardous': return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    default: return <Trash2 className="w-3.5 h-3.5 text-slate-500" />;
  }
};

interface LayerState {
  hotspots: boolean;
  recycling: boolean;
  route: boolean;
}

export function CityWasteMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ marker: L.Marker; container: Container }[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [layers, setLayers] = useState<LayerState>({ hotspots: true, recycling: true, route: false });
  const [showLayerPanel, setShowLayerPanel] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const geoData = await apiService.get<any>('/map/containers/geojson/');
        const mapped = geoData.features.map((f: any) => ({
          id: String(f.properties.id),
          name: `BIN-${String(f.properties.id).padStart(3, '0')}`,
          address: 'Main Street',
          fillLevel: f.properties.fill_level,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          lastUpdated: f.properties.last_updated,
          wasteType: mapWasteType(f.properties.waste_type),
          district: 'Central',
          estimatedArrival: 'N/A',
          capacity: 1000
        }));
        setContainers(mapped);
      } catch (error) {
        console.error('Failed to fetch map data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || isLoading) return;

    const map = L.map(mapContainerRef.current, {
      center: [52.516, 13.405] as [number, number],
      zoom: 13,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add all container markers
    containers.forEach(container => {
      const bgColor = getFillColor(container.fillLevel);

      const icon = L.divIcon({
        html: `<div style="
          width: 38px; height: 38px;
          background: ${bgColor};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 3px 12px ${bgColor}55;
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 11px; font-weight: 700;
          font-family: Inter, sans-serif;
          cursor: pointer;
          transition: transform 0.15s;
        ">${container.fillLevel}%</div>`,
        className: 'leaflet-div-icon-custom',
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -22],
      });

      const marker = L.marker([container.lat, container.lng] as [number, number], { icon });
      marker.on('click', () => {
        setSelectedContainer(container);
      });
      marker.addTo(map);
      markersRef.current.push({ marker, container });
    });

    if (containers.length > 0) {
      const group = L.featureGroup(markersRef.current.map(m => m.marker));
      map.fitBounds(group.getBounds().pad(0.1));
    }

    // Add route layer (mock for now because we don't have a global route endpoint)
    const criticalContainers = containers.filter(c => c.fillLevel >= 80);
    const routeCoords: [number, number][] = criticalContainers.map(c => [c.lat, c.lng]);
    const routeLayer = L.polyline(routeCoords, {
      color: '#16A34A',
      weight: 3,
      opacity: 0.7,
      dashArray: '8, 6',
    });
    routeLayerRef.current = routeLayer;

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
      routeLayerRef.current = null;
    };
  }, [isLoading, containers]);

  // Handle layer toggles
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    markersRef.current.forEach(({ marker, container }) => {
      const isCritical = container.fillLevel >= 80;
      const isRecycling = container.wasteType === 'Recycling';

      let visible = true;
      if (isCritical && !layers.hotspots) visible = false;
      if (isRecycling && !layers.recycling) visible = false;

      if (visible) {
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else {
        if (map.hasLayer(marker)) marker.remove();
      }
    });

    // Route layer
    if (routeLayerRef.current) {
      if (layers.route) {
        if (!map.hasLayer(routeLayerRef.current)) routeLayerRef.current.addTo(map);
      } else {
        if (map.hasLayer(routeLayerRef.current)) routeLayerRef.current.remove();
      }
    }
  }, [layers]);

  const toggleLayer = (key: keyof LayerState) => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredContainers = containers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const criticalCount = containers.filter(c => c.fillLevel >= 80).length;
  const warningCount = containers.filter(c => c.fillLevel >= 50 && c.fillLevel < 80).length;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-full relative overflow-hidden">
      {/* Map */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Top Search Bar */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] w-80">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search containers..."
            className="w-full pl-9 pr-4 py-2.5 bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 placeholder:text-slate-400"
          />
        </div>
        {/* Search Results Dropdown */}
        {searchQuery && (
          <div className="mt-1 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden max-h-48 overflow-y-auto">
            {filteredContainers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-500">No containers found</div>
            ) : filteredContainers.slice(0, 5).map(c => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedContainer(c);
                  setSearchQuery('');
                  mapRef.current?.flyTo([c.lat, c.lng], 15);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: getFillColor(c.fillLevel) }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400 truncate">{c.address}</div>
                </div>
                <span className="text-xs font-bold ml-auto" style={{ color: getFillColor(c.fillLevel) }}>
                  {c.fillLevel}%
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Bar */}
      <div className="absolute top-4 left-4 z-[500] flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2.5 shadow-md border border-slate-100">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-600 text-xs">{containers.length} total</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-red-600 text-xs font-medium">{criticalCount} critical</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-amber-600 text-xs font-medium">{warningCount} warning</span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Toggle Panel */}
      <div className="absolute top-4 right-4 z-[500]">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-md border border-slate-100 overflow-hidden">
          <button
            onClick={() => setShowLayerPanel(!showLayerPanel)}
            className="flex items-center gap-2.5 px-4 py-3 w-full hover:bg-slate-50 transition-colors border-b border-slate-100"
          >
            <Layers className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">Map Layers</span>
            <ChevronRight
              className={`w-3.5 h-3.5 text-slate-400 ml-auto transition-transform ${showLayerPanel ? 'rotate-90' : ''}`}
            />
          </button>

          {showLayerPanel && (
            <div className="p-3 space-y-1">
              {[
                { key: 'hotspots' as keyof LayerState, icon: Flame, label: 'Hotspots', sublabel: 'Critical >80%', color: 'text-red-500 bg-red-50' },
                { key: 'recycling' as keyof LayerState, icon: Recycle, label: 'Recycling', sublabel: 'Recycling bins', color: 'text-blue-500 bg-blue-50' },
                { key: 'route' as keyof LayerState, icon: Route, label: 'Route', sublabel: 'Optimal path', color: 'text-green-600 bg-green-50' },
              ].map(({ key, icon: Icon, label, sublabel, color }) => (
                <button
                  key={key}
                  onClick={() => toggleLayer(key)}
                  className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 transition-colors ${layers[key] ? 'bg-slate-50 hover:bg-slate-100' : 'hover:bg-slate-50 opacity-60'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-700">{label}</div>
                    <div className="text-[10px] text-slate-400">{sublabel}</div>
                  </div>
                  <div className={`ml-auto w-8 h-4.5 rounded-full transition-all flex items-center ${layers[key] ? 'bg-green-500 justify-end' : 'bg-slate-200 justify-start'
                    } p-0.5`}>
                    <div className="w-3.5 h-3.5 bg-white rounded-full shadow-sm" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Card (when container selected) */}
      {selectedContainer && (
        <div className="absolute bottom-6 right-4 z-[500] w-72">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
            {/* Card Header */}
            <div
              className="px-5 py-4"
              style={{ background: `linear-gradient(135deg, ${getFillColor(selectedContainer.fillLevel)}15, ${getFillColor(selectedContainer.fillLevel)}05)` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold text-slate-900 text-base">{selectedContainer.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{selectedContainer.address}</div>
                </div>
                <button
                  onClick={() => setSelectedContainer(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600 shrink-0 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fill level */}
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${selectedContainer.fillLevel}%`,
                      backgroundColor: getFillColor(selectedContainer.fillLevel),
                    }}
                  />
                </div>
                <span
                  className="text-sm font-bold shrink-0"
                  style={{ color: getFillColor(selectedContainer.fillLevel) }}
                >
                  {selectedContainer.fillLevel}%
                </span>
              </div>
            </div>

            {/* Card Body */}
            <div className="px-5 py-4 space-y-3">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Fill Status</span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getStatusInfo(selectedContainer.fillLevel).color} ${getStatusInfo(selectedContainer.fillLevel).bg} ${getStatusInfo(selectedContainer.fillLevel).border}`}>
                  {getStatusInfo(selectedContainer.fillLevel).label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Last Updated</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{new Date(selectedContainer.lastUpdated).toLocaleTimeString()}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    {wasteTypeIcon(selectedContainer.wasteType)}
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Waste Type</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{selectedContainer.wasteType}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">District</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{selectedContainer.district}</div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Info className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Capacity</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-800">{selectedContainer.capacity}L</div>
                </div>
              </div>

              {/* Action Button */}
              {selectedContainer.fillLevel >= 80 && (
                <button className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Add to Urgent Queue
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-4 z-[500]">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-slate-100">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">Fill Level Legend</div>
          <div className="space-y-2">
            {[
              { color: '#22C55E', range: '< 50%', label: 'Normal' },
              { color: '#F59E0B', range: '50–80%', label: 'Warning' },
              { color: '#EF4444', range: '> 80%', label: 'Critical' },
            ].map(({ color, range, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm shrink-0"
                  style={{ backgroundColor: color }}
                />
                <div>
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                  <span className="text-[10px] text-slate-400 ml-1.5">{range}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}