const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const markdownPath = path.join(__dirname, '..', 'Documentation', 'SRS_BohlokoFamilyFarm.md');
const outputPath = path.join(__dirname, '..', 'Documentation', 'SRS_BohlokoFamilyFarm.pdf');

const markdown = fs.readFileSync(markdownPath, 'utf8');

function mdToHtml(md) {
  let html = md;

  // Code blocks (``` ... ```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    return `<pre><code class="lang-${lang}">${escaped}</code></pre>`;
  });

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_, header, sep, body) => {
    const headers = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
    const rows = body.trim().split('\n').map(row => {
      const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    return `<table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
  });

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rules
  html = html.replace(/^---+$/gm, '<hr>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

  // Paragraphs (lines that aren't already wrapped)
  html = html.split('\n\n').map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<h') || block.startsWith('<table') || block.startsWith('<pre') ||
        block.startsWith('<ul') || block.startsWith('<hr') || block.startsWith('<ol')) {
      return block;
    }
    // Check if it's a single-line block that's already an HTML tag
    if (block.split('\n').length === 1 && /^<\//.test(block)) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  return html;
}

const bodyHtml = mdToHtml(markdown);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SRS - Bohloko Family Farm</title>
<style>
  @page {
    size: A4;
    margin: 20mm 18mm 20mm 18mm;
  }
  * { box-sizing: border-box; }
  body {
    font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    font-size: 11px;
    line-height: 1.5;
    color: #1a1a1a;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  h1 {
    font-size: 22px;
    color: #1B4332;
    border-bottom: 3px solid #1B4332;
    padding-bottom: 8px;
    margin-top: 30px;
    page-break-after: avoid;
  }
  h2 {
    font-size: 17px;
    color: #1B4332;
    border-bottom: 2px solid #D4A843;
    padding-bottom: 5px;
    margin-top: 25px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 14px;
    color: #2D6A4F;
    margin-top: 18px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 12px;
    color: #40916C;
    margin-top: 14px;
    page-break-after: avoid;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0;
    font-size: 10px;
    page-break-inside: auto;
  }
  thead {
    background: #1B4332;
    color: white;
  }
  th {
    padding: 6px 8px;
    text-align: left;
    font-weight: 600;
    white-space: nowrap;
  }
  td {
    padding: 5px 8px;
    border-bottom: 1px solid #e0e0e0;
    vertical-align: top;
  }
  tr:nth-child(even) {
    background: #f8f9fa;
  }
  pre {
    background: #f4f4f4;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    font-size: 9.5px;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  code {
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 10px;
  }
  pre code {
    font-size: 9.5px;
  }
  p {
    margin: 6px 0;
    text-align: justify;
  }
  ul {
    margin: 4px 0;
    padding-left: 20px;
  }
  li {
    margin: 2px 0;
  }
  hr {
    border: none;
    border-top: 1px solid #ccc;
    margin: 20px 0;
  }
  strong {
    color: #1B4332;
  }
  a {
    color: #2D6A4F;
  }
  .cover {
    text-align: center;
    padding: 80px 20px;
    page-break-after: always;
  }
  .cover h1 {
    font-size: 32px;
    border: none;
    color: #1B4332;
    margin-bottom: 10px;
  }
  .cover h2 {
    font-size: 20px;
    border: none;
    color: #D4A843;
    font-weight: 400;
  }
  .cover .meta {
    margin-top: 60px;
    font-size: 12px;
    color: #666;
    line-height: 2;
  }
</style>
</head>
<body>
<div class="cover">
  <h1>Software Requirements Specification</h1>
  <h2>Bohloko Family Farm<br>Integrated Poultry Management System</h2>
  <div class="meta">
    <p><strong>Version:</strong> 1.0</p>
    <p><strong>Date:</strong> August 2026</p>
    <p><strong>Prepared by:</strong> Automated Codebase Analysis</p>
    <p><strong>Status:</strong> Active Development</p>
  </div>
</div>
${bodyHtml}
</body>
</html>`;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '18mm', right: '18mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: '<div style="font-size:9px; text-align:center; width:100%; color:#999;">Bohloko Family Farm SRS v1.0 — Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  });
  await browser.close();
  console.log(`PDF generated: ${outputPath}`);
})();
