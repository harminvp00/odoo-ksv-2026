import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, X, Bell, LogOut, 
  LayoutDashboard, Users, FileText, BadgePercent, CheckSquare, FileSpreadsheet, FileClock, BarChart3 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ...(user?.role !== 'VENDOR' ? [
      { name: 'Vendors', path: '/vendors', icon: Users },
      { name: "RFQ's", path: '/rfqs/create', icon: FileText },
      { name: 'Compare Bids', path: '/quotations/compare', icon: BadgePercent },
      { name: 'Approvals', path: '/approvals', icon: CheckSquare },
    ] : [
      { name: 'Submit Bid', path: '/quotations/submit', icon: BadgePercent },
    ]),
    { name: 'POs & Invoices', path: '/invoices', icon: FileSpreadsheet },
    ...(user?.role !== 'VENDOR' ? [
      { name: 'Reports', path: '/reports', icon: BarChart3 },
      { name: 'Activity', path: '/activity', icon: FileClock },
    ] : []),
  ];

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      
      {/* Desktop Sidebar (Left side panel) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-neutral-200/80 h-full flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-neutral-200/80">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center font-bold text-sm">VB</span>
            <span className="font-bold text-neutral-900 tracking-tight text-lg">VendorBridge</span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-neutral-100 text-neutral-900 font-semibold' 
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Drawer Slide-out Menu */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ${mobileMenuOpen ? 'visible' : 'invisible'}`}>
        {/* Backdrop overlay */}
        <div 
          className={`absolute inset-0 bg-neutral-950/20 backdrop-blur-sm transition-opacity duration-300 ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} 
          onClick={toggleMobileMenu}
        />
        {/* Drawer panel */}
        <nav className={`absolute top-0 bottom-0 left-0 w-64 bg-white border-r border-neutral-200 p-5 flex flex-col space-y-6 transition-transform duration-300 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2" onClick={toggleMobileMenu}>
              <span className="w-8 h-8 rounded-lg bg-[#171717] text-white flex items-center justify-center font-bold text-sm">VB</span>
              <span className="font-bold text-neutral-900 tracking-tight">VendorBridge</span>
            </Link>
            <button onClick={toggleMobileMenu} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500 transition">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={toggleMobileMenu}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-neutral-100 text-neutral-900 font-semibold' 
                      : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header / Navbar */}
        <header className="h-16 border-b border-neutral-200/80 bg-white px-6 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 lg:hidden transition">
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-semibold text-neutral-400 select-none">Workspace</h2>
          </div>

          <div className="flex items-center space-x-5">
            {/* Notification alert Bell */}
            <button className="relative p-2 text-neutral-500 hover:text-neutral-950 transition hover:bg-neutral-50 rounded-xl">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-accent-success rounded-full border border-white"></span>
            </button>

            {/* Profile badge info */}
            <div className="flex items-center gap-3 border-l border-neutral-200 pl-5">
              <div className="w-8 h-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
                {user?.firstName?.[0] || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-neutral-800 leading-none">{user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-neutral-400 capitalize mt-0.5 font-medium tracking-wide">
                  {user?.role?.replace(/_/g, ' ').toLowerCase()}
                </p>
              </div>
            </div>

            {/* Logout button */}
            <button onClick={logout} className="p-2 text-neutral-400 hover:text-accent-danger hover:bg-rose-50 rounded-xl transition" title="Log Out">
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
