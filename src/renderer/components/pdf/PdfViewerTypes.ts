export interface PdfTextSelection {
  text: string;
  pageNumber: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    xRatio: number;
    yRatio: number;
    widthRatio: number;
    heightRatio: number;
  };
}
