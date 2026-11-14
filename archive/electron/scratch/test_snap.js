const { app, BrowserWindow } = require('electron');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false });

  // A document with multiple multi-line paragraphs
  const paras = Array.from({ length: 15 }).map((_, i) =>
    `<p style="margin: 0 0 16px 0; font-family: Inter, sans-serif; font-size: 15px; line-height: 1.6;">
      Paragraph ${i+1}: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer nec odio. Praesent libero. Sed cursus ante dapibus diam. Sed nisi. Nulla quis sem at nibh elementum imperdiet. Duis sagittis ipsum. Praesent mauris. Fusce nec tellus sed augue semper porta. Mauris massa. Vestibulum lacinia arcu eget nulla.
    </p>`
  ).join('\n');

  const html = `
    <!DOCTYPE html>
    <html>
      <body style="margin: 0; padding: 56px 64px; width: 816px; box-sizing: border-box;">
        <div id="editor">${paras}</div>
      </body>
    </html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  const result = await win.webContents.executeJavaScript(`
    (() => {
      const editor = document.getElementById('editor');
      const containerRect = editor.getBoundingClientRect();
      const A4_HEIGHT = 971; // printable height

      // Collect all lines in editor
      const lines = [];
      const blocks = editor.children;
      for (let b of blocks) {
        const range = document.createRange();
        range.selectNodeContents(b);
        const rects = range.getClientRects();
        for (let r of rects) {
          // relative to editor top
          lines.push({
            top: r.top - containerRect.top,
            bottom: r.bottom - containerRect.top,
            height: r.height,
            text: b.innerText.slice(0, 30)
          });
        }
      }

      console.log('Total lines found:', lines.length);

      // Find break point for Page 1 -> Page 2
      const targetHeight = A4_HEIGHT;
      let breakY = targetHeight;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.bottom > targetHeight) {
          // line i does NOT fit on page 1!
          // So line i-1 was the last line of page 1.
          const prevLine = lines[i - 1];
          if (prevLine) {
            // Gap between prevLine and line
            breakY = prevLine.bottom + (line.top - prevLine.bottom) / 2;
          } else {
            breakY = line.top;
          }
          break;
        }
      }

      return { breakY, targetHeight };
    })()
  `);

  console.log('Calculation result:', result);
  app.quit();
});
