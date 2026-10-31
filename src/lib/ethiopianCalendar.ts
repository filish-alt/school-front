/**
 * Ethiopian Calendar (የኢትዮጵያ ዘመን አቆጣጠር) Utility and Conversion Engine
 * Implements precise bidirectional conversion between Gregorian and Ge'ez/Ethiopian calendars using Julian Day Numbers (JDN).
 */

export interface EthiopianDate {
  year: number;
  month: number; // 1 to 13
  day: number; // 1 to 30 (or 1 to 6 for Pagume)
  monthNameAmharic: string;
  monthNameEnglish: string;
  dayOfWeekAmharic: string;
  dayOfWeekEnglish: string;
  formattedAmharic: string;
  formattedEnglish: string;
}

export const ETHIOPIAN_MONTHS_AMHARIC = [
  'መስከረም',
  'ጥቅምት',
  'ኅዳር',
  'ታኅሣሥ',
  'ጥር',
  'የካቲት',
  'መጋቢት',
  'ሚያዝያ',
  'ግንቦት',
  'ሰኔ',
  'ሐምሌ',
  'ነሐሴ',
  'ጳጉሜን',
] as const;

export const ETHIOPIAN_MONTHS_ENGLISH = [
  'Meskerem',
  'Tikimt',
  'Hidar',
  'Tahsas',
  'Tir',
  'Yekatit',
  'Megabit',
  'Miyazya',
  'Ginbot',
  'Sene',
  'Hamle',
  'Nehase',
  'Pagume',
] as const;

export const DAYS_OF_WEEK_AMHARIC = [
  'እሑድ',
  'ሰኞ',
  'ማክሰኞ',
  'ረቡዕ',
  'ሐሙስ',
  'ዓርብ',
  'ቅዳሜ',
] as const;

export const DAYS_OF_WEEK_ENGLISH = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

const ETHIOPIAN_EPOCH_JDN = 1723856;

/**
 * Converts a Gregorian Date object or ISO string to Julian Day Number (JDN)
 */
export function gregorianToJDN(dateInput: Date | string | number): number {
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    return gregorianToJDN(new Date());
  }

  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  const day = d.getDate();

  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;

  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/**
 * Converts a Julian Day Number (JDN) to an Ethiopian Date
 */
export function jdnToEthiopian(jdn: number, dayOfWeekIndex = 0): EthiopianDate {
  const r = (jdn - ETHIOPIAN_EPOCH_JDN) % 1461;
  const n = (r % 365) + 365 * Math.floor(r / 1460);

  const year =
    4 * Math.floor((jdn - ETHIOPIAN_EPOCH_JDN) / 1461) +
    Math.floor(r / 365) -
    Math.floor(r / 1460);

  const month = Math.floor(n / 30) + 1;
  const day = (n % 30) + 1;

  const monthIdx = Math.max(0, Math.min(12, month - 1));
  const dowIdx = Math.max(0, Math.min(6, dayOfWeekIndex));

  const monthNameAmharic = ETHIOPIAN_MONTHS_AMHARIC[monthIdx];
  const monthNameEnglish = ETHIOPIAN_MONTHS_ENGLISH[monthIdx];
  const dayOfWeekAmharic = DAYS_OF_WEEK_AMHARIC[dowIdx];
  const dayOfWeekEnglish = DAYS_OF_WEEK_ENGLISH[dowIdx];

  return {
    year,
    month,
    day,
    monthNameAmharic,
    monthNameEnglish,
    dayOfWeekAmharic,
    dayOfWeekEnglish,
    formattedAmharic: `${monthNameAmharic} ${day} ቀን ${year} ዓ.ም.`,
    formattedEnglish: `${monthNameEnglish} ${day}, ${year} E.C.`,
  };
}

/**
 * Converts a Gregorian Date into an Ethiopian Date representation
 */
export function toEthiopianDate(dateInput: Date | string | number): EthiopianDate {
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  const jdn = gregorianToJDN(d);
  const dayOfWeek = isNaN(d.getTime()) ? 0 : d.getDay();
  return jdnToEthiopian(jdn, dayOfWeek);
}

/**
 * Converts Ethiopian Date components back to Gregorian Date
 */
