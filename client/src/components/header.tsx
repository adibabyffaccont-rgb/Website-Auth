import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  FileText,
  Users,
  DollarSign,
  LogIn,
  LogOut,
  Settings,
  Webhook,
  Ban,
  Home,
  Activity,
  Code,
  Crown,
  UserCog,
  Menu,
  X,
  Sparkles,
  Zap,
  ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { authService } from "@/lib/auth";
import { useState, useEffect } from "react";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Check if user has owner privileges
  const isOwner = (user as any)?.userPermissions?.role === 'owner';
  const canEditCode = (user as any)?.userPermissions?.permissions?.includes('edit_code') || isOwner;
  const canManageUsers = (user as any)?.userPermissions?.permissions?.includes('manage_users') || isOwner;

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      console.log("Logout button clicked");
      await authService.logout();
      // Redirect to home page after logout
      window.location.href = '/';
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if logout fails
      window.location.href = '/';
    }
  };

  if (isAuthenticated) {
    return (
      <>
        {/* Floating Navigation Bar */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${isScrolled
          ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg'
          : 'bg-transparent'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Animated Logo Section */}
              <div className="flex items-center group">
                <Link href="/" className="flex items-center space-x-4 group-hover:scale-105 transition-all duration-300 ease-out">
                  <div className="relative">
                    <img
                      src="/logo.svg"
                      alt="ADI CHEATS Logo"
                      className="h-10 w-10 rounded-full shadow-lg group-hover:rotate-12 transition-transform duration-300"
                    />
                    <div className="absolute -top-1 -right-1">
                      <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                      ADI CHEATS
                    </span>
                    <Badge className="bg-gradient-to-r from-primary/20 to-purple-600/20 text-primary border-primary/30 text-xs w-fit animate-fade-in">
                      <Crown className="h-3 w-3 mr-1" />
                      Enterprise
                    </Badge>
                  </div>
                </Link>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center space-x-2">
                <Link href="/dashboard">
                  <Button
                    variant={location === "/dashboard" ? "default" : "ghost"}
                    size="sm"
                    className={`relative overflow-hidden group transition-all duration-300 ${location === "/dashboard"
                      ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg'
                      : 'hover:bg-primary/10 hover:scale-105'
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Home className={`h-4 w-4 mr-2 transition-transform duration-200 ${location === "/dashboard" ? 'scale-110' : 'group-hover:scale-110'}`} />
                    Dashboard
                    {location === "/dashboard" && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Button>
                </Link>



                <Link href="/integration">
                  <Button
                    variant={location === "/integration" ? "default" : "ghost"}
                    size="sm"
                    className={`relative overflow-hidden group transition-all duration-300 ${location === "/integration"
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                      : 'hover:bg-indigo-600/10 hover:scale-105'
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/0 via-indigo-600/10 to-indigo-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <Code className={`h-4 w-4 mr-2 transition-transform duration-200 ${location === "/integration" ? 'scale-110' : 'group-hover:scale-110'}`} />
                    Code
                    {location === "/integration" && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Button>
                </Link>

                <Link href="/docs">
                  <Button
                    variant={location === "/docs" ? "default" : "ghost"}
                    size="sm"
                    className={`relative overflow-hidden group transition-all duration-300 ${location === "/docs"
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                      : 'hover:bg-blue-600/10 hover:scale-105'
                      }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <FileText className={`h-4 w-4 mr-2 transition-transform duration-200 ${location === "/docs" ? 'scale-110' : 'group-hover:scale-110'}`} />
                    Docs
                    {location === "/docs" && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                    )}
                  </Button>
                </Link>

                {/* Owner-specific navigation */}
                {canEditCode && (
                  <Link href="/code-editor">
                    <Button
                      variant={location === "/code-editor" ? "default" : "ghost"}
                      size="sm"
                      className={`relative overflow-hidden group transition-all duration-300 ${location === "/code-editor"
                        ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                        : 'hover:bg-orange-600/10 hover:scale-105'
                        }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-600/0 via-orange-600/10 to-orange-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <Code className={`h-4 w-4 mr-2 transition-transform duration-200 ${location === "/code-editor" ? 'scale-110' : 'group-hover:scale-110'}`} />
                      Code Editor
                      {location === "/code-editor" && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </Button>
                  </Link>
                )}

                {canManageUsers && (
                  <Link href="/user-management">
                    <Button
                      variant={location === "/user-management" ? "default" : "ghost"}
                      size="sm"
                      className={`relative overflow-hidden group transition-all duration-300 ${location === "/user-management"
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                        : 'hover:bg-emerald-600/10 hover:scale-105'
                        }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/0 via-emerald-600/10 to-emerald-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <UserCog className={`h-4 w-4 mr-2 transition-transform duration-200 ${location === "/user-management" ? 'scale-110' : 'group-hover:scale-110'}`} />
                      Users
                      {location === "/user-management" && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full animate-pulse" />
                      )}
                    </Button>
                  </Link>
                )}
              </nav>

              {/* User Actions */}
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative overflow-hidden group hover:scale-105 transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                      <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 animate-in slide-in-from-top-2 fade-in-0">
                    <DropdownMenuItem onClick={() => setLocation("/dashboard")} className="group">
                      <Home className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Dashboard
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => setLocation("/integration")} className="group">
                      <Code className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Integration Examples
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogoutClick} className="group text-red-600 focus:text-red-600">
                      <LogOut className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden relative overflow-hidden group hover:scale-105 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  ) : (
                    <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-500 ease-out ${isMobileMenuOpen
            ? 'max-h-96 opacity-100 pb-6'
            : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
            <div className="px-4 space-y-3">
              <Link href="/dashboard" className="block">
                <Button
                  variant={location === "/dashboard" ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 ${location === "/dashboard"
                    ? 'bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg scale-105'
                    : 'hover:bg-primary/10 hover:scale-102'
                    }`}
                >
                  <Home className="h-4 w-4 mr-3" />
                  Dashboard
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>



              <Link href="/integration" className="block">
                <Button
                  variant={location === "/integration" ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 ${location === "/integration"
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg scale-105'
                    : 'hover:bg-indigo-600/10 hover:scale-102'
                    }`}
                >
                  <Code className="h-4 w-4 mr-3" />
                  Integration
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link href="/docs" className="block">
                <Button
                  variant={location === "/docs" ? "default" : "ghost"}
                  className={`w-full justify-start transition-all duration-300 ${location === "/docs"
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                    : 'hover:bg-blue-600/10 hover:scale-102'
                    }`}
                >
                  <FileText className="h-4 w-4 mr-3" />
                  Documentation
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              {canEditCode && (
                <Link href="/code-editor" className="block">
                  <Button
                    variant={location === "/code-editor" ? "default" : "ghost"}
                    className={`w-full justify-start transition-all duration-300 ${location === "/code-editor"
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg scale-105'
                      : 'hover:bg-orange-600/10 hover:scale-102'
                      }`}
                  >
                    <Code className="h-4 w-4 mr-3" />
                    Code Editor
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              )}

              {canManageUsers && (
                <Link href="/user-management" className="block">
                  <Button
                    variant={location === "/user-management" ? "default" : "ghost"}
                    className={`w-full justify-start transition-all duration-300 ${location === "/user-management"
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg scale-105'
                      : 'hover:bg-emerald-600/10 hover:scale-102'
                      }`}
                  >
                    <UserCog className="h-4 w-4 mr-3" />
                    User Management
                    <ChevronRight className="h-4 w-4 ml-auto" />
                  </Button>
                </Link>
              )}

              <Button
                onClick={handleLogoutClick}
                className="w-full justify-start bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:scale-102 transition-all duration-300"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            </div>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-20 lg:h-24" />
      </>
    );
  }

  // Landing page header for non-authenticated users
  return (
    <>
      {/* Floating Navigation Bar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${isScrolled
        ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg'
        : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Animated Logo Section */}
            <div className="flex items-center group">
              <Link href="/" className="flex items-center space-x-4 group-hover:scale-105 transition-all duration-300 ease-out">
                <div className="relative">
                  <Shield className="h-10 w-10 text-primary group-hover:rotate-12 transition-transform duration-300" />
                  <div className="absolute -top-1 -right-1">
                    <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                    ADI CHEATS
                  </span>
                  <Badge className="bg-gradient-to-r from-primary/20 to-purple-600/20 text-primary border-primary/30 text-xs w-fit animate-fade-in">
                    <Crown className="h-3 w-3 mr-1" />
                    Enterprise
                  </Badge>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              <button
                onClick={() => scrollToSection('features')}
                className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 rounded-lg hover:bg-primary/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                Features
                <Zap className="h-3 w-3 ml-1 inline opacity-0 group-hover:opacity-100 transition-all duration-200" />
              </button>

              <button
                onClick={() => scrollToSection('docs')}
                className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 rounded-lg hover:bg-blue-600/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-600/5 to-blue-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <FileText className="h-3 w-3 mr-1 inline" />
                Documentation
              </button>

              <button
                onClick={() => scrollToSection('dashboard')}
                className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 rounded-lg hover:bg-green-600/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-600/0 via-green-600/5 to-green-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <Users className="h-3 w-3 mr-1 inline" />
                Dashboard
              </button>

              <button
                onClick={() => scrollToSection('pricing')}
                className="relative overflow-hidden group px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:scale-105 rounded-lg hover:bg-purple-600/5"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <DollarSign className="h-3 w-3 mr-1 inline" />
                Pricing
              </button>
            </nav>

            {/* User Actions */}
            <div className="flex items-center space-x-3">
              <Link href="/firebase-login">
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                  <LogIn className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-200" />
                  Sign In
                </Button>
              </Link>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden relative overflow-hidden group hover:scale-105 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                ) : (
                  <Menu className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div className={`lg:hidden transition-all duration-500 ease-out ${isMobileMenuOpen
            ? 'max-h-96 opacity-100 pb-6'
            : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
            <div className="px-4 space-y-3">
              <button
                onClick={() => scrollToSection('features')}
                className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-primary/5 rounded-lg hover:scale-102"
              >
                <Zap className="h-4 w-4 mr-3 inline" />
                Features
              </button>

              <button
                onClick={() => scrollToSection('docs')}
                className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-blue-600/5 rounded-lg hover:scale-102"
              >
                <FileText className="h-4 w-4 mr-3 inline" />
                Documentation
              </button>

              <button
                onClick={() => scrollToSection('dashboard')}
                className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-green-600/5 rounded-lg hover:scale-102"
              >
                <Users className="h-4 w-4 mr-3 inline" />
                Dashboard
              </button>

              <button
                onClick={() => scrollToSection('pricing')}
                className="w-full text-left px-4 py-3 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-300 hover:bg-purple-600/5 rounded-lg hover:scale-102"
              >
                <DollarSign className="h-4 w-4 mr-3 inline" />
                Pricing
              </button>

              <Link href="/firebase-login" className="block">
                <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg hover:shadow-xl hover:scale-102 transition-all duration-300">
                  <LogIn className="h-4 w-4 mr-3" />
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-20 lg:h-24" />

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogoutConfirm} className="bg-red-600 hover:bg-red-700">
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
