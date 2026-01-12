export type UrlType = 'external' | 'system' | 'invalid';

export interface ParsedUrl {
  raw: string;
  normalized: string;
  type: UrlType;
}

const SYSTEM_PROTOCOL = 'os://';

export const normalizeUrl = (input: string): string => {
  const value = input.trim();
  if (!value) return '';

  if (value.startsWith(SYSTEM_PROTOCOL)) {
    return value; // system URLs are already explicit
  }

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  // heuristic: treat bare domain as https
  return `https://${value}`;
};

export const detectUrlType = (input: string): UrlType => {
  const value = input.trim();

  if (!value) return 'invalid';
  if (value.startsWith(SYSTEM_PROTOCOL)) return 'system';
  if (value.startsWith('http://') || value.startsWith('https://')) return 'external';

  // naive check: contains a dot, assume external
  if (value.includes('.')) return 'external';

  return 'invalid';
};

export const parseUrl = (input: string): ParsedUrl => {
  const type = detectUrlType(input);
  const normalized = type === 'invalid' ? input.trim() : normalizeUrl(input);
  return {
    raw: input,
    normalized,
    type,
  };
};