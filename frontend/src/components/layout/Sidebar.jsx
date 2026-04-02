import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Box, ArrowLeftRight, Bell, LogOut, Package, DollarSign, Warehouse, Truck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout, hasRole } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
    { name: 'Products', path: '/products', icon: <Package size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
    { name: 'Categories', path: '/categories', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
    { name: 'Stock Movement', path: '/stock-movement', icon: <ArrowLeftRight size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
    { name: 'Valuation', path: '/valuation', icon: <DollarSign size={20} />, roles: ['Admin', 'InventoryManager'] },
    { name: 'Warehouses', path: '/warehouses', icon: <Warehouse size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
    { name: 'Suppliers', path: '/suppliers', icon: <Truck size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
    { name: 'Purchase Orders', path: '/purchase-orders', icon: <Truck size={20} />, roles: ['Admin', 'InventoryManager'] },
    { name: 'Analytics', path: '/analytics', icon: <LayoutDashboard size={20} />, roles: ['Admin', 'InventoryManager'] },
    { name: 'Alerts', path: '/alerts', icon: <Bell size={20} />, roles: ['Admin', 'InventoryManager', 'InventoryClerk'] },
  ];

  return (
    <div className="flex flex-col h-screen w-64 bg-slate-900 text-white border-r border-slate-700">
      <div className="p-6 flex items-center gap-3">
        <Box className="text-blue-500" size={32} />
        <span className="text-xl font-bold tracking-tight">StockPro</span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => (
          hasRole(item.roles) && (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.name}</span>
            </NavLink>
          )
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 mb-4 px-4">
          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center font-bold">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.username}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
