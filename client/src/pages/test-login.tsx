import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { Shield, LogIn, CheckCircle, XCircle } from "lucide-react";
import { Link } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  api_key: z.string().min(1, "API key is required"),
});

export default function TestLogin() {
  const [loginResult, setLoginResult] = useState<any>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      api_key: "test-api-key-123",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginSchema>) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      return { ...result, status: response.status };
    },
    onSuccess: (data) => {
      setLoginResult(data);
      if (data.success) {
        toast({ 
          title: "Success", 
          description: "Login successful!",
          variant: "default"
        });
      } else {
        toast({ 
          title: "Error", 
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: "Network error occurred",
        variant: "destructive"
      });
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setLoginResult(null);
    loginMutation.mutate(values);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-primary-custom mr-3" />
            <span className="text-2xl font-bold text-slate-800">AuthAPI</span>
          </Link>
          <h2 className="text-3xl font-bold text-slate-800">Test Login</h2>
          <p className="mt-2 text-secondary-custom">
            Test your authentication credentials
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <LogIn className="h-5 w-5 mr-2" />
              Login Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter username" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password"
                          placeholder="Enter password" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter API key" 
                          {...field} 
                          disabled={loginMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white hover:bg-primary/90"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Testing Login...' : 'Test Login'}
                </Button>
              </form>
            </Form>

            {loginResult && (
              <div className={`mt-6 p-4 rounded-lg border ${
                loginResult.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center mb-3">
                  {loginResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mr-2" />
                  )}
                  <span className={`font-semibold ${
                    loginResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {loginResult.success ? 'Login Successful' : 'Login Failed'}
                  </span>
                </div>
                
                <div className="text-sm space-y-2">
                  <p className={loginResult.success ? 'text-green-700' : 'text-red-700'}>
                    <strong>Message:</strong> {loginResult.message}
                  </p>
                  
                  {loginResult.success && (
                    <>
                      <p className="text-green-700">
                        <strong>User ID:</strong> {loginResult.user_id}
                      </p>
                      <p className="text-green-700">
                        <strong>Session Token:</strong> {loginResult.session_token?.substring(0, 20)}...
                      </p>
                    </>
                  )}
                  
                  <p className={loginResult.success ? 'text-green-700' : 'text-red-700'}>
                    <strong>HTTP Status:</strong> {loginResult.status}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/register" className="text-primary-custom hover:underline">
                    Create User Here
                  </Link>
                </p>
              </div>
              
              <div className="text-center">
                <Link href="/admin">
                  <Button variant="outline" className="w-full">
                    Go to Admin Panel
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}