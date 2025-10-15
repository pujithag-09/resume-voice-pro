import { useNavigate } from "react-router-dom";
import { Code, MessageSquare, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ChooseArea = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: "technical",
      title: "Technical",
      description: "Test your coding skills, algorithms, and technical problem-solving abilities",
      icon: <Code className="w-12 h-12" />,
      gradient: "from-primary to-primary/60",
    },
    {
      id: "behavioral",
      title: "Behavioral",
      description: "Practice answering questions about your experience, teamwork, and professional situations",
      icon: <Users className="w-12 h-12" />,
      gradient: "from-secondary to-secondary/60",
    },
    {
      id: "communication",
      title: "Communication",
      description: "Improve your presentation skills, clarity, and professional communication",
      icon: <MessageSquare className="w-12 h-12" />,
      gradient: "from-accent to-accent/60",
    },
  ];

  const handleCategorySelect = (categoryId: string) => {
    navigate("/upload-resume", { state: { category: categoryId } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8 hover:bg-card/50"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <div className="max-w-4xl mx-auto text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Choose Your Interview Focus
          </h1>
          <p className="text-xl text-muted-foreground">
            Select the area you'd like to practice today
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="group p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border hover:border-primary transition-all duration-300 hover:shadow-xl hover:-translate-y-2 text-left animate-scale-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {category.icon}
              </div>
              <h3 className="text-2xl font-bold mb-3">{category.title}</h3>
              <p className="text-muted-foreground">{category.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChooseArea;