export function ethiopianToGregorian(
  year: number,
  month: number,
  day: number
): Date {
  const jdn =
    ETHIOPIAN_EPOCH_JDN +
    365 * (year - 1) +
    Math.floor(year / 4) +
    30 * (month - 1) +
    day -
    1;

  // JDN to Gregorian
  const l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  const l2 = l - Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l2 + 1)) / 1461001);
  const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l3) / 2447);
  const gDay = l3 - Math.floor((2447 * j) / 80);
  const l4 = Math.floor(j / 11);
  const gMonth = j + 2 - 12 * l4;
  const gYear = 100 * (n - 49) + i + l4;

  return new Date(gYear, gMonth - 1, gDay);
}

/**
 * Formats a date string or object respecting locale and calendar settings
 */
export function formatCalendarDate(
  dateInput: Date | string | null | undefined,
  options: {
    locale?: 'am' | 'en';
    calendar?: 'ethiopian' | 'gregorian' | 'dual';
    includeTime?: boolean;
    short?: boolean;
  } = {}
): string {
  if (!dateInput) return '—';
  const d = typeof dateInput === 'object' ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  const { locale = 'am', calendar = 'dual', includeTime = false, short = false } = options;

  const eth = toEthiopianDate(d);
  const timeStr = includeTime
    ? ' ' +
      d.toLocaleTimeString(locale === 'am' ? 'am-ET' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (calendar === 'ethiopian') {
    if (short) {
      return `${eth.monthNameAmharic.slice(0, 3)} ${eth.day}, ${eth.year}${timeStr}`;
    }
    return locale === 'am'
      ? `${eth.formattedAmharic}${timeStr}`
      : `${eth.formattedEnglish}${timeStr}`;
  }

  if (calendar === 'gregorian') {
    const gregFormatted = d.toLocaleDateString(
      locale === 'am' ? 'am-ET' : 'en-US',
      {
        year: 'numeric',
        month: short ? 'short' : 'long',
        day: 'numeric',
      }
    );
    return `${gregFormatted}${timeStr}`;
  }

  // Dual format (shows both Ethiopian and Gregorian)
  const ethPart = locale === 'am' ? `${eth.monthNameAmharic} ${eth.day}, ${eth.year} ዓ.ም.` : `${eth.monthNameEnglish} ${eth.day}, ${eth.year} E.C.`;
  const gregMonth = d.toLocaleString('en-US', { month: 'short' });
  const gregPart = `${gregMonth} ${d.getDate()}, ${d.getFullYear()}`;

  return `${ethPart} (${gregPart})${timeStr}`;
}

/**
 * List of standard Ethiopian Academic Years with Gregorian mapping for selectors
 */
export interface AcademicYearOption {
  value: string;
  ethiopianYear: number;
  labelAmharic: string;
  labelEnglish: string;
  gregorianRange: string;
}

export const PRESET_ETHIOPIAN_ACADEMIC_YEARS: AcademicYearOption[] = [
  {
    value: '2015 ዓ.ም.',
    ethiopianYear: 2015,
    labelAmharic: '2015 ዓ.ም. (2022/2023)',
    labelEnglish: '2015 E.C. (2022/2023 G.C.)',
    gregorianRange: '2022 - 2023',
  },
  {
    value: '2016 ዓ.ም.',
    ethiopianYear: 2016,
    labelAmharic: '2016 ዓ.ም. (2023/2024)',
    labelEnglish: '2016 E.C. (2023/2024 G.C.)',
    gregorianRange: '2023 - 2024',
  },
  {
    value: '2017 ዓ.ም.',
    ethiopianYear: 2017,
    labelAmharic: '2017 ዓ.ም. (2024/2025)',
    labelEnglish: '2017 E.C. (2024/2025 G.C.)',
    gregorianRange: '2024 - 2025',
  },
  {
    value: '2018 ዓ.ም.',
    ethiopianYear: 2018,
    labelAmharic: '2018 ዓ.ም. (2025/2026)',
    labelEnglish: '2018 E.C. (2025/2026 G.C.)',
    gregorianRange: '2025 - 2026',
  },
  {
    value: '2019 ዓ.ም.',
    ethiopianYear: 2019,
    labelAmharic: '2019 ዓ.ም. (2026/2027)',
    labelEnglish: '2019 E.C. (2026/2027 G.C.)',
    gregorianRange: '2026 - 2027',
  },
  {
    value: '2020 ዓ.ም.',
    ethiopianYear: 2020,
    labelAmharic: '2020 ዓ.ም. (2027/2028)',
    labelEnglish: '2020 E.C. (2027/2028 G.C.)',
    gregorianRange: '2027 - 2028',
  },
];
