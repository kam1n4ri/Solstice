export interface FontOption {
  id: string;
  label: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'handwriting' | 'display';
  badge?: string;
  stack: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'Sans Serif',
    label: 'Sans Serif',
    category: 'sans-serif',
    badge: 'Default',
    stack: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  {
    id: 'Serif',
    label: 'Serif',
    category: 'serif',
    badge: 'Book',
    stack: "'Merriweather', Georgia, serif",
  },
  {
    id: 'Amatic SC',
    label: 'Amatic SC',
    category: 'handwriting',
    badge: 'Condensed',
    stack: "'Amatic SC', cursive",
  },
  {
    id: 'Caveat',
    label: 'Caveat',
    category: 'handwriting',
    badge: 'Script',
    stack: "'Caveat', cursive",
  },
  {
    id: 'Comfortaa',
    label: 'Comfortaa',
    category: 'display',
    badge: 'Rounded',
    stack: "'Comfortaa', cursive, sans-serif",
  },
  {
    id: 'Courier New',
    label: 'Courier New',
    category: 'monospace',
    badge: 'Classic',
    stack: "'Courier New', Courier, monospace",
  },
  {
    id: 'EB Garamond',
    label: 'EB Garamond',
    category: 'serif',
    badge: 'Classic',
    stack: "'EB Garamond', serif",
  },
  {
    id: 'Inter',
    label: 'Inter',
    category: 'sans-serif',
    badge: 'Clean',
    stack: "'Inter', sans-serif",
  },
  {
    id: 'JetBrains Mono',
    label: 'JetBrains Mono',
    category: 'monospace',
    badge: 'Mono',
    stack: "'JetBrains Mono', monospace",
  },
  {
    id: 'Lexend',
    label: 'Lexend',
    category: 'sans-serif',
    badge: 'Reading',
    stack: "'Lexend', sans-serif",
  },
  {
    id: 'Lobster',
    label: 'Lobster',
    category: 'display',
    badge: 'Display',
    stack: "'Lobster', cursive",
  },
  {
    id: 'Lora',
    label: 'Lora',
    category: 'serif',
    badge: 'Serif',
    stack: "'Lora', serif",
  },
  {
    id: 'Merriweather',
    label: 'Merriweather',
    category: 'serif',
    badge: 'Editorial',
    stack: "'Merriweather', serif",
  },
  {
    id: 'Montserrat',
    label: 'Montserrat',
    category: 'sans-serif',
    badge: 'Modern',
    stack: "'Montserrat', sans-serif",
  },
  {
    id: 'Nunito',
    label: 'Nunito',
    category: 'sans-serif',
    badge: 'Rounded',
    stack: "'Nunito', sans-serif",
  },
  {
    id: 'Oswald',
    label: 'Oswald',
    category: 'display',
    badge: 'Headline',
    stack: "'Oswald', sans-serif",
  },
  {
    id: 'Pacifico',
    label: 'Pacifico',
    category: 'handwriting',
    badge: 'Brush',
    stack: "'Pacifico', cursive",
  },
  {
    id: 'Playfair Display',
    label: 'Playfair Display',
    category: 'serif',
    badge: 'Editorial',
    stack: "'Playfair Display', Georgia, serif",
  },
  {
    id: 'PT Sans Narrow',
    label: 'PT Sans Narrow',
    category: 'sans-serif',
    badge: 'Condensed',
    stack: "'PT Sans Narrow', sans-serif",
  },
  {
    id: 'Roboto',
    label: 'Roboto',
    category: 'sans-serif',
    badge: 'Sans',
    stack: "'Roboto', sans-serif",
  },
  {
    id: 'Roboto Mono',
    label: 'Roboto Mono',
    category: 'monospace',
    badge: 'Mono',
    stack: "'Roboto Mono', monospace",
  },
  {
    id: 'Roboto Serif',
    label: 'Roboto Serif',
    category: 'serif',
    badge: 'Serif',
    stack: "'Roboto Serif', serif",
  },
  {
    id: 'Spectral',
    label: 'Spectral',
    category: 'serif',
    badge: 'Literary',
    stack: "'Spectral', serif",
  },
];

/**
 * Normalizes raw font family strings from TipTap/DOM (which may contain escaped quotes,
 * fallback stacks, or generic names) to a canonical FontOption id.
 */
export function normalizeFontFamily(
  raw: string | null | undefined,
  extraFonts: FontOption[] = []
): string {
  if (!raw) return 'Sans Serif';
  const cleaned = raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
  if (!cleaned || cleaned === 'sans-serif') return 'Sans Serif';

  // Extract first family before any comma and strip all quotes
  const firstFamily = cleaned.split(',')[0].trim().replace(/^['"]+|['"]+$/g, '');

  const all = [...FONT_OPTIONS, ...extraFonts];
  const matched = all.find(
    (f) => f.id.toLowerCase() === firstFamily.toLowerCase()
  );
  if (matched) return matched.id;

  return firstFamily || 'Sans Serif';
}

/**
 * Resolves a font ID to its full stack.
 */
export function getFontStack(fontId: string): string {
  const found = FONT_OPTIONS.find((f) => f.id.toLowerCase() === fontId.toLowerCase());
  return found ? found.stack : fontId;
}
