import { NotificationBell } from "@/components/NotificationBell";
import { UserNav } from "@/components/layout/UserNav";

export function Topbar() {
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6 shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-lg text-primary">
        TrackIT
      </div>

      <div className="ml-auto flex items-center gap-4">
        <NotificationBell />
        <UserNav /> 
      </div>
    </header>
  );
}