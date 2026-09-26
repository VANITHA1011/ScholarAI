import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user && user.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
