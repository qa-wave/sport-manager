/**
 * Supported languages with flag emojis and native names.
 * Ordered by global reach / priority.
 */

export type Language = {
  code: string;
  flag: string;
  name: string;
  /** English name for search */
  nameEn: string;
};

export const LANGUAGES: Language[] = [
  { code: 'en', flag: '🇬🇧', name: 'English', nameEn: 'English' },
  { code: 'es', flag: '🇪🇸', name: 'Español', nameEn: 'Spanish' },
  { code: 'fr', flag: '🇫🇷', name: 'Français', nameEn: 'French' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', nameEn: 'German' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский', nameEn: 'Russian' },
  { code: 'ja', flag: '🇯🇵', name: '日本語', nameEn: 'Japanese' },
  { code: 'zh', flag: '🇨🇳', name: '中文', nameEn: 'Chinese' },
  { code: 'pt', flag: '🇧🇷', name: 'Português', nameEn: 'Portuguese' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano', nameEn: 'Italian' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी', nameEn: 'Hindi' },
  { code: 'bn', flag: '🇧🇩', name: 'বাংলা', nameEn: 'Bengali' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية', nameEn: 'Arabic' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe', nameEn: 'Turkish' },
  { code: 'pl', flag: '🇵🇱', name: 'Polski', nameEn: 'Polish' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands', nameEn: 'Dutch' },
  { code: 'sv', flag: '🇸🇪', name: 'Svenska', nameEn: 'Swedish' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt', nameEn: 'Vietnamese' },
  { code: 'id', flag: '🇮🇩', name: 'Bahasa Indonesia', nameEn: 'Indonesian' },
  { code: 'th', flag: '🇹🇭', name: 'ไทย', nameEn: 'Thai' },
  { code: 'uk', flag: '🇺🇦', name: 'Українська', nameEn: 'Ukrainian' },
  { code: 'lv', flag: '🇱🇻', name: 'Latviešu', nameEn: 'Latvian' },
  { code: 'lt', flag: '🇱🇹', name: 'Lietuvių', nameEn: 'Lithuanian' },
  { code: 'et', flag: '🇪🇪', name: 'Eesti', nameEn: 'Estonian' },
  { code: 'no', flag: '🇳🇴', name: 'Norsk', nameEn: 'Norwegian' },
  { code: 'fi', flag: '🇫🇮', name: 'Suomi', nameEn: 'Finnish' },
  { code: 'af', flag: '🇿🇦', name: 'Afrikaans', nameEn: 'Afrikaans' },
  { code: 'ro', flag: '🇷🇴', name: 'Română', nameEn: 'Romanian' },
  { code: 'bg', flag: '🇧🇬', name: 'Български', nameEn: 'Bulgarian' },
  { code: 'sr', flag: '🇷🇸', name: 'Српски', nameEn: 'Serbian' },
  { code: 'kk', flag: '🇰🇿', name: 'Қазақша', nameEn: 'Kazakh' },
  { code: 'cs', flag: '🇨🇿', name: 'Čeština', nameEn: 'Czech' },
  { code: 'sk', flag: '🇸🇰', name: 'Slovenčina', nameEn: 'Slovak' },
  { code: 'hr', flag: '🇭🇷', name: 'Hrvatski', nameEn: 'Croatian' },
  { code: 'sq', flag: '🇦🇱', name: 'Shqip', nameEn: 'Albanian' },
  { code: 'da', flag: '🇩🇰', name: 'Dansk', nameEn: 'Danish' },
  { code: 'he', flag: '🇮🇱', name: 'עברית', nameEn: 'Hebrew' },
  { code: 'hu', flag: '🇭🇺', name: 'Magyar', nameEn: 'Hungarian' },
  { code: 'sl', flag: '🇸🇮', name: 'Slovenščina', nameEn: 'Slovenian' },
  { code: 'ms', flag: '🇲🇾', name: 'Bahasa Melayu', nameEn: 'Malay' },
  { code: 'mr', flag: '🇮🇳', name: 'मराठी', nameEn: 'Marathi' },
  { code: 'fa', flag: '🇮🇷', name: 'فارسی', nameEn: 'Persian' },
  { code: 'ur', flag: '🇵🇰', name: 'اردو', nameEn: 'Urdu' },
  { code: 'ca', flag: '🇪🇸', name: 'Català', nameEn: 'Catalan' },
  { code: 'is', flag: '🇮🇸', name: 'Íslenska', nameEn: 'Icelandic' },
  { code: 'ta', flag: '🇮🇳', name: 'தமிழ்', nameEn: 'Tamil' },
  { code: 'ml', flag: '🇮🇳', name: 'മലയാളം', nameEn: 'Malayalam' },
  { code: 'uz', flag: '🇺🇿', name: "O'zbekcha", nameEn: 'Uzbek' },
  { code: 'ky', flag: '🇰🇬', name: 'Кыргызча', nameEn: 'Kyrgyz' },
  { code: 'tg', flag: '🇹🇯', name: 'Тоҷикӣ', nameEn: 'Tajik' },
  { code: 'ka', flag: '🇬🇪', name: 'ქართული', nameEn: 'Georgian' },
  { code: 'az', flag: '🇦🇿', name: 'Azərbaycan', nameEn: 'Azerbaijani' },
  { code: 'hy', flag: '🇦🇲', name: 'Հայերեն', nameEn: 'Armenian' },
  { code: 'el', flag: '🇬🇷', name: 'Ελληνικά', nameEn: 'Greek' },
  { code: 'ko', flag: '🇰🇷', name: '한국어', nameEn: 'Korean' },
  { code: 'my', flag: '🇲🇲', name: 'မြန်မာ', nameEn: 'Burmese' },
  { code: 'km', flag: '🇰🇭', name: 'ខ្មែរ', nameEn: 'Khmer' },
  { code: 'lo', flag: '🇱🇦', name: 'ລາວ', nameEn: 'Lao' },
  { code: 'ne', flag: '🇳🇵', name: 'नेपाली', nameEn: 'Nepali' },
  { code: 'si', flag: '🇱🇰', name: 'සිංහල', nameEn: 'Sinhala' },
  { code: 'gu', flag: '🇮🇳', name: 'ગુજરાતી', nameEn: 'Gujarati' },
  { code: 'pa', flag: '🇮🇳', name: 'ਪੰਜਾਬੀ', nameEn: 'Punjabi' },
  { code: 'sw', flag: '🇰🇪', name: 'Kiswahili', nameEn: 'Swahili' },
  { code: 'am', flag: '🇪🇹', name: 'አማርኛ', nameEn: 'Amharic' },
  { code: 'ha', flag: '🇳🇬', name: 'Hausa', nameEn: 'Hausa' },
  { code: 'yo', flag: '🇳🇬', name: 'Yorùbá', nameEn: 'Yoruba' },
  { code: 'ig', flag: '🇳🇬', name: 'Igbo', nameEn: 'Igbo' },
  { code: 'zu', flag: '🇿🇦', name: 'isiZulu', nameEn: 'Zulu' },
  { code: 'xh', flag: '🇿🇦', name: 'isiXhosa', nameEn: 'Xhosa' },
  { code: 'so', flag: '🇸🇴', name: 'Soomaali', nameEn: 'Somali' },
  { code: 'sn', flag: '🇿🇼', name: 'chiShona', nameEn: 'Shona' },
  { code: 'rw', flag: '🇷🇼', name: 'Kinyarwanda', nameEn: 'Kinyarwanda' },
  { code: 'tl', flag: '🇵🇭', name: 'Filipino', nameEn: 'Filipino' },
  { code: 'mn', flag: '🇲🇳', name: 'Монгол', nameEn: 'Mongolian' },
  { code: 'jw', flag: '🇮🇩', name: 'Basa Jawa', nameEn: 'Javanese' },
  { code: 'ku', flag: '🇮🇶', name: 'Kurdî', nameEn: 'Kurdish' },
  { code: 'tk', flag: '🇹🇲', name: 'Türkmen', nameEn: 'Turkmen' },
  { code: 'be', flag: '🇧🇾', name: 'Беларуская', nameEn: 'Belarusian' },
  { code: 'mk', flag: '🇲🇰', name: 'Македонски', nameEn: 'Macedonian' },
  { code: 'bs', flag: '🇧🇦', name: 'Bosanski', nameEn: 'Bosnian' },
  { code: 'gl', flag: '🇪🇸', name: 'Galego', nameEn: 'Galician' },
  { code: 'eu', flag: '🇪🇸', name: 'Euskara', nameEn: 'Basque' },
  { code: 'cy', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', name: 'Cymraeg', nameEn: 'Welsh' },
  { code: 'mt', flag: '🇲🇹', name: 'Malti', nameEn: 'Maltese' },
  { code: 'ga', flag: '🇮🇪', name: 'Gaeilge', nameEn: 'Irish' },
  { code: 'fy', flag: '🇳🇱', name: 'Frysk', nameEn: 'Frisian' },
  { code: 'mi', flag: '🇳🇿', name: 'Māori', nameEn: 'Maori' },
  { code: 'mg', flag: '🇲🇬', name: 'Malagasy', nameEn: 'Malagasy' },
  { code: 'sm', flag: '🇼🇸', name: 'Gagana Sāmoa', nameEn: 'Samoan' },
  { code: 'la', flag: '🏛️', name: 'Latina', nameEn: 'Latin' },
  { code: 'eo', flag: '🌍', name: 'Esperanto', nameEn: 'Esperanto' },
];

/** Currently active locale code — stored in localStorage */
const STORAGE_KEY = 'sport-manager-locale';

export function getStoredLocale(): string {
  if (typeof window === 'undefined') return 'cs';
  return localStorage.getItem(STORAGE_KEY) ?? 'cs';
}

export function setStoredLocale(code: string): void {
  localStorage.setItem(STORAGE_KEY, code);
}

export function findLanguage(code: string): Language | undefined {
  return LANGUAGES.find(l => l.code === code);
}
