import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Package,
  Droplets,
  Flame,
  AlertTriangle,
  Warehouse,
  Search,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { path: '/instruments', label: '器械包台账', icon: Package },
  { path: '/cleaning', label: '清洗消毒登记', icon: Droplets },
  { path: '/sterilization', label: '灭菌放行', icon: Flame },
  { path: '/exceptions', label: '异常处理', icon: AlertTriangle },
  { path: '/inventory', label: '库存与借还', icon: Warehouse },
  { path: '/trace', label: '追溯查询', icon: Search },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-primary-800 text-white transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between p-4 h-16 border-b border-primary-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-primary-800 font-bold text-sm">齿</span>
            </div>
            <span className="font-bold text-lg">器械追溯系统</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-primary-700 rounded-lg transition-colors"
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      <nav className="p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${
                  isActive
                    ? 'bg-white text-primary-800 font-medium shadow-md'
                    : 'text-primary-100 hover:bg-primary-700 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="font-medium">张</span>
            </div>
            <div>
              <p className="font-medium text-sm">张护士长</p>
              <p className="text-xs text-primary-300">管理员</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
