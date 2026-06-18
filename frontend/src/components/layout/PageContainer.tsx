import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  BarChart3, 
  Zap, 
  Database, 
  Activity, 
  Layers, 
  BookmarkCheck, 
  LineChart, 
  FileText, 
  History, 
  Settings,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Cpu
} from 'lucide-react';

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: BarChart3 },
    { name: 'Predictions', href: '/predictions', icon: Zap },
    { name: 'Datasets', href: '/datasets', icon: Database },
    { name: 'ML Pipeline', href: '/pipeline', icon: Activity },
    { name: 'Experiments', href: '/experiments', icon: Layers },
    { name: 'Model Registry', href: '/registry', icon: BookmarkCheck },
    { name: 'Monitoring', href: '/monitoring', icon: LineChart, adminOnly: true },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Activity Logs', href: '/logs', icon: History, adminOnly: true },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const visibleNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    navigate('/');
    setTimeout(() => {
      logout();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-border bg-white z-30">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          {/* Logo Section */}
          <div className="flex items-center flex-shrink-0 px-6 space-x-3 mb-8">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Cpu size={18} />
            </div>
            <span className="font-bold text-lg tracking-tight text-text">PredictWise <span className="text-primary">AI</span></span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 space-y-1.5">
            {visibleNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                    isActive
                      ? 'bg-primary/5 text-primary border-l-2 border-primary pl-3.5'
                      : 'text-text-muted hover:bg-background hover:text-text'
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 shrink-0 ${
                    isActive ? 'text-primary' : 'text-text-muted group-hover:text-text'
                  }`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="flex-shrink-0 flex border-t border-border p-4 bg-white">
          <div className="flex items-center space-x-3 w-full">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <UserIcon size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-text-muted truncate">
                {user?.role}
              </p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-text-muted hover:text-red-500 p-1.5 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden text-text-muted hover:text-text p-1.5 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-bold text-lg text-text">
              {navigation.find(n => n.href === location.pathname)?.name || 'Platform'}
            </h1>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-200 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping mr-1"></span>
              <span>API Gateway Connected</span>
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 relative">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setMobileMenuOpen(false)} />
          
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white border-r border-border transition-all duration-300">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-gray-900 text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center px-6 space-x-3 mb-8">
                <div className="bg-primary p-2 rounded-lg text-white">
                  <Cpu size={18} />
                </div>
                <span className="font-bold text-lg text-text">PredictWise AI</span>
              </div>
              <nav className="px-4 space-y-1">
                {visibleNavigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-4 py-2.5 text-sm font-medium rounded-lg ${
                        isActive
                          ? 'bg-primary/5 text-primary border-l-2 border-primary pl-3.5'
                          : 'text-text-muted hover:bg-background hover:text-text'
                      }`}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-border p-4 bg-white">
              <div className="flex items-center space-x-3 w-full">
                <div className="bg-primary/10 text-primary p-2 rounded-lg">
                  <UserIcon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{user?.full_name}</p>
                  <p className="text-xs text-text-muted truncate">{user?.role}</p>
                </div>
                <button onClick={handleLogout} className="text-text-muted hover:text-red-500">
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
