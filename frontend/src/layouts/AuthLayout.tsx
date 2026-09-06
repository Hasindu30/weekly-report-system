import { Outlet, Link } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <Link to="/login" className="text-2xl font-bold text-indigo-600">
          Weekly Report System
        </Link>
      </div>
      <Outlet />
    </div>
  );
}
