/**
 * Interest topics a user can follow. Stored on User.topics (string[] of keys).
 * Drives personalization (which areas the user cares about) and is surfaced in
 * account preferences.
 */
export interface UserTopic {
  key: string;
  label: string;
  icon: string;
}

export const USER_TOPICS: UserTopic[] = [
  { key: 'treninky', label: 'Tréninky', icon: '🏃' },
  { key: 'zapasy', label: 'Zápasy', icon: '⚽' },
  { key: 'akce', label: 'Společenské akce', icon: '🎉' },
  { key: 'platby', label: 'Platby', icon: '💳' },
  { key: 'komunikace', label: 'Komunikace', icon: '💬' },
  { key: 'statistiky', label: 'Statistiky', icon: '📊' },
  { key: 'novinky', label: 'Novinky klubu', icon: '📰' },
  { key: 'dochazka', label: 'Docházka', icon: '✅' },
];

export const topicLabel = (key: string): string =>
  USER_TOPICS.find((t) => t.key === key)?.label ?? key;
