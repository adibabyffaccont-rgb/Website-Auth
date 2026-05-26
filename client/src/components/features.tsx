import { Card, CardContent } from "@/components/ui/card";
import { Plug, Shield, Gauge, Key, Clock, Database } from "lucide-react";

const features = [
  {
    icon: Plug,
    title: "Easy C# Integration",
    description: "Simple REST API calls that work perfectly with C# WinForms. Complete with examples and sample code.",
    color: "bg-blue-100 text-primary-custom"
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Industry-standard password hashing, API key authentication, and rate limiting built-in.",
    color: "bg-green-100 text-accent-custom"
  },
  {
    icon: Gauge,
    title: "Admin Dashboard",
    description: "Manage users, view analytics, and monitor your application's authentication in real-time.",
    color: "bg-orange-100 text-orange-500"
  },
  {
    icon: Key,
    title: "API Key System",
    description: "Secure your endpoints with API keys. Easy to generate, manage, and revoke access when needed.",
    color: "bg-purple-100 text-purple-500"
  },
  {
    icon: Clock,
    title: "Rate Limiting",
    description: "Built-in protection against abuse with configurable rate limits per API key or IP address.",
    color: "bg-green-100 text-green-500"
  },
  {
    icon: Database,
    title: "JSON Responses",
    description: "Clean, consistent JSON responses that are easy to parse in C# with clear error messages.",
    color: "bg-blue-100 text-blue-500"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Everything You Need for Authentication
          </h2>
          <p className="text-xl text-secondary-custom max-w-2xl mx-auto">
            Built specifically for developers who need reliable, secure authentication without the complexity
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mb-4`}>
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-secondary-custom">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
