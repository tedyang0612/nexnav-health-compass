import { createFileRoute, useSearch } from "@tanstack/react-router";
import { EventJourneyNav } from "@/components/layout/EventJourneyNav";

export const Route = createFileRoute("/_public/journey-preview")({
  validateSearch: (s: Record<string, unknown>) => ({ path: (s['path'] as string) ?? "" }),
  component: Preview,
});

function Preview() {
  const { path } = useSearch({ from: "/_public/journey-preview" });
  return <EventJourneyNav eventId="preview" pathnameOverride={path || undefined} />;
}
