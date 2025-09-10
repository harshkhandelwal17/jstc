import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Home,
  Users,
  CreditCard,
  Award,
  BarChart3,
  LogOut,
  Menu,
  X,
  GraduationCap,
  AlertTriangle,
  User
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import logoImage from '../assets/WhatsApp Image 2025-09-08 at 18.08.01_34500e78.jpg';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const currentPath = location.pathname;

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Fees', href: '/fees', icon: CreditCard },
    { name: 'Results', href: '/results', icon: Award },
    { name: 'Back Subjects', href: '/back-subjects', icon: AlertTriangle },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  function handleSignOut() {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white shadow-lg">
      {/* Logo Section */}
      <div className="flex items-center px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl mr-4 shadow-lg overflow-hidden">
          <img 
            src={logoImage} 
            alt="JSTC Computer Center Logo" 
            className="w-full h-full object-cover rounded-xl"
          />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900">JSTC Computer Center</h1>
          <p className="text-xs text-gray-500">Affiliated by MCU BHOPAL</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navigation.map((item) => {
          let isActive = false;
           
          if (item.href === '/dashboard') {
            isActive = currentPath === '/dashboard' || currentPath === '/';
          } else {
            isActive = currentPath === item.href || currentPath.startsWith(item.href);
          }
           
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg transform scale-105'
                  : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md'
              }`}
            >
              <item.icon
                className={`flex-shrink-0 mr-3 h-5 w-5 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'
                }`}
              />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 pb-4 border-t border-gray-200 pt-4">
        <div className="flex items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm">
          <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500 font-medium">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 shadow-lg transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="absolute top-0 right-0 -mr-12 pt-2">
          <button
            type="button"
            className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-gray-200">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex h-16 bg-white border-b border-gray-200 shadow-sm">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex sm:items-center sm:space-x-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={logoImage} 
                    alt="JSTC Computer Center Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">JSTC Computer Center</h1>
                  <p className="text-sm text-gray-600 font-medium">Affiliated by MCU BHOPAL</p>
                </div>
              </div>
              <div className="sm:hidden flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
                  <img 
                    src={logoImage} 
                    alt="JSTC Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">JSTC</h1>
                  <p className="text-xs text-gray-500">MCU BHOPAL</p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-all duration-200 hover:shadow-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;