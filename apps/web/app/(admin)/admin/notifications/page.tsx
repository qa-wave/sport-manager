// Server wrapper — vynutí dynamické renderování (bez prerenderu)
export const dynamic = 'force-dynamic';

import NotificationsClient from './notifications.client';

export default function Page() {
  return <NotificationsClient />;
}
