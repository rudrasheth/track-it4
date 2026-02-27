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
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Star,
} from "lucide-react";

export function Sidebar({ isCollapsed = false, setIsCollapsed }: { isCollapsed?: boolean, setIsCollapsed?: (val: boolean) => void }) {
  const { user, logout } = useAuth();
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [joinGroupOpen, setJoinGroupOpen] = useState(false);
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const collapsed = isCollapsed !== undefined && setIsCollapsed ? isCollapsed : localIsCollapsed;
  const setCollapsed = setIsCollapsed || setLocalIsCollapsed;
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [starredOpen, setStarredOpen] = useState(true);

  const starredLinks = [
    { to: "/student/research", icon: Star, label: "Research Papers" },
    { to: "/student/ai-assistant", icon: Star, label: "AI Assistant" },
  ];

  const studentLinks = [
    { to: "/student/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    {
      to: "/student/submissions",
      icon: FileText,
      label: "Submissions",
      subLinks: [
        { to: "/student/submissions/completed", label: "Completed" },
        { to: "/student/submissions/pending", label: "Pending" },
        { to: "/student/submissions/upcoming", label: "Upcoming" },
      ]
    },
    { to: "/student/research", icon: BookOpen, label: "Research Papers" },
    { to: "/student/ai-assistant", icon: Sparkles, label: "AI Assistant" },
    { to: "/student/virtual-professor", icon: GraduationCap, label: "Virtual Professor" },
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
    <aside className={cn("fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-300", collapsed ? "w-20" : "w-64")}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-6 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn("flex h-16 items-center border-b border-border", collapsed ? "justify-center px-0" : "px-6")}>
          <FolderKanban className="h-6 w-6 text-primary flex-shrink-0" />
          {!collapsed && <span className="ml-2 text-xl font-bold text-foreground overflow-hidden whitespace-nowrap">TrackIT</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">

          {/* Starred Section */}
          <div className="mb-6">
            {!collapsed && (
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Starred</span>
              </p>
            )}
            <div className="space-y-1">
              {starredLinks.map((link) => (
                <NavLink
                  key={link.to + "-starred"}
                  to={link.to}
                  className={cn(
                    "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                    "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed ? "justify-center px-0" : "gap-3 px-3"
                  )}
                  activeClassName="bg-primary/10 text-primary"
                  title={collapsed ? link.label : undefined}
                >
                  <link.icon className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>

          {!collapsed && (
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4">
              Main Menu
            </p>
          )}
          {user?.role === "student" && (
            <button
              onClick={() => setJoinGroupOpen(true)}
              className={cn(
                "flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors mb-2",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              )}
              title={collapsed ? "Join Group" : undefined}
            >
              <UserPlus className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Join Group</span>}
            </button>
          )}
          {user?.role === "mentor" && (
            <button
              onClick={() => setCreateGroupOpen(true)}
              className={cn(
                "flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors mb-2",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed ? "justify-center px-0" : "gap-3 px-3"
              )}
              title={collapsed ? "Create Group" : undefined}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>Create Group</span>}
            </button>
          )}
          {links.map((link) => {
            // @ts-ignore
            if (link.subLinks) {
              return (
                <div key={link.label} className="w-full">
                  <button
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                        setSubmissionsOpen(true);
                      } else {
                        setSubmissionsOpen(!submissionsOpen);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg py-2 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed ? "justify-center px-0" : "px-3"
                    )}
                    title={collapsed ? link.label : undefined}
                  >
                    <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                      <link.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{link.label}</span>}
                    </div>
                    {!collapsed && (
                      <ChevronDown className={cn("h-4 w-4 transition-transform", submissionsOpen ? "rotate-180" : "")} />
                    )}
                  </button>
                  {!collapsed && submissionsOpen && (
                    <div className="ml-4 mt-1 flex flex-col gap-1 border-l pl-4 border-border">
                      {/* @ts-ignore */}
                      {link.subLinks.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={cn(
                            "flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                            "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                          )}
                          activeClassName="text-primary font-semibold"
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={cn(
                  "flex items-center rounded-lg py-2 text-sm font-medium transition-colors mb-1",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed ? "justify-center px-0" : "gap-3 px-3"
                )}
                activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                title={collapsed ? link.label : undefined}
              >
                <link.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-4">
          <div className={cn("mb-3 flex items-center gap-3", collapsed && "justify-center")}>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {user?.avatar}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={cn(
              "flex w-full items-center rounded-lg py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
              collapsed ? "justify-center px-0" : "gap-2 px-3"
            )}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
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
