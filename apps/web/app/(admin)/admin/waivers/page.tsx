// Server wrapper — forces dynamic rendering
export const dynamic = 'force-dynamic';

import WaiversClient from './waivers.client';

export default function Page() {
  return <WaiversClient />;
}
