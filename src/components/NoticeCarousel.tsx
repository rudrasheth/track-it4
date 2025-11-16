import { useState, useEffect } from "react";
import { mockNotices } from "@/lib/mockData";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Pin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { format } from "date-fns";

export function NoticeCarousel() {
  const pinnedNotices = mockNotices.filter((n) => n.isPinned);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (pinnedNotices.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % pinnedNotices.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [pinnedNotices.length]);

  if (pinnedNotices.length === 0) return null;

  const notice = pinnedNotices[current];

  return (
    <Card className="relative overflow-hidden bg-gradient-to-r from-primary/10 to-chart-1/10 p-4">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant="default" className="gap-1">
          <Pin className="h-3 w-3" />
          Pinned
        </Badge>
        <span className="text-xs text-muted-foreground">
          {format(new Date(notice.createdAt), "MMM dd, yyyy")}
        </span>
      </div>

      <h3 className="mb-2 font-semibold text-foreground">{notice.title}</h3>
      <p className="text-sm text-muted-foreground">{notice.content}</p>

      {pinnedNotices.length > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-1">
            {pinnedNotices.map((_, idx) => (
              <button
                key={idx}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  idx === current ? "bg-primary" : "bg-muted"
                }`}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() =>
                setCurrent((prev) => (prev - 1 + pinnedNotices.length) % pinnedNotices.length)
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setCurrent((prev) => (prev + 1) % pinnedNotices.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
