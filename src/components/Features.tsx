import { Upload, MessageSquare, Clock, Shield, TrendingUp, FileText } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const features = [
  {
    icon: Upload,
    title: "Easy Upload",
    description: "Simply upload your lab report in PDF, image, or any common format. Our system handles the rest.",
  },
  {
    icon: MessageSquare,
    title: "AI Chatbot",
    description: "Ask questions about your results. Get instant answers in plain language you can understand.",
  },
  {
    icon: Clock,
    title: "Instant Analysis",
    description: "Receive comprehensive summaries within seconds. No more waiting for doctor appointments.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description: "Your health data is encrypted and never shared. HIPAA-compliant security standards.",
  },
  {
    icon: TrendingUp,
    title: "Track Trends",
    description: "Monitor how your health metrics change over time with intelligent trend analysis.",
  },
  {
    icon: FileText,
    title: "Report History",
    description: "Access all your previous reports in one place. Compare results and track progress.",
  },
];

export function Features() {
  return (
    <section className="py-20 md:py-32 bg-secondary/20">
      <div className="container px-4 md:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl">Powerful Features for Better Health Insights</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to understand and manage your lab results effectively
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="p-6 space-y-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3>{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
