const { app, BrowserWindow } = require('electron');
const fs = require('fs');

app.whenReady().then(async () => {
  const win = new BrowserWindow({ show: false, backgroundColor: '#ffffff' });

  // Use the exact text from the user's screenshot
  const text = `Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since 1966, when designers at Letraset and James Mosley, the librarian at St Bride Printing Library in London, took a 1914 Cicero translation and scrambled it to make dummy text for Letraset's Body Type sheets. It has survived not only many decades, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised thanks to these sheets and more recently with desktop publishing software like Aldus PageMaker and Microsoft Word including versions of Lorem Ipsum.

Why do we use it?

It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).

Where does it come from?

Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renaissance. The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.

The standard chunk of Lorem Ipsum used since 1966 is reproduced below for those interested. Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.

There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable. The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.`;

  const paragraphs = text.split('\n\n').map(p => `<p style="margin: 0 0 16px 0; font-family: Inter, sans-serif; font-size: 15px; line-height: 1.6;">${p.trim()}</p>`).join('\n');

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
        <div class="DocsEditor-paper" style="width: 794px; padding: 76px 68px; box-sizing: border-box;">
          <div class="ProseMirror" id="editor">
            ${paragraphs}
          </div>
        </div>
      </body>
    </html>
  `;

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  // Measure in editor
  const snapResult = await win.webContents.executeJavaScript(`
    (() => {
      const editor = document.getElementById('editor');
      const containerRect = editor.getBoundingClientRect();
      const A4_CONTENT_HEIGHT = 971;

      // Collect all lines
      const lines = [];
      for (let b of editor.children) {
        const range = document.createRange();
        range.selectNodeContents(b);
        const rects = range.getClientRects();
        for (let r of rects) {
          lines.push({
            top: r.top - containerRect.top,
            bottom: r.bottom - containerRect.top,
            height: r.height,
            text: b.innerText
          });
        }
      }

      // Find break point
      let lastLineOnPage1 = null;
      let firstLineOnPage2 = null;
      let breakY = A4_CONTENT_HEIGHT;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].bottom > A4_CONTENT_HEIGHT) {
          lastLineOnPage1 = lines[i - 1];
          firstLineOnPage2 = lines[i];
          breakY = lastLineOnPage1.bottom + (firstLineOnPage2.top - lastLineOnPage1.bottom) / 2;
          break;
        }
      }

      return {
        totalLines: lines.length,
        breakY,
        lastLineBottom: lastLineOnPage1?.bottom,
        firstLineTop: firstLineOnPage2?.top,
      };
    })()
  `);

  console.log('Snap Calculation:', snapResult);

  // Generate PDF and verify where Chromium breaks
  const pdf = await win.webContents.printToPDF({
    printBackground: true,
    pageSize: 'A4',
    preferCSSPageSize: true,
  });
  fs.writeFileSync('/tmp/test_a4_match.pdf', pdf);

  app.quit();
});
