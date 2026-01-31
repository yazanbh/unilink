import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FirebaseAuthProvider } from "./contexts/FirebaseAuthContext";
import "@/lib/i18n";
import { Suspense, lazy } from "react";

// Loading Component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

// Lazy load pages for better performance
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const LinksManager = lazy(() => import("./pages/LinksManager"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Settings = lazy(() => import("./pages/Settings"));
const Subscriptions = lazy(() => import("./pages/Subscriptions"));
const PublicProfile = lazy(() => import("./pages/PublicProfile"));
// ThemeCustomizer is now integrated into Profile page

// Lazy load admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminContent = lazy(() => import("./pages/admin/AdminContent"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

// Import DashboardLayout normally as it's used in many places
import DashboardLayout from "./components/DashboardLayout";

function Router() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/">
        <Suspense fallback={<PageLoader />}>
          <Home />
        </Suspense>
      </Route>
      <Route path="/login">
        <Suspense fallback={<PageLoader />}>
          <Login />
        </Suspense>
      </Route>
      <Route path="/register">
        <Suspense fallback={<PageLoader />}>
          <Register />
        </Suspense>
      </Route>
      <Route path="/forgot-password">
        <Suspense fallback={<PageLoader />}>
          <ForgotPassword />
        </Suspense>
      </Route>
      
      {/* Dashboard Routes wrapped in DashboardLayout */}
      <Route path="/dashboard">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Dashboard />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/profile">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Profile />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/links">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <LinksManager />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/analytics">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Analytics />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/subscriptions">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Subscriptions />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/dashboard/settings">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <Settings />
          </Suspense>
        </DashboardLayout>
      </Route>
      {/* ThemeCustomizer is now integrated into Profile page */}
      
      {/* Admin Routes */}
      <Route path="/admin">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AdminDashboard />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/admin/users">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AdminUsers />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/admin/analytics">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AdminAnalytics />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/admin/content">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AdminContent />
          </Suspense>
        </DashboardLayout>
      </Route>
      <Route path="/admin/settings">
        <DashboardLayout>
          <Suspense fallback={<PageLoader />}>
            <AdminSettings />
          </Suspense>
        </DashboardLayout>
      </Route>
      
      {/* Public Profile - Must be last before 404 */}
      <Route path="/:username">
        <Suspense fallback={<PageLoader />}>
          <PublicProfile />
        </Suspense>
      </Route>
      
      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FirebaseAuthProvider>
          <TooltipProvider>
            <Toaster position="top-center" />
            <Router />
          </TooltipProvider>
        </FirebaseAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
