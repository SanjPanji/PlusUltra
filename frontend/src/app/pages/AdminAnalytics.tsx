import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import {
  TrendingUp, Trash2, Leaf, Clock, AlertTriangle,
  ChevronRight, ArrowUpRight, RefreshCw, Map as MapIcon, Activity, Truck, Zap, CheckCircle2, Circle
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { mapBackendContainer, BackendRoute, BackendContainer } from '../services/types';

const COLORS = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const getFillColor = (level: number) => {
  if (level >= 80) return '#EF4444';
  if (level >= 50) return '#F59E0B';
  return '#22C55E';
};

export function AdminAnalytics() {
  const [containers, setContainers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<BackendRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cData, rData] = await Promise.all([
          apiService.get<BackendContainer[]>('/containers/'),
          apiService.get<BackendRoute[]>('/routes/'),
        ]);
        setContainers(cData.map(mapBackendContainer));
        setRoutes(rData);
      } catch (error) {
        console.error('Failed to fetch analytics data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      await apiService.post('/routes/recalculate/', {
        driver_id: routes[0]?.driver?.id || 1,
        depot_longitude: 71.4460,
        depot_latitude: 51.1801,
      });
      const newRoutes = await apiService.get<BackendRoute[]>('/routes/');
      setRoutes(newRoutes);
    } catch (error) {
      console.error('Recalculation failed', error);
    } finally {
      setIsRecalculating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const totalContainers = containers.length;
  const avgFill = totalContainers > 0 ? Math.round(containers.reduce((acc, c) => acc + c.fillLevel, 0) / totalContainers) : 0;
  const totalCO2 = Math.round(routes.reduce((acc, r) => acc + r.estimated_co2, 0));
  const criticalCount = containers.filter(c => c.fillLevel >= 80).length;

  const kpis = [
    { label: 'Total Containers', value: String(totalContainers), icon: Trash2, trend: '+4%', color: 'blue' },
    { label: 'Avg. Fill Level', value: `${avgFill}%`, icon: TrendingUp, trend: '-2%', color: 'amber' },
    { label: 'Critical Bins', value: String(criticalCount), icon: AlertTriangle, trend: '+12%', color: 'red' },
    { label: 'CO₂ Saved (kg)', value: String(totalCO2), icon: Leaf, trend: '+24%', color: 'green' },
  ];

  const wasteTypeData = Object.entries(
    containers.reduce((acc, c) => {
      acc[c.wasteType] = (acc[c.wasteType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <div className="h-full bg-slate-50 overflow-y-auto font-inter">
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">System Analytics</h1>
            <p className="text-slate-500 mt-1">Real-time performance metrics and optimization</p>
          </div>
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-green-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRecalculating ? 'animate-spin' : ''}`} />
            {isRecalculating ? 'Optimising...' : 'Recalculate Routes'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-slate-50 flex items-center justify-center`}>
                  <kpi.icon className="w-6 h-6 text-slate-600" />
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                  <ArrowUpRight className="w-3 h-3" />
                  {kpi.trend}
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{kpi.value}</div>
              <div className="text-sm font-medium text-slate-500">{kpi.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-8">Collection Efficiency</h3>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={routes.slice(-7).map((r, i) => ({
                  name: `R-${r.id}`,
                  efficiency: Math.round((r.total_distance / (r.estimated_time || 1)) * 100),
                }))}>
                  <defs>
                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22C55E" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="efficiency" stroke="#22C55E" strokeWidth={3} fillOpacity={1} fill="url(#colorEff)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-8">Waste Composition</h3>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={wasteTypeData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {wasteTypeData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {wasteTypeData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900">Recent Container Status</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Container</th>
                  <th className="px-6 py-3">Fill Level</th>
                  <th className="px-6 py-3">Waste Type</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {containers.slice(0, 10).map((c) => (
                  <tr key={c.id} className="border-b border-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{c.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${c.fillLevel}%`, backgroundColor: getFillColor(c.fillLevel) }} />
                        </div>
                        <span>{c.fillLevel}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{c.wasteType}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${c.fillLevel >= 80 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {c.fillLevel >= 80 ? 'CRITICAL' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}