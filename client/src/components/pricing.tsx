import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Perfect for testing and small projects",
    features: [
      "Up to 100 users",
      "1,000 API requests/month",
      "Basic support",
      "C# integration examples"
    ],
    buttonText: "Get Started Free",
    buttonVariant: "outline" as const,
    popular: false
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For growing applications and businesses",
    features: [
      "Up to 10,000 users",
      "50,000 API requests/month",
      "Priority support",
      "Advanced admin dashboard",
      "Custom rate limiting"
    ],
    buttonText: "Start Pro Trial",
    buttonVariant: "default" as const,
    popular: true
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "/month",
    description: "For large-scale applications",
    features: [
      "Unlimited users",
      "Unlimited API requests",
      "24/7 dedicated support",
      "Custom integrations",
      "SLA guarantee"
    ],
    buttonText: "Contact Sales",
    buttonVariant: "secondary" as const,
    popular: false
  }
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-secondary-custom max-w-2xl mx-auto">
            Start free and scale as you grow. No hidden fees, no surprises.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`shadow-sm relative ${
                plan.popular ? 'border-2 border-primary shadow-lg' : 'border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-white px-4 py-1">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-slate-800 mb-2">
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-slate-800 mb-4">
                  {plan.price}
                  <span className="text-lg text-secondary-custom">{plan.period}</span>
                </div>
                <p className="text-secondary-custom">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-accent-custom mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.buttonVariant === 'default' 
                      ? 'bg-primary text-white hover:bg-primary/90' 
                      : plan.buttonVariant === 'outline'
                      ? 'bg-gray-100 text-slate-800 hover:bg-gray-200'
                      : 'bg-slate-800 text-white hover:bg-slate-900'
                  }`}
                  variant={plan.buttonVariant}
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
