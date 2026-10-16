import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-20 h-20 rounded-3xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 shadow-sm">
        <BookOpen className="w-10 h-10" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-sky-600 bg-sky-50 px-3 py-1 rounded-full mb-3">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
        Page Not Found in Catalog
      </h1>

      <p className="text-sm text-slate-500 max-w-md mb-8">
        The catalog link, shelf index, or application route you are trying to visit does not exist or may have been moved.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/20 transition-all flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <Link
          to="/books"
          className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors flex items-center gap-2"
        >
          <BookOpen className="w-4 h-4 text-sky-600" />
          <span>Browse Book Catalog</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
