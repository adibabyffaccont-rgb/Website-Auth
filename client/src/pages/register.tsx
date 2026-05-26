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
import { Shield, UserPlus, CheckCircle } from "lucide-react";
import { Link } from "wouter";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address"),
  api_key: z.string().min(1, "API key is required"),
});

export default function Register() {
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [userId, setUserId] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      api_key: "test-api-key-123",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerSchema>) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }
      return result;
    },
    onSuccess: (data) => {
      setUserId(data.user_id);
      setRegistrationSuccess(true);
      toast({ 
        title: "Success", 
        description: "User registered successfully!",
        variant: "default"
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(values);
  };

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="border-green-200 shadow-lg">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">
                Registration Successful!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>User ID:</strong> {userId}
                </p>
                <p className="text-sm text-green-800 mt-1">
                  Please save this User ID for your records.
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Your account has been created successfully. You can now use these credentials to login through your C# application.
                </p>
                
                <div className="flex flex-col space-y-2">
                  <Link href="/test-login">
                    <Button className="w-full bg-primary text-white hover:bg-primary/90">
                      Test Login
                    </Button>
                  </Link>
                  <Link href="/admin">
                    <Button variant="outline" className="w-full">
                      Go to Admin Panel
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button variant="ghost" className="w-full">
                      Back to Home
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-primary-custom mr-3" />
            <span className="text-2xl font-bold text-slate-800">AuthAPI</span>
          </Link>
          <h2 className="text-3xl font-bold text-slate-800">Create New User</h2>
          <p className="mt-2 text-secondary-custom">
            Register a new user for your application
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-center">
              <UserPlus className="h-5 w-5 mr-2" />
              User Registration
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
                          disabled={registerMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter email address" 
                          {...field} 
                          disabled={registerMutation.isPending}
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
                          disabled={registerMutation.isPending}
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
                          disabled={registerMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                      <p className="text-sm text-gray-500">
                        Default test key: test-api-key-123
                      </p>
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-primary text-white hover:bg-primary/90"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/test-login" className="text-primary-custom hover:underline">
                  Test Login Here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}