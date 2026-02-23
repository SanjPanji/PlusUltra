import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  Leaf, Clock, ChevronRight, Navigation2, CheckCircle2,
  AlertTriangle, Circle, Truck, Package, Zap
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { authService } from '../services/authService';
import { mapBackendContainer, BackendRoute, BackendContainer } from '../services/types';
import { type Container } from '../data/mockData';

const getMarkerIcon = (fillLevel: number, isActive = false) => {
  const bgColor = fillLevel >= 80 ? '#EF4444' : fillLevel >= 50 ? '#F59E0B' : '#22C55E';
  const borderColor = isActive ? '#0F172A' : 'white';
  const borderWidth = isActive ? '3px' : '2.5px';

  return L.divIcon({
    html: `<div style="
      width: 36px; height: 36px;
      background: ${bgColor};
      border: ${borderWidth} solid ${borderColor};
      border-radius: 50%;
      box-shadow: 0 3px 12px rgba(0,0,0,0.25);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 10px; font-weight: 700;
      font-family: Inter, sans-serif;
      transition: all 0.2s;
    ">${fillLevel}%</div>`,
    className: 'leaflet-div-icon-custom',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -22],
  });
};

const getFillColor = (level: number) => {
  if (level >= 80) return '#EF4444';
  if (level >= 50) return '#F59E0B';
  return '#22C55E';
};

