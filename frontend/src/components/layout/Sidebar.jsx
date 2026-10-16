import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertCircle,
  History,
  Users,
  BarChart3,
  User,
  LogOut,
  X,
  Library
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout, isStaff } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'librarian', 'student']
    },
    {
      name: 'Book Catalog',
      path: '/books',
      icon: BookOpen,
      roles: ['admin', 'librarian', 'student']
    },
    // Circulation
    {
      name: 'Issue Book',
      path: '/issue',
      icon: ArrowUpRight,
      roles: ['admin', 'librarian']
    },
    {
      name: 'Return Book',
      path: '/return',
      icon: ArrowDownLeft,
      roles: ['admin', 'librarian']
    },
    {
      name: 'Issued Books',
      path: '/transactions/issued',
      icon: Clock,
      roles: ['admin', 'librarian', 'student']
    },
    {
      name: 'Overdue Books',
      path: '/transactions/overdue',
      icon: AlertCircle,
      roles: ['admin', 'librarian', 'student'],
      highlight: true
    },
    {
      name: 'Borrowing History',
      path: '/transactions/history',
      icon: History,
      roles: ['admin', 'librarian', 'student']
    },
    // Administration
    {
      name: 'Student Records',
      path: '/members',
      icon: Users,
      roles: ['admin', 'librarian']
    },
    {
      name: 'Reports & Export',
      path: '/reports',
      icon: BarChart3,
      roles: ['admin', 'librarian']
    },
    // Account
    {
      name: 'My Profile',
      path: '/profile',
      icon: User,
      roles: ['admin', 'librarian', 'student']
    }
  ];

  const visibleLinks = navLinks.filter((link) => link.roles.includes(user?.role || 'student'));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                Athena
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider text-sky-400">
                Library System
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center gap-3">
          <img
            src={
              user?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0284c7&color=fff`
            }
            alt={user?.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-sky-500/30 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant={user?.role}>{user?.role}</Badge>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Main Navigation
          </div>

          {visibleLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold shadow-md shadow-sky-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{link.name}</span>
                </div>
                {link.highlight && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-400/30" />
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom Session Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
