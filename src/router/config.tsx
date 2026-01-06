import { lazy } from 'react';
import { RouteObject } from 'react-router-dom';

// Lazy load pages
const Home = lazy(() => import('../pages/home/page'));
const Services = lazy(() => import('../pages/services/page'));
const Chauffeurs = lazy(() => import('../pages/services/chauffeurs/page'));
const Artisans = lazy(() => import('../pages/services/artisans/page'));
const Techniciens = lazy(() => import('../pages/services/techniciens/page'));
const About = lazy(() => import('../pages/about/page'));
const Contact = lazy(() => import('../pages/contact/page'));
const HowItWorks = lazy(() => import('../pages/how-it-works/page'));
const FAQ = lazy(() => import('../pages/faq/page'));
const Blog = lazy(() => import('../pages/blog/page'));
const Carrieres = lazy(() => import('../pages/carrieres/page'));
const Privacy = lazy(() => import('../pages/privacy/page'));
const CGU = lazy(() => import('../pages/cgu/page'));
const Support = lazy(() => import('../pages/support/page'));
const Dashboard = lazy(() => import('../pages/dashboard/page'));
const Profile = lazy(() => import('../pages/profile/page'));
const ProfessionalProfile = lazy(() => import('../pages/professional-profile/page'));
const AdminDashboard = lazy(() => import('../pages/admin-dashboard/page'));
const CreateAdmin = lazy(() => import('../pages/create-admin/page'));
const ConvertUserToAdmin = lazy(() => import('../pages/convert-user-to-admin/page'));
const SyncProfiles = lazy(() => import('../pages/sync-profiles/page'));
const SyncProfileStats = lazy(() => import('../pages/sync-profile-stats/page'));
const AdminDemoData = lazy(() => import('../pages/admin-demo-data/page'));
const ResetPassword = lazy(() => import('../pages/reset-password/page'));
const PaymentConfirmation = lazy(() => import('../pages/payment-confirmation/page'));
const NotFound = lazy(() => import('../pages/NotFound'));

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/services',
    element: <Services />,
  },
  {
    path: '/services/chauffeurs',
    element: <Chauffeurs />,
  },
  {
    path: '/services/artisans',
    element: <Artisans />,
  },
  {
    path: '/services/techniciens',
    element: <Techniciens />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/a-propos',
    element: <About />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '/how-it-works',
    element: <HowItWorks />,
  },
  {
    path: '/faq',
    element: <FAQ />,
  },
  {
    path: '/blog',
    element: <Blog />,
  },
  {
    path: '/carrieres',
    element: <Carrieres />,
  },
  {
    path: '/privacy',
    element: <Privacy />,
  },
  {
    path: '/cgu',
    element: <CGU />,
  },
  {
    path: '/support',
    element: <Support />,
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
  },
  {
    path: '/profile',
    element: <Profile />,
  },
  {
    path: '/professional-profile',
    element: <ProfessionalProfile />,
  },
  {
    path: '/admin-dashboard',
    element: <AdminDashboard />,
  },
  {
    path: '/create-admin',
    element: <CreateAdmin />,
  },
  {
    path: '/convert-user-to-admin',
    element: <ConvertUserToAdmin />,
  },
  {
    path: '/sync-profiles',
    element: <SyncProfiles />,
  },
  {
    path: '/sync-profile-stats',
    element: <SyncProfileStats />,
  },
  {
    path: '/admin-demo-data',
    element: <AdminDemoData />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    path: '/payment-confirmation',
    element: <PaymentConfirmation />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];

export default routes;