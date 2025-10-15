import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Mic, Square, Play } from "lucide-react";
import { toast } from "sonner";

// Mock questions - in real app, these would be AI-generated based on resume
const mockQuestions = {
  technical: [
    "Explain the difference between var, let, and const in JavaScript",
    "What is the Virtual DOM and how does React use it?",
    "Describe your experience with REST APIs and microservices",
  ],
  behavioral: [
    "Tell me about a time when you faced a challenging project deadline",
    "Describe a situation where you had to work with a difficult team member",
    "How do you prioritize tasks when working on multiple projects?",
  ],
  communication: [
    "How would you explain a complex technical concept to a non-technical person?",
    "Describe your approach to giving and receiving feedback",
    "Tell me about a presentation you gave that went particularly well",
  ],
};

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || "technical";
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [answers, setAnswers] = useState<Array<{ question: string; duration: number }>>([]);

  const questions = mockQuestions[category as keyof typeof mockQuestions] || mockQuestions.technical;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setAnswers([...answers, { question: questions[currentQuestion], duration: recordingTime }]);
      toast.success("Answer recorded!");
    } else {
      // Start recording
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const handleNext = () => {
    if (!isRecording && recordingTime === 0) {
      toast.error("Please record your answer first");
      return;
    }

    if (isRecording) {
      toggleRecording();
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setRecordingTime(0);
    } else {
      // All questions answered, go to report
      navigate("/report", { 
        state: { 
          category, 
          answers: [...answers, { question: questions[currentQuestion], duration: recordingTime }]
        } 
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => navigate("/upload-resume")}
          className="mb-8 hover:bg-card/50"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* Progress */}
          <div className="space-y-2 animate-fade-in">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border animate-scale-in">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {questions[currentQuestion]}
            </h2>
          </div>

          {/* Recording Interface */}
          <div className="p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border space-y-6 animate-scale-in">
            <div className="flex flex-col items-center space-y-6">
              <button
                onClick={toggleRecording}
                className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isRecording
                    ? "bg-destructive hover:bg-destructive/90 animate-pulse-glow"
                    : "bg-gradient-primary hover:shadow-glow-primary"
                }`}
              >
                {isRecording ? (
                  <Square className="w-12 h-12" />
                ) : recordingTime > 0 ? (
                  <Play className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </button>

              <div className="text-center">
                <p className="text-4xl font-bold font-mono mb-2">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-muted-foreground">
                  {isRecording ? "Recording..." : recordingTime > 0 ? "Recording saved" : "Click to start recording"}
                </p>
              </div>
            </div>

            <Button
              onClick={handleNext}
              className="w-full bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg py-6 rounded-full"
              disabled={!isRecording && recordingTime === 0}
            >
              {currentQuestion < questions.length - 1 ? "Next Question" : "Generate Report"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interview;
