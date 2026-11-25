import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';
import { decryptPdf } from '../src/shared/pdf/decryptPdf';
import { htmlToMarkdown, markdownToHtml } from '../src/shared/formatConverter';
import { createDocxFromHtml } from '../src/shared/docx/docxConverter';
import { findMatchesInDoc } from '../src/renderer/components/docs/docsSearchHelper';
import { compareVersions, selectPlatformDownloadUrl } from '../src/renderer/lib/hub/updatesService';
import { Schema } from '@tiptap/pm/model';

export async function runAllTests(): Promise<void> {
  const results: string[] = [];

  // 1. Markdown <-> HTML & XSS sanitization
  {
    const sampleHtml =
      '<table><tr><th>Col</th></tr><tr><td>Val</td></tr></table><ol><li>One</li><li>Two</li></ol><ul data-type="taskList"><li data-checked="true"><p>Done</p></li></ul>';
    const md = htmlToMarkdown(sampleHtml);
    assert.ok(md.includes('| Col |'), 'Markdown table missing');
    assert.ok(md.includes('1. One') && md.includes('2. Two'), 'Ordered list missing');
    assert.ok(md.includes('- [x] Done'), 'Task list checkbox missing');

    const unsafeMd =
      '# Title\n\n<script>alert(1)</script><img src="x" onerror="alert(2)">[bad](javascript:alert(3)) [ok](https://example.com)';
    const safeHtml = markdownToHtml(unsafeMd);
    assert.ok(!safeHtml.includes('<script'), 'Script tag was not stripped');
    assert.ok(!safeHtml.includes('onerror='), 'Inline event handler was not stripped');
    assert.ok(!safeHtml.includes('javascript:'), 'javascript: link was not stripped');
    assert.ok(safeHtml.includes('https://example.com'), 'Safe HTTPS link was removed');
    results.push('formatConverter + markdown XSS sanitization');
  }

  // 2. DOCX binary generation produces valid ZIP archive
  {
    const buf = await createDocxFromHtml('<h1>Hello</h1><p>World</p>');
    assert.ok(buf.length > 100, 'DOCX output unexpectedly small');
    assert.equal(buf[0], 0x50, 'DOCX missing PK header byte 0');
    assert.equal(buf[1], 0x4b, 'DOCX missing PK header byte 1');
    results.push('docxConverter binary PKZip output');
  }

  // 3. Docs Find & Replace helper (whitespace, non-overlapping, sentinel across inline atoms)
  {
    const schema = new Schema({
      nodes: {
        doc: { content: 'block+' },
        paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
        text: { group: 'inline' },
        image: { group: 'inline', inline: true, atom: true, toDOM: () => ['img'] },
      },
    });
    const doc = schema.node('doc', null, [
      schema.node('paragraph', null, [
        schema.text('aaaa  foo'),
        schema.node('image'),
        schema.text('bar'),
      ]),
    ]);

    const nonOverlap = findMatchesInDoc(doc, 'aa', false);
    assert.equal(nonOverlap.length, 2, 'aa in aaaa should yield 2 non-overlapping matches');

    const spaces = findMatchesInDoc(doc, '  ', false);
    assert.equal(spaces.length, 1, 'Whitespace-only search should match double spaces');

    const acrossImg = findMatchesInDoc(doc, 'foobar', false);
    assert.equal(acrossImg.length, 0, 'Search must not match across inline non-text nodes');
    results.push('docsSearchHelper non-overlapping + whitespace + sentinel');
  }

  // 4. PDF Encrypt -> Decrypt round-trip & wrong-password rejection
  {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]).drawText('Secret Page');
    const plainBytes = await doc.save();
    const encryptedBytes = await encryptPDF(plainBytes, 'pass123');

    await assert.rejects(
      () => decryptPdf(encryptedBytes, 'wrongpass'),
      /password|decrypt/i,
      'Wrong password should be rejected'
    );

    const unlocked = await decryptPdf(encryptedBytes, 'pass123');
    assert.equal(unlocked.wasEncrypted, true, 'Expected PDF to report wasEncrypted=true');
    const reloaded = await PDFDocument.load(unlocked.bytes);
    assert.equal(reloaded.getPageCount(), 1, 'Unlocked PDF page count mismatch');
    results.push('PDF encrypt -> decrypt round-trip');
  }

  // 5. Hub Updates version comparison & release asset selection
  {
    assert.ok(compareVersions('v0.2.0', 'v0.1.9') > 0);
    assert.ok(compareVersions('v0.2.0-beta.1', 'v0.2.0') < 0);
    assert.equal(compareVersions('v0.1.0', '0.1.0'), 0);

    const assets = [
      { name: 'Solstice_0.2.0_amd64.AppImage', browser_download_url: 'https://example.com/app.AppImage' },
      { name: 'Solstice_0.2.0_x64-setup.exe', browser_download_url: 'http://insecure.example.com/setup.exe' },
    ];
    const selected = selectPlatformDownloadUrl(assets);
    assert.equal(selected, 'https://example.com/app.AppImage');
    results.push('updatesService semver + asset filtering');
  }

  console.log(`Passed ${results.length} TypeScript unit test suites:`);
  for (const name of results) {
    console.log(`  ✓ ${name}`);
  }
}
