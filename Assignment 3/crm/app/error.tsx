"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex max-w-md flex-col items-center text-center gap-4 p-8 rounded-xl bg-card border border-border shadow-sm">
        <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-muted-foreground">
            An unexpected error occurred. Please try again or contact support if the issue persists.
          </p>
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={() => window.location.href = "/"}>Go Home</Button>
          <Button variant="outline" onClick={() => reset()}>Try Again</Button>
        </div>
      </div>
    </div>
  );
}
