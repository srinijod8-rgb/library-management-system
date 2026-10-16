import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import BookCatalog from '../pages/BookCatalog';
import StudentManagement from '../pages/StudentManagement';
import IssueBook from '../pages/IssueBook';
import ReturnBook from '../pages/ReturnBook';
import IssuedBooks from '../pages/IssuedBooks';
import OverdueBooks from '../pages/OverdueBooks';
import BorrowingHistory from '../pages/BorrowingHistory';
import Reports from '../pages/Reports';
import Profile from '../pages/Profile';
import NotFound from '../pages/NotFound';

// Protected Route wrapper
const ProtectedRoute = ({ children, staffOnly = false }) => {
  const { isAuthenticated, loading, isStaff } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Checking authentication credentials..." size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (staffOnly && !isStaff) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Only Route wrapper (e.g. login/register)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner message="Loading..." size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Pages */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Application Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="books" element={<BookCatalog />} />
        <Route path="transactions/issued" element={<IssuedBooks />} />
        <Route path="transactions/overdue" element={<OverdueBooks />} />
        <Route path="transactions/history" element={<BorrowingHistory />} />
        <Route path="profile" element={<Profile />} />

        {/* Staff Only Routes (Librarian / Admin) */}
        <Route
          path="issue"
          element={
            <ProtectedRoute staffOnly>
              <IssueBook />
            </ProtectedRoute>
          }
        />
        <Route
          path="return"
          element={
            <ProtectedRoute staffOnly>
              <ReturnBook />
            </ProtectedRoute>
          }
        />
        <Route
          path="members"
          element={
            <ProtectedRoute staffOnly>
              <StudentManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute staffOnly>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* 404 Catch-All within layout */}
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Global fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
