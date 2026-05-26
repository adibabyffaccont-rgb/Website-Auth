import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Activity, BarChart3, AlertTriangle, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <section id="dashboard" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Admin Dashboard
          </h2>
          <p className="text-xl text-secondary-custom max-w-2xl mx-auto">
            Manage your users, monitor authentication activity, and control access
          </p>
        </div>

        {/* Dashboard Demo */}
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
          {/* Dashboard Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">User Management</h3>
              <p className="text-secondary-custom">Manage your registered users and their access</p>
            </div>
            <Link href="/admin">
              <Button className="bg-primary text-white hover:bg-primary/90 mt-4 md:mt-0">
                <Plus className="h-4 w-4 mr-2" />
                Go to Admin Panel
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-custom text-sm">Total Users</p>
                    <p className="text-2xl font-bold text-slate-800">1,247</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-custom" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-custom text-sm">Active Sessions</p>
                    <p className="text-2xl font-bold text-slate-800">342</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-accent-custom" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-custom text-sm">API Requests</p>
                    <p className="text-2xl font-bold text-slate-800">15,678</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-secondary-custom text-sm">Failed Logins</p>
                    <p className="text-2xl font-bold text-slate-800">23</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Users Table Preview */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <CardTitle>Recent Users</CardTitle>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <Input placeholder="Search users..." className="w-48" />
                  <select className="border border-gray-300 rounded-lg px-4 py-2 text-sm">
                    <option>All Status</option>
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-custom font-medium text-sm">JD</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-800">john_doe</div>
                          <div className="text-sm text-secondary-custom">ID: 12345</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-secondary-custom">john@example.com</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell className="text-secondary-custom">2 hours ago</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium text-sm">AS</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-800">alice_smith</div>
                          <div className="text-sm text-secondary-custom">ID: 12346</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-secondary-custom">alice@example.com</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                    <TableCell className="text-secondary-custom">1 day ago</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button size="sm" variant="destructive">Delete</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
