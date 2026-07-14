import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Home from '../pages/Home';
import Dashboard from '../pages/Dashboard';
import Billing from '../pages/Billing';
import History from '../pages/History';
import ReviewDetail from '../pages/ReviewDetail';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { 
        path: 'dashboard', 
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'billing', 
        element: (
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'history', 
        element: (
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        ) 
      },
      { 
        path: 'review/:id', 
        element: (
          <ProtectedRoute>
            <ReviewDetail />
          </ProtectedRoute>
        ) 
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
