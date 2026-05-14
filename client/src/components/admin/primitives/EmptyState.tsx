import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  testId?: string;
}

export function EmptyState({ icon: Icon, title, description, action, testId }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-md border border-dashed border-border bg-card"
      data-testid={testId ?? "empty-state"}
    >
      {Icon && <Icon className="w-10 h-10 text-muted-foreground mb-3" />}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