const getStatusLabel = (level: number) => {
  if (level >= 80) return { label: 'Critical', color: 'bg-red-100 text-red-700' };
  if (level >= 50) return { label: 'Warning', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Normal', color: 'bg-green-100 text-green-700' };
};

export function DriverDashboard() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [activeContainer, setActiveContainer] = useState<Container | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [route, setRoute] = useState<BackendRoute | null>(null);
  const [allContainers, setAllContainers] = useState<Container[]>([]);
  const [driverRoute, setDriverRoute] = useState<Container[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = await authService.getCurrentUser();
        const routesData = await apiService.get<BackendRoute[]>(`/routes/driver/${user.id}/`);
        const containersData = await apiService.get<BackendContainer[]>('/containers/');

        const activeRoute = routesData.find(r => r.status === 'in_progress' || r.status === 'pending') || routesData[0];

        if (activeRoute) {
          setRoute(activeRoute);
          const mappedRoute = activeRoute.stops.map(stop => mapBackendContainer(stop.container));
          setDriverRoute(mappedRoute);
          setActiveContainer(mappedRoute[0] || null);
          setCompletedIds(activeRoute.stops.filter(s => s.visited_at).map(s => String(s.container.id)));
        }

        setAllContainers(containersData.map(mapBackendContainer));
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
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

    if (driverRoute.length > 0) {
      // Draw route polyline
      const routeCoords: [number, number][] = driverRoute.map(c => [c.lat, c.lng]);
      L.polyline(routeCoords, {
        color: '#16A34A',
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 6',
      }).addTo(map);

      // Fit map to route
      map.fitBounds(L.polyline(routeCoords).getBounds(), { padding: [50, 50] });
    }

    // Add non-route containers
    allContainers.forEach(container => {
      if (!driverRoute.find(r => r.id === container.id)) {
        const marker = L.marker([container.lat, container.lng] as [number, number], {
          icon: getMarkerIcon(container.fillLevel),
          opacity: 0.45,
        });
        marker.bindPopup(`
          <div style="padding: 12px 14px; min-width: 180px; font-family: Inter, sans-serif;">
            <div style="font-weight: 700; color: #1E293B; margin-bottom: 6px;">${container.name}</div>
            <div style="color: #64748B; font-size: 12px;">${container.address}</div>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; background: #F1F5F9; border-radius: 99px; height: 6px; overflow: hidden;">
                <div style="width: ${container.fillLevel}%; height: 100%; background: ${getFillColor(container.fillLevel)}; border-radius: 99px;"></div>
              </div>
              <span style="font-size: 12px; font-weight: 700; color: ${getFillColor(container.fillLevel)};">${container.fillLevel}%</span>
            </div>
          </div>
        `);
        marker.addTo(map);
      }
    });

    // Add route markers
    driverRoute.forEach((container, idx) => {
      const icon = L.divIcon({
        html: `<div style="
          width: 40px; height: 40px;
          background: ${getFillColor(container.fillLevel)};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 14px rgba(0,0,0,0.3);
          display: flex; align-items: center; justify-content: center;
          color: white; font-size: 13px; font-weight: 800;
          font-family: Inter, sans-serif;
        ">${idx + 1}</div>`,
        className: 'leaflet-div-icon-custom',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -24],
      });

      const marker = L.marker([container.lat, container.lng] as [number, number], { icon });
      marker.addTo(map);
      marker.on('click', () => setActiveContainer(container));
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isLoading, driverRoute, allContainers]);

  const totalContainers = driverRoute.length;
  const co2Saved = route ? Math.round(route.estimated_co2) : driverRoute.reduce((acc, c) => acc + Math.round(c.fillLevel * 0.032), 0);
  const totalDistance = route ? `${route.total_distance.toFixed(1)} km` : '0 km';
  const estimatedTime = route ? `${Math.round(route.estimated_time)}m` : '0m';

  const handleComplete = (id: string) => {
    setCompletedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    // Ideally call API to mark stop as visited
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium font-inter">Optimising your route...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex overflow-hidden">
      {/* Map Section */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0" />

        {/* Map Overlay: Route Info Badge */}
        <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <Navigation2 className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="text-xs text-slate-500">Today's Route</div>
            <div className="text-sm font-semibold text-slate-800">{totalDistance} · {driverRoute.length} stops</div>
          </div>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-6 left-4 z-[500] bg-white/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-md border border-slate-100">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Fill Level</div>
          <div className="flex flex-col gap-1.5">
            {[
              { color: '#22C55E', label: 'Normal (<50%)', },
              { color: '#F59E0B', label: 'Warning (50–80%)' },
              { color: '#EF4444', label: 'Critical (>80%)' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-xs text-slate-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-[360px] bg-white border-l border-slate-200 flex flex-col overflow-hidden shrink-0">
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-slate-900 text-[15px]">Today's Route</h2>
              <p className="text-xs text-slate-500 mt-0.5">AI-optimized · Priority queue</p>
            </div>
            <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-medium border border-green-200">
              <Truck className="w-3 h-3" />
              {route?.status === 'in_progress' ? 'On Route' : 'Ready'}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Package, value: `${totalContainers}`, label: 'Stops', color: 'text-blue-600 bg-blue-50' },
              { icon: Clock, value: estimatedTime, label: 'Est. Time', color: 'text-amber-600 bg-amber-50' },
              { icon: CheckCircle2, value: `${completedIds.length}`, label: 'Done', color: 'text-green-600 bg-green-50' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <div className={`w-6 h-6 rounded-lg ${color} flex items-center justify-center mx-auto mb-1`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div className="text-sm font-bold text-slate-800">{value}</div>
                <div className="text-[10px] text-slate-500">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Container List */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-3">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Collection Queue
            </div>

            <div className="space-y-2.5">
              {driverRoute.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">No pending collections</p>
                </div>
              ) : driverRoute.map((container, idx) => {
                const isActive = activeContainer?.id === container.id;
                const isDone = completedIds.includes(container.id);
                const status = getStatusLabel(container.fillLevel);

                return (
                  <div
                    key={container.id}
                    onClick={() => setActiveContainer(container)}
                    className={`relative rounded-xl border p-3.5 cursor-pointer transition-all ${isDone
                        ? 'opacity-50 bg-slate-50 border-slate-100'
                        : isActive
                          ? 'bg-green-50 border-green-200 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Step Number */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${isDone
                          ? 'bg-green-100 text-green-600'
                          : isActive
                            ? 'bg-green-600 text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-slate-800 truncate">{container.name}</span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${status.color}`}>
                            {status.label}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 truncate mb-2">{container.address}</p>

                        {/* Fill Level Bar */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${container.fillLevel}%`,
                                backgroundColor: getFillColor(container.fillLevel),
                              }}
                            />
                          </div>
                          <span
                            className="text-xs font-bold shrink-0"
                            style={{ color: getFillColor(container.fillLevel) }}
                          >
                            {container.fillLevel}%
                          </span>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock className="w-2.5 h-2.5" />
                            ETA {container.estimatedArrival}
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                              {container.wasteType}
                            </div>
                            {!isDone && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleComplete(container.id); }}
                                className="text-[10px] text-green-600 hover:text-green-700 font-medium ml-1"
                              >
                                Mark done
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom: Estimated Time & CO2 Badge */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-3 bg-white">
          {/* Estimated Time */}
          <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5 border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                <Clock className="w-4.5 h-4.5 text-amber-500" />
              </div>
              <div>
                <div className="text-xs text-slate-500">Estimated Completion</div>
                <div className="text-sm font-bold text-slate-800">
                  {route?.status === 'completed' ? 'Finished' : 'Upcoming'}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </div>

          {/* CO2 Savings Badge */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 shadow-md shadow-green-600/20">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-green-50 text-xs font-medium">CO₂ Saved Today</span>
              </div>
              <div className="flex items-center gap-1 bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                <Zap className="w-2.5 h-2.5" />
                AI Route
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white font-bold text-2xl">{co2Saved} kg</div>
                <div className="text-green-200 text-[11px] mt-0.5 flex items-center gap-1">
                  <span>↑ 12% vs standard route</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-green-100 text-xs">Equivalent to</div>
                <div className="text-white font-semibold text-xs">{Math.round(co2Saved * 0.11)} trees/day</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
