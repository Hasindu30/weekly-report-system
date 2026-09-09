import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-2">
        <Link to="/login" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
            WR
          </div>
          <div className="text-left">
            <div className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              Weekly Report
            </div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
              Team Operations
            </div>
          </div>
        </Link>
      </div>

      <div className="w-full max-w-md min-w-0">
        <Outlet />
      </div>

      {/* Footer copyright / subtle info */}
      <div className="mt-8 text-center text-xs text-slate-400">
        Weekly Report Generator & Team Dashboard
      </div>
    </div>
  );
}
