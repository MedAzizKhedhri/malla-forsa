import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Package, Users, Mail,
  LayoutDashboard, Globe, LogOut, MoreHorizontal, X,
  ShoppingCart, KeyRound
} from 'lucide-react';

// Full sidebar navigation (desktop)
const navigation = [
  { name: 'Tableau de Bord', href: '/', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Paniers', href: '/paniers', icon: ShoppingCart },
  { name: 'Colis', href: '/colis', icon: Package },
  { name: 'Emails', href: '/emails', icon: Mail },
  { name: 'Identifiants', href: '/credentials', icon: KeyRound },
  { name: 'Catalogue Public', href: '/catalog-manager', icon: Globe },
];

// Primary tabs shown in the mobile bottom bar
const primaryTabs = [
  { name: 'Accueil', href: '/', icon: LayoutDashboard },
  { name: 'Paniers', href: '/paniers', icon: ShoppingCart },
  { name: 'Colis', href: '/colis', icon: Package },
  { name: 'Clients', href: '/clients', icon: Users },
];

// Secondary items accessible via the "Plus" sheet on mobile
const secondaryItems = [
  { name: 'Emails', href: '/emails', icon: Mail },
  { name: 'Identifiants', href: '/credentials', icon: KeyRound },
  { name: 'Catalogue Public', href: '/catalog-manager', icon: Globe },
];

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href) => location.pathname === href;

  // A secondary item is "active" if the current path matches one of them
  const isMoreActive = secondaryItems.some(item => isActive(item.href));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row font-sans text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30">

      {/* ── MOBILE TOP HEADER ─────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center shadow-sm">
        <span className="text-xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
          Malla Forssa
        </span>
        <span className="ml-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Import</span>
      </header>

      {/* ── DESKTOP SIDEBAR ───────────────────────────────────── */}
      <aside className="hidden md:flex md:w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-shrink-0 md:h-screen md:sticky top-0 z-10 shadow-sm flex-col justify-between">
        <div>
          <div className="p-6">
            <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tighter">
              Malla Forssa
            </h1>
            <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Import Broker</p>
          </div>
          <nav className="px-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => { localStorage.removeItem('malla_token'); navigate('/login'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20 transition-all cursor-pointer border-none outline-none text-left"
          >
            <LogOut className="w-5 h-5 text-red-500" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <main className="flex-1 overflow-x-hidden min-h-screen bg-slate-50/50 dark:bg-slate-950/50 relative">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))] -z-10" />
        {/* pb-24 on mobile so content isn't hidden behind the bottom nav */}
        <div className="p-4 md:p-8 md:py-10 max-w-7xl mx-auto h-full pb-24 md:pb-10">
          {children}
        </div>
      </main>

      {/* ── MOBILE BOTTOM TAB BAR ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-stretch">
          {primaryTabs.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Icon size={22} strokeWidth={active ? 2.5 : 1.75} />
                <span className={`text-[10px] font-semibold ${active ? '' : 'font-medium'}`}>{tab.name}</span>
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 bg-indigo-500 rounded-b-full" />
                )}
              </Link>
            );
          })}

          {/* "Plus" tab */}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors ${
              isMoreActive
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            <MoreHorizontal size={22} strokeWidth={isMoreActive ? 2.5 : 1.75} />
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE "PLUS" BOTTOM SHEET ────────────────────────── */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMoreOpen(false)}
          />
          {/* Sheet */}
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl p-5 pb-8 animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Navigation</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1">
              {secondaryItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  localStorage.removeItem('malla_token');
                  navigate('/login');
                }}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
              >
                <LogOut size={20} className="text-red-500" />
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
