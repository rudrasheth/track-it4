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
      <footer className="border-t bg-white/50 dark:bg-background/50 backdrop-blur-sm py-4">
        <div className="container mx-auto px-6 text-center text-xs text-muted-foreground">
          <p>© 2025 TrackIT Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}