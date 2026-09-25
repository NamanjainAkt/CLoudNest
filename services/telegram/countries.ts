// services/telegram/countries.ts

export interface CountryItem {
  name: string;
  code: string; // ISO 2-letter
  dialCode: string; // "+91"
  flag: string; // "🇮🇳"
  format: string; // sample placeholder e.g. "98765 43210"
  maxLength: number;
}

export const COUNTRIES: CountryItem[] = [
  // India first & prominent
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', format: '98765 43210', maxLength: 10 },
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', format: '555 019 2834', maxLength: 10 },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', format: '7911 123456', maxLength: 10 },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', format: '50 123 4567', maxLength: 9 },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', format: '555 019 2834', maxLength: 10 },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', format: '151 23456789', maxLength: 11 },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', format: '412 345 678', maxLength: 9 },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', format: '8123 4567', maxLength: 8 },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', format: '6 12 34 56 78', maxLength: 9 },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', format: '90 1234 5678', maxLength: 10 },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷', format: '11 91234 5678', maxLength: 11 },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺', format: '912 345 6789', maxLength: 10 },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', format: '50 123 4567', maxLength: 9 },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', format: '10 1234 5678', maxLength: 10 },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱', format: '6 12345678', maxLength: 9 },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭', format: '78 123 45 67', maxLength: 9 },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹', format: '312 345 6789', maxLength: 10 },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸', format: '612 345 678', maxLength: 9 },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷', format: '512 345 6789', maxLength: 10 },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', format: '812 3456 7890', maxLength: 11 },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', format: '12 345 6789', maxLength: 9 },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', format: '91 234 5678', maxLength: 9 },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', format: '81 234 5678', maxLength: 9 },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', format: '912 345 6789', maxLength: 10 },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰', format: '300 1234567', maxLength: 10 },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩', format: '1712 345678', maxLength: 10 },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵', format: '984 1234567', maxLength: 10 },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰', format: '71 234 5678', maxLength: 9 },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', format: '71 234 5678', maxLength: 9 },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', format: '802 123 4567', maxLength: 10 },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪', format: '712 345678', maxLength: 9 },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽', format: '55 1234 5678', maxLength: 10 },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷', format: '9 11 1234 5678', maxLength: 11 },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴', format: '300 123 4567', maxLength: 10 },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱', format: '9 1234 5678', maxLength: 9 },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬', format: '10 1234 5678', maxLength: 10 },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱', format: '512 345 678', maxLength: 9 },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦', format: '50 123 4567', maxLength: 9 },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪', format: '70 123 45 67', maxLength: 9 },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴', format: '412 34 567', maxLength: 8 },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰', format: '20 12 34 56', maxLength: 8 },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮', format: '40 1234567', maxLength: 9 },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪', format: '85 123 4567', maxLength: 9 },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', format: '21 123 4567', maxLength: 9 },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱', format: '50 123 4567', maxLength: 9 },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦', format: '3312 3456', maxLength: 8 },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼', format: '9123 4567', maxLength: 8 },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭', format: '3612 3456', maxLength: 8 },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲', format: '9123 4567', maxLength: 8 },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹', format: '912 345 678', maxLength: 9 },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷', format: '691 234 5678', maxLength: 10 },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹', format: '664 1234567', maxLength: 10 },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪', format: '470 12 34 56', maxLength: 9 },
];

export const POPULAR_COUNTRY_CODES = ['IN', 'US', 'GB', 'AE', 'CA', 'DE', 'SG', 'AU'];

export const DEFAULT_COUNTRY = COUNTRIES[0]; // India (+91)

export function findCountryByCode(code: string): CountryItem | undefined {
  return COUNTRIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
}

export function findCountryByDialCode(dialCode: string): CountryItem | undefined {
  const normalized = dialCode.startsWith('+') ? dialCode : `+${dialCode}`;
  return COUNTRIES.find((c) => c.dialCode === normalized);
}

/**
 * Format phone digits according to country conventions
 */
export function formatPhoneNumber(raw: string, country: CountryItem): string {
  const digits = raw.replace(/\D/g, '').slice(0, country.maxLength);
  
  if (country.code === 'IN') {
    // 5-5 split: 98765 43210
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  }

  if (country.code === 'US' || country.code === 'CA') {
    // 3-3-4 split: 555 019 2834
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }

  if (country.code === 'GB') {
    // 4-6 split: 7911 123456
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
  }

  if (country.code === 'AE') {
    // 2-3-4 split: 50 123 4567
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  }

  // Default grouping: groups of 3 or 4
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
}

/**
 * Extract country code and local number if user enters/pastes full international number
 */
export function extractCountryAndNumber(input: string): { country?: CountryItem; localDigits: string } {
  const clean = input.trim();
  if (clean.startsWith('+')) {
    // Try matching dial codes from longest to shortest (e.g. +971 before +9)
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dialCode)) {
        const remaining = clean.slice(c.dialCode.length).replace(/\D/g, '');
        return { country: c, localDigits: remaining };
      }
    }
  }
  return { localDigits: clean.replace(/\D/g, '') };
}
