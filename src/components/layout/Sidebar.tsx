import { useState } from "react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { CreateGroupModal } from "@/components/CreateGroupModal";
import { JoinGroupModal } from "@/components/JoinGroupModal";
import { SidebarGeminiBot } from "@/components/SidebarGeminiBot";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Bell,
  Settings,
  LogOut,
  FolderKanban,
  BarChart3,
  FileText,
  Plus,
  Send,
  UserPlus,
  Sparkles,
} from "lucide-react";

export function Sidebar() {
  const { user, logout } = useAuth();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);

  const studentLinks = [
    { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/student/tasks", icon: ClipboardList, label: "Tasks" },
    { to: "/student/submissions", icon: FileText, label: "Submissions" },
    { to: "/student/ai-assistant", icon: Sparkles, label: "AI Assistant" },
  ];

  const mentorLinks = [
    { to: "/mentor/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/mentor/groups", icon: Users, label: "My Groups" },
    { to: "/mentor/notices", icon: Bell, label: "Notices" },
    { to: "/mentor/tasks/assign", icon: Send, label: "Assign Task" },
    { to: "/mentor/analytics", icon: BarChart3, label: "Analytics" },

  ];

  const adminLinks = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/users", icon: Users, label: "Users" },
    { to: "/admin/groups", icon: FolderKanban, label: "Groups" },
    { to: "/admin/settings", icon: Settings, label: "Settings" },
  ];

  const links =
    user?.role === "student"
      ? studentLinks
      : user?.role === "mentor"
      ? mentorLinks
      : adminLinks;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <FolderKanban className="mr-2 h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-foreground">TrackIT</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {user?.role === "student" && (
            <button
              onClick={() => setJoinGroupOpen(true)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <UserPlus className="h-5 w-5" />
              <span>Join Group</span>
            </button>
          )}
          {user?.role === "mentor" && (
            <button
              onClick={() => setCreateGroupOpen(true)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Plus className="h-5 w-5" />
              <span>Create Group</span>
            </button>
          )}
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            >
              <link.icon className="h-5 w-5" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {user?.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {user?.role === "mentor" && (
        <CreateGroupModal open={createGroupOpen} onOpenChange={setCreateGroupOpen} />
      )}
      {user?.role === "student" && (
        <JoinGroupModal open={joinGroupOpen} onOpenChange={setJoinGroupOpen} />
      )}
    </aside>
  );
}
