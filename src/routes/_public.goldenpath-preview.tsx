import { createFileRoute } from "@tanstack/react-router";
import { EventJourneyNav } from "@/components/layout/EventJourneyNav";

export const Route = createFileRoute("/_public/goldenpath-preview")({
  head: () => ({
    meta: [
      { title: "Golden Path Preview — NexNav" },
      { name: "description", content: "Internal preview for Golden Path desktop verification." },
    ],
  }),
  component: PreviewPage,
});

function PreviewPage() {
  return (
    <div className="min-h-screen bg-background">
      <EventJourneyNav eventId="preview-event-id" />
      <main className="mx-auto max-w-5xl px-4 py-12 text-center text-muted-foreground">
        <p>Desktop Golden Path verification preview.</p>
      </main>
    </div>
  );
}
