import { Button } from "./ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="container px-4 md:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm">Powered by Advanced AI</span>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl">
                Understand Your Lab Results in Seconds
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Get instant, easy-to-understand explanations of your medical lab reports. 
                Our AI-powered interpreter breaks down complex medical jargon into clear, 
                actionable insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2">
                Upload Your Report
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Watch Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <div className="text-2xl">50K+</div>
                <div className="text-sm text-muted-foreground">Reports Analyzed</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-2xl">98%</div>
                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <div className="text-2xl">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl blur-3xl" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1758206523917-ebcf4a571e60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwbGFib3JhdG9yeSUyMHNjaWVuY2V8ZW58MXx8fHwxNzU5NTc5NTIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Medical laboratory"
              className="relative rounded-2xl shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
