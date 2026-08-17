import { Outlet, createFileRoute } from "@tanstack/react-router";
import { EventJourneyNav } from "@/components/layout/EventJourneyNav";

export const Route = createFileRoute("/_app/events/$eventId")({
  component: EventLayout,
});

function EventLayout() {
  const { eventId } = Route.useParams();

  return (
    <div className="flex flex-1 flex-col">
      <EventJourneyNav eventId={eventId} />
      <Outlet />
    </div>
  );
}
