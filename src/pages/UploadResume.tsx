import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";

const UploadResume = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || "technical";
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      toast.success("Resume uploaded successfully!");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      toast.success("Resume uploaded successfully!");
    }
  };

  const validateFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF or DOC file");
      return false;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return false;
    }
    
    return true;
  };

  const handleContinue = () => {
    if (!file) {
      toast.error("Please upload your resume first");
      return;
    }
    
    // In a real app, this would parse the resume and generate questions
    navigate("/interview", { state: { category, resumeFile: file } });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        <Button
          variant="ghost"
          onClick={() => navigate("/choose-area")}
          className="mb-8 hover:bg-card/50"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Upload Your Resume
            </h1>
            <p className="text-xl text-muted-foreground">
              We'll analyze your resume to generate personalized {category} interview questions
            </p>
          </div>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative p-12 rounded-2xl border-2 border-dashed transition-all duration-300 animate-scale-in ${
              isDragging
                ? "border-primary bg-primary/10"
                : file
                ? "border-primary/50 bg-card/50"
                : "border-border bg-card/30 hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              id="resume-upload"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {file ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-gradient-primary flex items-center justify-center">
                  <Check className="w-10 h-10" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-1">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  className="mt-4"
                >
                  Remove File
                </Button>
              </div>
            ) : (
              <label htmlFor="resume-upload" className="cursor-pointer">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-primary/20 flex items-center justify-center">
                    <Upload className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold mb-2">
                      Drop your resume here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, DOC, DOCX (Max 10MB)
                    </p>
                  </div>
                </div>
              </label>
            )}
          </div>

          {file && (
            <Button
              onClick={handleContinue}
              className="w-full mt-8 bg-gradient-primary hover:shadow-glow-primary transition-all duration-300 text-lg py-6 rounded-full"
            >
              Continue to Interview
              <FileText className="ml-2 w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadResume;
