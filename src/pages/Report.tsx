import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, RotateCcw, TrendingUp, TrendingDown, CheckCircle2 } from "lucide-react";

const Report = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { category, answers } = location.state || { category: "technical", answers: [] };

  // Mock performance data - in real app, this would come from AI evaluation
  const metrics = {
    overall: 78,
    clarity: 85,
    content: 75,
    confidence: 72,
    structure: 80,
  };

  const stats = {
    questionsAnswered: answers.length || 3,
    averageTime: answers.length > 0 
      ? Math.round(answers.reduce((acc: number, a: any) => acc + a.duration, 0) / answers.length)
      : 120,
  };

  const strengths = [
    "Clear and concise communication",
    "Strong technical foundation",
    "Good use of real-world examples",
  ];

  const improvements = [
    "Provide more specific metrics and results",
    "Structure responses using STAR method",
    "Reduce filler words and pauses",
  ];

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span className="text-sm">Interview Complete</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold">
              Performance Report
            </h1>
            <p className="text-xl text-muted-foreground capitalize">
              {category} Interview Assessment
            </p>
          </div>

          {/* Overall Score */}
          <div className="p-8 rounded-2xl bg-gradient-primary text-center space-y-4 animate-scale-in">
            <p className="text-lg opacity-90">Overall Score</p>
            <p className="text-6xl font-bold">{metrics.overall}%</p>
            <p className="text-sm opacity-80">Great performance! Keep up the good work.</p>
          </div>

          {/* Metrics Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            <MetricCard title="Clarity" value={metrics.clarity} />
            <MetricCard title="Content" value={metrics.content} />
            <MetricCard title="Confidence" value={metrics.confidence} />
            <MetricCard title="Structure" value={metrics.structure} />
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border animate-scale-in">
              <p className="text-muted-foreground mb-2">Questions Answered</p>
              <p className="text-3xl font-bold">{stats.questionsAnswered}</p>
            </div>
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border animate-scale-in">
              <p className="text-muted-foreground mb-2">Average Response Time</p>
              <p className="text-3xl font-bold">
                {Math.floor(stats.averageTime / 60)}:{(stats.averageTime % 60).toString().padStart(2, "0")}
              </p>
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border space-y-4 animate-scale-in">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-5 h-5" />
                <h3 className="text-xl font-semibold">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border space-y-4 animate-scale-in">
              <div className="flex items-center gap-2 text-secondary">
                <TrendingDown className="w-5 h-5" />
                <h3 className="text-xl font-semibold">Areas for Improvement</h3>
              </div>
              <ul className="space-y-2">
                {improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={() => navigate("/")}
              className="flex-1 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg py-6 rounded-full"
            >
              <RotateCcw className="mr-2 w-5 h-5" />
              Start New Interview
            </Button>
            <Button
              variant="outline"
              className="flex-1 text-lg py-6 rounded-full border-primary/50 hover:bg-primary/10"
            >
              <Download className="mr-2 w-5 h-5" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value }: { title: string; value: number }) => {
  return (
    <div className="p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border space-y-3 animate-scale-in">
      <div className="flex justify-between items-center">
        <p className="text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold">{value}%</p>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
};

export default Report;
