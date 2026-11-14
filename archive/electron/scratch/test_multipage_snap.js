const { app, BrowserWindow } = require('electron');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, backgroundColor: '#ffffff' });

  // Generate 100 paragraphs
  const paras = Array.from({ length: 40 }).map((_, i) =>
    `<p style="margin: 0 0 16px 0; font-family: Inter, sans-serif; font-size: 15px; line-height: 1.6;">
      Paragraph ${i+1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
    </p>`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="background: white; margin: 0;">
        <div class="DocsEditor-paper" style="width: 794px; padding: 76px 68px; box-sizing: border-box; position: relative;">
          <div class="ProseMirror" id="editor">
            ${paras}
          </div>
        </div>
      </body>
    </html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  const multiPageBreaks = await win.webContents.executeJavaScript(`
    (() => {
      const editor = document.getElementById('editor');
      const container = editor.parentElement;
      const containerRect = container.getBoundingClientRect();
      const editorRect = editor.getBoundingClientRect();
      const A4_CONTENT_HEIGHT = 971; // 257mm at 96 DPI

      // Collect all lines across all blocks
      const lines = [];
      for (let b of editor.children) {
        if (b.classList.contains('page-break-divider')) {
          const bRect = b.getBoundingClientRect();
          lines.push({
            isManualBreak: true,
            top: bRect.top - containerRect.top,
            bottom: bRect.bottom - containerRect.top,
          });
          continue;
        }
        const range = document.createRange();
        range.selectNodeContents(b);
        const rects = range.getClientRects();
        for (let r of rects) {
          lines.push({
            top: r.top - containerRect.top,
            bottom: r.bottom - containerRect.top,
            height: r.height,
          });
        }
      }

      if (lines.length === 0) return { pageBreaks: [], totalPages: 1 };

      const pageBreaks = [];
      let currentPageStart = lines[0].top;
      let targetLimit = currentPageStart + A4_CONTENT_HEIGHT;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.isManualBreak) {
          pageBreaks.push(line.bottom);
          if (i + 1 < lines.length) {
            currentPageStart = lines[i + 1].top;
            targetLimit = currentPageStart + A4_CONTENT_HEIGHT;
          }
          continue;
        }

        if (line.bottom > targetLimit) {
          // Break before this line
          const prevLine = lines[i - 1];
          let snapY = targetLimit;
          if (prevLine && !prevLine.isManualBreak) {
            snapY = prevLine.bottom + (line.top - prevLine.bottom) / 2;
          } else {
            snapY = line.top - 2;
          }

          pageBreaks.push(Math.round(snapY));
          currentPageStart = line.top;
          targetLimit = currentPageStart + A4_CONTENT_HEIGHT;
        }
      }

      return {
        pageBreaks,
        totalPages: pageBreaks.length + 1
      };
    })()
  `);

  console.log('Multi-page break positions:', multiPageBreaks);
  app.quit();
});
