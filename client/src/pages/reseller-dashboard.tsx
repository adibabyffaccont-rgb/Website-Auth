import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import header from "@/components/header";
import { Shield, Users, Key, Settings, LogOut, ArrowRight, LayoutDashboard } from "lucide-react";
import { executeCompleteLogout } from "@/utils/logoutHandler";

export default function ResellerDashboard() {
    const [, setLocation] = useLocation();
    const [reseller, setReseller] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    useEffect(() => {
        // Load reseller session
        const sessionStr = sessionStorage.getItem('resellerSession');
        if (!sessionStr) {
            setLocation('/');
            return;
        }

        try {
            const session = JSON.parse(sessionStr);
            setReseller({ email: session.email });
            setApplications(session.applications || []);
        } catch (e) {
            console.error("Invalid session", e);
            setLocation('/');
        }
    }, [setLocation]);

    const handleLogoutClick = () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            // Remove reseller session first
            sessionStorage.removeItem('resellerSession');

            // Execute complete logout (clears all auth state, sessions, cookies, but preserves saved credentials)
            await executeCompleteLogout();
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback: force redirect even if logout fails
            window.location.href = '/';
        }
    };

    if (!reseller) return null;

    return (
        <>
            <div className="min-h-screen bg-background">
                {/* Custom Header for Reseller */}
                <header className="border-b">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <span className="font-bold text-xl">Reseller Portal</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">Logged in as {reseller.email}</span>
                            <Button variant="ghost" size="sm" onClick={handleLogoutClick}>
                                <LogOut className="h-4 w-4 mr-2" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                            <p className="text-muted-foreground mt-2">
                                Manage your assigned applications and licenses.
                            </p>
                        </div>
                    </div>

                    {applications.length === 0 ? (
                        <Card className="text-center p-8">
                            <CardContent>
                                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Applications Found</h3>
                                <p className="text-sm text-muted-foreground">
                                    You haven't been assigned any applications yet. Please contact the administrator.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {applications.map((app) => (
                                <Card key={app.applicationId} className="hover:border-primary/50 transition-colors">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            {app.applicationName}
                                            <span className={`text-xs px-2 py-1 rounded-full ${app.role === 'administrator' ? 'bg-primary/10 text-primary' :
                                                app.role === 'reseller' ? 'bg-blue-500/10 text-blue-500' :
                                                    'bg-gray-500/10 text-gray-500'
                                                }`}>
                                                {app.role.charAt(0).toUpperCase() + app.role.slice(1)}
                                            </span>
                                        </CardTitle>
                                        <CardDescription>{app.applicationDescription || 'No description'}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                                <Key className="h-4 w-4 text-muted-foreground" />
                                                <span>Manage Licenses</span>
                                            </div>
                                            <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>Manage Users</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            onClick={() => setLocation(`/app/${app.applicationId}`)}
                                        >
                                            Manage Application
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </div>

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
