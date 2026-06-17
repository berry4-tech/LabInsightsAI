import { Button } from "./ui/button";
import { UserCircle, FileText, Upload, MessageSquare } from "lucide-react";

interface HeaderProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export function Header({ currentPage, onNavigate }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate("home")}>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">LabAI</span>
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-1">
          <Button 
            variant={currentPage === "profile" ? "secondary" : "ghost"} 
            className="gap-2"
            onClick={() => onNavigate("profile")}
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </Button>
          <Button 
            variant={currentPage === "reports" ? "secondary" : "ghost"} 
            className="gap-2"
            onClick={() => onNavigate("reports")}
          >
            <FileText className="h-4 w-4" />
            View Reports
          </Button>
          <Button 
            variant={currentPage === "upload" ? "secondary" : "ghost"} 
            className="gap-2"
            onClick={() => onNavigate("upload")}
          >
            <Upload className="h-4 w-4" />
            Upload Report
          </Button>
          <Button 
            variant={currentPage === "chatbot" ? "secondary" : "ghost"} 
            className="gap-2"
            onClick={() => onNavigate("chatbot")}
          >
            <MessageSquare className="h-4 w-4" />
            Chatbot
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="hidden md:inline-flex"
            onClick={() => onNavigate("signin")}
          >
            Sign In
          </Button>
          <Button onClick={() => onNavigate("getstarted")}>
            Get Started
          </Button>
        </div>
      </div>
    </header>
  );
}
