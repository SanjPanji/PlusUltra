import { createBrowserRouter, redirect } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DriverDashboard } from './pages/DriverDashboard';
import { CityWasteMap } from './pages/CityWasteMap';
import { AdminAnalytics } from './pages/AdminAnalytics';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/register',
    Component: RegisterPage,
  },
  {
    Component: AppLayout,
    children: [
      {
        path: 'driver',
        Component: DriverDashboard,
      },
      {
        path: 'map',
        Component: CityWasteMap,
      },
      {
        path: 'admin',
        Component: AdminAnalytics,
      },
      {
        path: '*',
        loader: () => redirect('/'),
      },
    ],
  },
]);
