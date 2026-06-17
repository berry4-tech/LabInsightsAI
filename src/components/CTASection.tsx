import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-primary/5 to-secondary/30">
      <div className="container px-4 md:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 to-transparent rounded-2xl blur-3xl" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758202292826-c40e172eed1c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnRpZmljaWFsJTIwaW50ZWxsaWdlbmNlJTIwaGVhbHRoY2FyZXxlbnwxfHx8fDE3NTk1Nzk1MjF8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="AI Healthcare Technology"
              className="relative rounded-2xl shadow-2xl w-full h-auto object-cover"
            />
          </div>

          <div className="space-y-6 order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl">
              Take Control of Your Health Today
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of users who are already using LabAI to better understand 
              their health. Get started for free and upload your first report in seconds.
            </p>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>No credit card required</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Free trial with 3 report analyses</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <span>Cancel anytime, no questions asked</span>
              </li>
            </ul>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="gap-2">
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
