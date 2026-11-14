const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  ShadingType,
  ImageRun,
} = require('docx');
const mammoth = require('mammoth');

async function main() {
  // 1. Create a 1x1 transparent/red PNG image buffer (or small valid 2x2 png)
  // Base64 of a 1x1 red PNG:
  const redPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const imgBuffer = Buffer.from(redPngBase64, 'base64');

  // 2. Build the Word Document with all requested elements:
  // - centered text
  // - right-aligned text
  // - different font sizes
  // - colored text
  // - table with merged cells and colored cells
  // - nested bullet list
  // - an image
  const doc = new Document({
    sections: [
      {
        children: [
          // Centered text
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'This text is centered.', bold: true }),
            ],
          }),

          // Right-aligned text
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: 'This text is right-aligned.', italics: true }),
            ],
          }),

          // Different font sizes and colored text
          new Paragraph({
            children: [
              new TextRun({
                text: 'Large Blue Heading (size 36) ',
                size: 36, // 18pt
                color: '0000FF',
              }),
              new TextRun({
                text: 'Small Red Note (size 16) ',
                size: 16, // 8pt
                color: 'FF0000',
              }),
              new TextRun({
                text: 'Green Standard Text (size 24)',
                size: 24, // 12pt
                color: '008000',
              }),
            ],
          }),

          // Nested bullet list
          new Paragraph({
            text: 'First top-level bullet',
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: 'Nested sub-bullet item A',
            bullet: { level: 1 },
          }),
          new Paragraph({
            text: 'Nested sub-bullet item B',
            bullet: { level: 1 },
          }),
          new Paragraph({
            text: 'Second top-level bullet',
            bullet: { level: 0 },
          }),

          // Table with merged cells and colored cells
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Merged Header Cell (spans 2 cols)')],
                    columnSpan: 2,
                    shading: {
                      type: ShadingType.CLEAR,
                      fill: 'D3D3D3', // Light grey shading
                    },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph('Col 1 (Yellow background)')],
                    shading: {
                      type: ShadingType.CLEAR,
                      fill: 'FFFF99',
                    },
                  }),
                  new TableCell({
                    children: [new Paragraph('Col 2 (Cyan background)')],
                    shading: {
                      type: ShadingType.CLEAR,
                      fill: 'CCFFFF',
                    },
                  }),
                ],
              }),
            ],
          }),

          // An image
          new Paragraph({
            children: [
              new ImageRun({
                data: imgBuffer,
                transformation: { width: 100, height: 100 },
                type: 'png',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const outDocxPath = path.join(__dirname, 'test-sample.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outDocxPath, buffer);
  console.log('Created test docx at:', outDocxPath);

  // 3. Now run Mammoth convertToHtml exactly as docs:open-file does
  const mammothResult = await mammoth.convertToHtml({ path: outDocxPath });
  console.log('\n--- Mammoth HTML Result ---');
  console.log(mammothResult.value);
  console.log('\n--- Mammoth Warnings/Messages ---');
  console.log(mammothResult.messages);
}

main().catch(console.error);
