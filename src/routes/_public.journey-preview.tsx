import { createFileRoute } from "@tanstack/react-router";
import { EventJourneyNav } from "@/components/layout/EventJourneyNav";

export const Route = createFileRoute("/_public/journey-preview")({
  component: () => <EventJourneyNav eventId="preview" />,
});
