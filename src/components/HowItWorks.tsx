import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Upload, Brain, MessageCircle, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload Your Report",
    description: "Drag and drop or click to upload your lab report. We support PDF, images, and scanned documents.",
    step: "1",
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our advanced AI processes your report, extracting key metrics and analyzing all values against normal ranges.",
    step: "2",
  },
  {
    icon: MessageCircle,
    title: "Get Insights",
    description: "Receive a clear summary with explanations. Use the chatbot to ask specific questions about your results.",
    step: "3",
  },
  {
    icon: Download,
    title: "Track & Share",
    description: "Save reports to your history, track trends over time, and export summaries to share with your doctor.",
    step: "4",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 md:py-32 border-b">
      <div className="container px-4 md:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl md:text-4xl">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From upload to understanding in four simple steps
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {step.step}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-primary" />
                      <h3>{step.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-bl from-primary/20 to-transparent rounded-2xl blur-3xl" />
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1659353888477-6e6aab941b55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBhbmFseXppbmclMjByZXBvcnR8ZW58MXx8fHwxNzU5NTc5NTIxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Doctor analyzing report"
              className="relative rounded-2xl shadow-2xl w-full h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
