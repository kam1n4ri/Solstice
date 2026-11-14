export interface InstalledFont {
  id: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'handwriting' | 'display';
  fileName: string;
  boldFileName?: string;
  source: 'google' | 'custom';
  dateAdded: number;
  dataUrl?: string;
  boldDataUrl?: string;
}

export interface GoogleCatalogFont {
  id: string;
  name: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'handwriting' | 'display';
  tagline: string;
  weights: string;
  previewSentence?: string;
}
