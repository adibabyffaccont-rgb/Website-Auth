import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import Home from "@/pages/home";
import Admin from "@/pages/admin";
import Dashboard from "@/pages/dashboard";
import AppManagement from "@/pages/app-management";
import Documentation from "@/pages/documentation";
import IntegrationExamples from "@/pages/integration-examples-new";
import CodeEditor from "@/pages/code-editor";
import UserManagement from "@/pages/user-management";
import LicenseKeys from "@/pages/license-keys";
import SimpleLogin from "@/pages/simple-login";
import ResellerDashboard from "@/pages/reseller-dashboard";
import Landing from "@/pages/landing";
import CustomMessages from "@/pages/custom-messages";
import NotFound from "@/pages/not-found";
import DiscordConnect from "@/pages/discord-connect";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {/* Reseller Routes - Protected */}
      <Route path="/reseller/dashboard">
        {isAuthenticated && user?.role === 'reseller' ? <ResellerDashboard /> : <Redirect to="/" />}
      </Route>

      {/* Shared Routes (Accessible by Admin OR Reseller) */}
      <Route path="/app/:id" component={AppManagement} />
      <Route path="/app/:id/licenses" component={LicenseKeys} />

      {!isAuthenticated ? (
        <>
          <Route path="/" component={SimpleLogin} />
          <Route path="/login" component={SimpleLogin} />
          <Route path="/admin-login" component={Admin} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/discord-connect" component={DiscordConnect} />
        </>
      ) : (
        <>
          <Route path="/">
            {user?.role === 'reseller' ? <ResellerDashboard /> : <Dashboard />}
          </Route>
          <Route path="/dashboard">
            {user?.role === 'reseller' ? <ResellerDashboard /> : <Dashboard />}
          </Route>
          <Route path="/integration" component={IntegrationExamples} />
          <Route path="/docs" component={Documentation} />
          <Route path="/code-editor" component={CodeEditor} />
          <Route path="/user-management" component={UserManagement} />
          <Route path="/custom-messages" component={CustomMessages} />
          <Route path="/admin-login" component={Admin} />
          <Route path="/discord-connect" component={DiscordConnect} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
