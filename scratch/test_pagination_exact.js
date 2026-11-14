const { app, BrowserWindow } = require('electron');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, backgroundColor: '#ffffff' });

  // Generate 60 numbered lines, each in its own paragraph with known height
  const lines = Array.from({ length: 60 }).map((_, i) =>
    `<p id="line-${i+1}" style="margin: 0; padding: 0; height: 24px; line-height: 24px; font-size: 14px; font-family: Inter, sans-serif;">Line ${i+1}: This is test line number ${i+1} to check pagination.</p>`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page {
            size: A4 portrait;
            margin: 20mm 18mm;
          }
          @media print {
            html, body, #root, .DocsView-container, .DocsEditor-scroll, .DocsEditor-center, .DocsEditor-paper {
              height: auto !important;
              min-height: 0 !important;
              max-height: none !important;
              overflow: visible !important;
              position: static !important;
              background: #ffffff !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              border: none !important;
              zoom: 1 !important;
            }
            .ProseMirror {
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }
        </style>
      </head>
      <body style="background: white; margin: 0;">
        <div class="DocsEditor-paper">
          <div class="ProseMirror">
            ${lines}
          </div>
        </div>
      </body>
    </html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  // Measure in DOM
  const domHeights = await win.webContents.executeJavaScript(`
    (() => {
      const p1 = document.getElementById('line-1');
      return {
        lineHeight: p1.offsetHeight,
        totalHeight: document.querySelector('.ProseMirror').offsetHeight
      };
    })()
  `);
  console.log('DOM measurements:', domHeights);

  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    preferCSSPageSize: true,
  });
  fs.writeFileSync('/tmp/test_line_count.pdf', pdf);

  app.quit();
});
