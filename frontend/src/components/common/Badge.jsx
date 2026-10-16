import React from 'react';

const Badge = ({ variant = 'default', children, className = '' }) => {
  const variants = {
    // Status
    active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    returned: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    issued: 'bg-sky-100 text-sky-800 border-sky-200',
    overdue: 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse',
    inactive: 'bg-slate-100 text-slate-700 border-slate-200',
    suspended: 'bg-amber-100 text-amber-800 border-amber-200',
    
    // Roles
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    librarian: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    student: 'bg-blue-100 text-blue-800 border-blue-200',

    // Stock availability
    available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    outOfStock: 'bg-rose-50 text-rose-700 border-rose-200',

    default: 'bg-slate-100 text-slate-800 border-slate-200'
  };

  const selectedClass = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${selectedClass} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
