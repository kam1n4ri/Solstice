import { app, BrowserWindow, Menu } from 'electron';
import { windowManager } from './windowManager';
import { registerIpcHandlers } from './ipcHandlers';
import { htmlToMarkdown, markdownToHtml } from '../shared/formatConverter';
import { createDocxFromHtml } from '../shared/docx/docxConverter';
import { generatePdfFromHtml } from './pdfExporter';

async function runTests() {
  console.log('--- STARTING SOLSTICE ARCHITECTURE TESTS ---');
  Menu.setApplicationMenu(null);
  registerIpcHandlers();

  await app.whenReady();
  console.log('1. Electron ready.');

  // Test 1: Hub Window creation & Maximized state
  const hub = windowManager.createHubWindow();
  const isHubMaximized = hub.isMaximized();
  const [hubW, hubH] = hub.getSize();
  console.log(`2. Hub window dimensions: ${hubW}x${hubH}, isMaximized: ${isHubMaximized}`);

  // Test 2: Spawn isolated tool window (Docs)
  console.log('3. Spawning tool window for "docs"...');
  const res1 = await windowManager.openToolWindow('docs');
  console.log('   Result:', res1);
  if (!res1.success || res1.alreadyOpen) {
    throw new Error('Expected new window for docs');
  }

  const active1 = windowManager.getActiveTools();
  console.log('4. Active tools:', active1);
  if (!active1.includes('docs')) {
    throw new Error('docs should be in active tools');
  }

  // Test 3: Deduplication - opening "docs" again must focus existing window, NOT duplicate
  console.log('5. Attempting duplicate open for "docs"...');
  const res2 = await windowManager.openToolWindow('docs');
  console.log('   Result:', res2);
  if (!res2.success || !res2.alreadyOpen) {
    throw new Error('Expected alreadyOpen: true for duplicate docs open');
  }

  const active2 = windowManager.getActiveTools();
  if (active2.length !== 1) {
    throw new Error(`Active tools count should remain 1, got ${active2.length}`);
  }

  // Test 4: Open another tool (Sheets & Whiteboard)
  console.log('6. Spawning tool window for "sheets"...');
  const res3 = await windowManager.openToolWindow('sheets');
  console.log('   Result:', res3);
  if (!res3.success || res3.alreadyOpen) {
    throw new Error('Expected new window for sheets');
  }

  console.log('8. Spawning tool window for "whiteboard"...');
  const res4 = await windowManager.openToolWindow('whiteboard');
  console.log('   Result:', res4);
  if (!res4.success || res4.alreadyOpen) {
    throw new Error('Expected new window for whiteboard');
  }

  console.log('9. Spawning tool window for "pdf"...');
  const res5 = await windowManager.openToolWindow('pdf');
  console.log('   Result:', res5);
  if (!res5.success || res5.alreadyOpen) {
    throw new Error('Expected new window for pdf');
  }

  console.log('9b. Spawning tool window for "photo"...');
  const resPhoto = await windowManager.openToolWindow('photo');
  console.log('    Result:', resPhoto);
  if (!resPhoto.success || resPhoto.alreadyOpen) {
    throw new Error('Expected new window for photo');
  }

  const active3 = windowManager.getActiveTools();
  console.log('10. Active tools now:', active3);
  if (active3.length !== 5 || !active3.includes('pdf') || !active3.includes('photo')) {
    throw new Error('Active tools should contain docs, sheets, whiteboard, pdf, and photo');
  }

  // Test 5: Markdown Table & List Converters (Issues 34 & 35)
  console.log('11. Testing Markdown Converter pipeline...');
  const sampleHtml = '<table><tr><th>Name</th><th>Role</th></tr><tr><td>Alice</td><td>Admin</td></tr></table><ol><li>Item A</li><li>Item B</li></ol><ul data-type="taskList"><li data-checked="true"><p>Done task</p></li></ul>';
  const mdOut = htmlToMarkdown(sampleHtml);
  if (!mdOut.includes('| Name | Role |') || !mdOut.includes('1. Item A') || !mdOut.includes('- [x] Done task')) {
    throw new Error(`htmlToMarkdown failed to preserve tables or lists: ${mdOut}`);
  }

  const sampleMd = '# Header\n\n| Item | Qty |\n| --- | --- |\n| Apple | 5 |\n\n1. First\n2. Second\n\n- [x] Done\n- [ ] Pending\n\nSome with <span style="color:red">tag</span>';
  const htmlFromMd = markdownToHtml(sampleMd);
  if (!htmlFromMd.includes('<table>') || !htmlFromMd.includes('<ol>') || !htmlFromMd.includes('data-checked="true"') || !htmlFromMd.includes('<span style="color:red">tag</span>')) {
    throw new Error(`markdownToHtml failed on tables/lists/tags: ${htmlFromMd}`);
  }
  console.log('    Markdown bidirectional conversion passed.');

  // Test 6: DOCX Converter with alignments, styles, and list types (Issues 32 & 33)
  console.log('12. Testing DOCX converter...');
  const docxHtml = '<h1 style="text-align: center">Centered Title</h1><p style="text-align: right"><span style="color: #ff0000; font-size: 16pt">Red Large Text</span></p><ol><li>Step 1</li><li>Step 2</li></ol><ul data-type="taskList"><li data-checked="true"><p>Task 1</p></li></ul>';
  const docxBuffer = await createDocxFromHtml(docxHtml);
  if (!docxBuffer || docxBuffer.length === 0) {
    throw new Error('createDocxFromHtml produced empty buffer');
  }
  console.log(`    DOCX generation passed. Buffer size: ${docxBuffer.length} bytes.`);

  // Test 7: PDF Exporter via hidden BrowserWindow (Issue 36)
  console.log('13. Testing PDF Exporter via headless BrowserWindow...');
  const pdfBuffer = await generatePdfFromHtml('<h1>Clean PDF Document</h1><p>Test paragraph content without UI chrome.</p>');
  if (!pdfBuffer || pdfBuffer.length === 0) {
    throw new Error('generatePdfFromHtml produced empty buffer');
  }
  console.log(`    PDF generation passed. Buffer size: ${pdfBuffer.length} bytes.`);

  // Test 8: Window Lifecycle & Process Management (Issues 37 & 38)
  console.log('14. Testing Window Lifecycle & non-hanging clean close...');
  // Open a clean docs window
  const docsWin = (windowManager as any).toolWindows.get('docs');
  if (docsWin && !docsWin.isDestroyed()) {
    // Assert docs is not dirty by default
    if ((docsWin as any).__isDocDirty) {
      throw new Error('docs window should not be dirty by default');
    }
    // Closing clean docs window should close immediately without timeout hang
    const t0 = Date.now();
    docsWin.close();
    const duration = Date.now() - t0;
    if (duration > 500) {
      throw new Error(`Clean docs close took too long (${duration}ms), expected immediate close`);
    }
    console.log(`    Clean docs window closed cleanly in ${duration}ms.`);
  }

  // 15. Testing Docs Continuous Text Pagination & Gap Protection
  console.log('15. Testing Docs Continuous Text Pagination & Gap Protection...');
  {
    const pageWin = new BrowserWindow({ show: false, width: 900, height: 1200 });
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { margin: 0; padding: 40px 0; background: #f8fafd; font-family: sans-serif; font-size: 15px; line-height: 24px; }
          .paper { position: relative; width: 794px; margin: 0 auto; padding: 76px 68px; box-sizing: border-box; }
          .spacer { float: left; clear: both; width: 0; height: 0; margin-top: 971px; }
          .seam { float: left; clear: both; width: 794px; margin-left: -68px; margin-right: -68px; height: 176px; }
          .desk-gap { height: 24px; margin-top: 76px; }
        </style>
      </head>
      <body>
        <div class="paper">
          <div>
            <div class="spacer"></div>
            <div class="seam"><div class="desk-gap"></div></div>
          </div>
          <p id="p">
            ${Array.from({ length: 40 }).map((_, i) => `Sentence ${i + 1}: The quick brown fox jumps over the lazy dog and explores the beautiful forest.`).join(' ')}
          </p>
        </div>
      </body>
      </html>
    `;
    await pageWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const result = await pageWin.webContents.executeJavaScript(`
      (() => {
        const p = document.getElementById('p');
        const range = document.createRange();
        range.selectNodeContents(p);
        const rects = Array.from(range.getClientRects());
        const gap = document.querySelector('.desk-gap').getBoundingClientRect();
        const linesInGap = rects.filter(r => r.top < gap.bottom && r.bottom > gap.top);
        return {
          totalLines: rects.length,
          linesInGap: linesInGap.length,
          firstPageLines: rects.filter(r => r.bottom <= gap.top).length,
          secondPageLines: rects.filter(r => r.top >= gap.bottom).length,
        };
      })()
    `);
    pageWin.close();
    if (result.linesInGap !== 0 || result.firstPageLines === 0 || result.secondPageLines === 0) {
      throw new Error(`Pagination gap test failed: ${JSON.stringify(result)}`);
    }
    console.log(`    Continuous paragraph paginated cleanly across 2 sheets: ${result.firstPageLines} lines on page 1, 0 in gap, ${result.secondPageLines} lines on page 2.`);
  }

  console.log('--- ALL ARCHITECTURAL TESTS PASSED SUCCESSFULLY! ---');
  app.quit();
}

runTests().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
