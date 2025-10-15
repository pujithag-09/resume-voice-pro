import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Mic, FileText, BarChart3 } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20 animate-gradient-shift bg-[length:200%_200%]" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 backdrop-blur-sm border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Interview Assistant</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
            Ace Your Next Interview
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Practice with AI-generated questions tailored to your resume. Get instant feedback on your responses and improve your interview skills.
          </p>

          <Button 
            onClick={() => navigate("/choose-area")}
            size="lg"
            className="bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg px-8 py-6 rounded-full group"
          >
            Get Started
            <Sparkles className="ml-2 w-5 h-5 group-hover:rotate-12 transition-transform" />
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-24">
          <FeatureCard
            icon={<Mic className="w-8 h-8 text-primary" />}
            title="Voice Recording"
            description="Practice with realistic voice-based interviews. Our system captures and analyzes your responses in real-time."
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8 text-secondary" />}
            title="AI Evaluation"
            description="Get intelligent feedback on clarity, content, confidence, and structure from our advanced AI model."
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8 text-accent" />}
            title="Detailed Reports"
            description="Receive comprehensive performance reports with actionable insights to improve your interview skills."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => {
  return (
    <div className="group p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-scale-in">
      <div className="w-16 h-16 rounded-xl bg-gradient-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Landing;
