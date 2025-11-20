import { GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-background dark:to-muted/20">
      {/* --- HEADER --- */}
      <header className="container mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo Area */}
        <Link to="/" className="flex items-center gap-2 font-bold text-2xl text-primary tracking-tight hover:opacity-90 transition-opacity">
          <div className="p-2 bg-primary/10 rounded-lg">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          TrackIT
        </Link>
        
        {/* Tagline (Visible on larger screens) */}
        <div className="text-sm font-medium text-muted-foreground hidden md:block">
          Streamlining Student-Mentor Collaboration
        </div>
      </header>

      {/* --- MAIN CONTENT (The Form) --- */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
           {children}
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="border-t bg-white/50 dark:bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            
            {/* About Section */}
            <div className="col-span-1 md:col-span-2 space-y-4">
              <div className="flex items-center gap-2 font-bold text-lg text-foreground">
                <GraduationCap className="h-5 w-5" /> TrackIT
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                TrackIT is the ultimate project management platform designed for universities. 
                We help students stay organized and enable mentors to provide real-time feedback, 
                ensuring every project reaches its full potential.
              </p>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-primary cursor-pointer transition-colors">Features</span></li>
                <li><span className="hover:text-primary cursor-pointer transition-colors">For Students</span></li>
                <li><span className="hover:text-primary cursor-pointer transition-colors">For Mentors</span></li>
              </ul>
            </div>

            {/* Support Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><span className="hover:text-primary cursor-pointer transition-colors">Help Center</span></li>
                <li><span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span></li>
                <li><span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <p>© 2025 TrackIT Inc. All rights reserved.</p>
            <p className="flex items-center gap-1">
              Built with <span className="text-red-500"></span> for better education.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}