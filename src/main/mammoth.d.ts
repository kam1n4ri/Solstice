declare module 'mammoth' {
  export interface MammothResult {
    value: string;
    messages: any[];
  }

  export function convertToHtml(input: { path?: string; buffer?: any; arrayBuffer?: ArrayBuffer }): Promise<MammothResult>;
  export function extractRawText(input: { path?: string; buffer?: any; arrayBuffer?: ArrayBuffer }): Promise<MammothResult>;
}
