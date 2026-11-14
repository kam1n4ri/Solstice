import { BrowserWindow } from 'electron';

export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const printWin = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      sandbox: true,
      javascript: false,
    },
  });

  const pageHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Document Export</title>
  <style>
    @page {
      size: A4;
      margin: 20mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      background: #ffffff;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #111827;
      margin-top: 1.2em;
      margin-bottom: 0.5em;
      line-height: 1.25;
      font-weight: 600;
    }
    h1 { font-size: 22pt; margin-top: 0; }
    h2 { font-size: 16pt; }
    h3 { font-size: 13pt; }
    p { margin-top: 0; margin-bottom: 0.8em; }
    blockquote {
      border-left: 3px solid #cbd5e1;
      margin: 1em 0;
      padding-left: 1em;
      color: #475569;
      font-style: italic;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: left;
      vertical-align: top;
    }
    th {
      background-color: #f8fafc;
      font-weight: 600;
    }
    ul, ol {
      margin-top: 0;
      margin-bottom: 0.8em;
      padding-left: 24px;
    }
    li {
      margin-bottom: 0.3em;
    }
    ul[data-type="taskList"] {
      list-style: none;
      padding-left: 0;
    }
    ul[data-type="taskList"] li {
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }
    code {
      font-family: "Courier New", Courier, monospace;
      font-size: 0.9em;
      background: #f1f5f9;
      padding: 2px 4px;
      border-radius: 3px;
    }
    pre {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      font-size: 0.9em;
      margin: 1em 0;
    }
    pre code {
      background: none;
      padding: 0;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 1em auto;
    }
    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 1.5em 0;
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;

  try {
    await printWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(pageHtml)}`);
    const pdfBuffer = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      preferCSSPageSize: true,
    });
    return pdfBuffer;
  } finally {
    if (!printWin.isDestroyed()) {
      printWin.destroy();
    }
  }
}
