// Server wrapper — vynutí dynamické renderování (bez prerenderu)
export const dynamic = 'force-dynamic';

import EventsClient from './events.client';

export default function Page() {
  return <EventsClient />;
}
