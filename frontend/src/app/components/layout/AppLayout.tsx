import { NavLink, Outlet, useNavigate } from 'react-router';
import {
  Truck, Map, BarChart2, Bell, ChevronDown, Leaf,
  LogOut, Settings, User, Cpu
} from 'lucide-react';

export function AppLayout() {
  const navigate = useNavigate();

  const navItems = [
    { to: '/driver', label: 'Driver View', icon: Truck },
    { to: '/map', label: 'City Map', icon: Map },
    { to: '/admin', label: 'Analytics', icon: BarChart2 },
  ];

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-6 shrink-0 z-50 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mr-10">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
            <Leaf className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-slate-900 font-semibold tracking-tight text-[15px]">EcoWaste</span>
            <span className="text-green-600 font-semibold tracking-tight text-[15px]"> AI</span>
          </div>
          <div className="ml-1 flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
            <Cpu className="w-2.5 h-2.5" />
            LIVE
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex items-center gap-1 flex-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Date */}
          <div className="text-xs text-slate-400 font-medium hidden lg:block">
            Mon, Feb 23, 2026
          </div>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <Bell className="w-4.5 h-4.5 text-slate-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </button>

          {/* Settings */}
          <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors">
            <Settings className="w-4.5 h-4.5 text-slate-500" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* User */}
          <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <div className="w-7 h-7 bg-green-600 rounded-full flex items-center justify-center shadow-sm">
              <User className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-slate-800 leading-tight">Alex Morgan</div>
              <div className="text-[10px] text-slate-400 leading-tight">Admin</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Logout */}
          <button
            onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-slate-400"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}