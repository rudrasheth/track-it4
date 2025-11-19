import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function UserNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // Get initials (e.g., "Rudra Sheth" -> "R")
  const initial = user?.user_metadata?.full_name?.[0]?.toUpperCase() || "U";

  return (
    <div className="flex items-center gap-4">
      {/* User Name (Hidden on small screens) */}
      <div className="hidden md:flex flex-col items-end">
         <span className="text-sm font-medium">
            {user?.user_metadata?.full_name || "User"}
         </span>
         <span className="text-xs text-muted-foreground">
            {user?.email}
         </span>
      </div>

      {/* Avatar Circle */}
      <Avatar className="h-8 w-8 border">
        <AvatarFallback className="bg-primary/10 text-primary">
            {initial}
        </AvatarFallback>
      </Avatar>

      {/* Logout Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleLogout} 
        title="Log out"
        className="text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
}