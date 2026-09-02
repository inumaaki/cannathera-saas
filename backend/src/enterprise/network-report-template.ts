export async function renderNetworkReportPdf(data: any): Promise<Buffer> {
  const puppeteer = await import('puppeteer');

  const de = (d: Date | string) => {
    if (!d) return '—';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const esc = (s: string) =>
    (s || '').toString().replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c]!,
    );

  const html = `
    <!DOCTYPE html>
    <html lang="de">
    <head>
      <meta charset="utf-8">
      <title>Network Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; font-size: 13px; line-height: 1.5; background: #fff; }
        .header { border-bottom: 2px solid #066c41; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .title { font-size: 24px; font-weight: 700; color: #0f4c3a; margin: 0; }
        .subtitle { font-size: 14px; color: #64748b; margin-top: 4px; }
        .stats-grid { display: flex; gap: 20px; margin-bottom: 40px; }
        .stat-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background: #f8fafc; }
        .stat-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 8px; font-weight: 600; }
        .stat-value { font-size: 24px; font-weight: 700; color: #0f4c3a; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 12px 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600; background: #f8fafc; }
        td { font-size: 13px; }
        .type-badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
        .type-PHARMACY { background: #e0f2fe; color: #0369a1; }
        .type-PRACTICE { background: #dcfce7; color: #15803d; }
        .text-right { text-align: right; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="title">Monthly Network Report</h1>
          <div class="subtitle">${esc(data.enterpriseName)}</div>
        </div>
        <div style="text-align: right; color: #64748b; font-size: 12px;">
          Generated: ${de(new Date())}<br>
          Confidential
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-box">
          <div class="stat-label">Connected Partners</div>
          <div class="stat-value">${data.partners.total}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${data.partners.pharmacies} Pharmacies, ${data.partners.practices} Practices</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Total Patients</div>
          <div class="stat-value">${data.patients}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${data.activePatients} Active this month</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Therapy Reviews</div>
          <div class="stat-value">${data.reviewsThisMonth}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${data.overdueReviews > 0 ? `<span style="color:#dc2626">${data.overdueReviews} Overdue</span>` : '0 Overdue'}</div>
        </div>
        <div class="stat-box">
          <div class="stat-label">Network Health</div>
          <div class="stat-value">${data.avgAdherence}%</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Avg. Adherence Rate</div>
        </div>
      </div>

      <h2 style="font-size: 16px; font-weight: 600; color: #0f4c3a; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Network Overview (Top Partners)</h2>
      
      <table>
        <thead>
          <tr>
            <th>Partner Name</th>
            <th>Type</th>
            <th>Location</th>
            <th class="text-right">Patients</th>
            <th class="text-right">Overdue</th>
            <th class="text-right">Adherence</th>
          </tr>
        </thead>
        <tbody>
          ${data.topPartners
            .map(
              (p: any) => `
            <tr>
              <td style="font-weight: 500;">${esc(p.name)}</td>
              <td><span class="type-badge type-${p.type}">${esc(p.type)}</span></td>
              <td>${esc(p.city) || '—'}</td>
              <td class="text-right">${p.patients}</td>
              <td class="text-right" style="color: ${p.overdue > 0 ? '#dc2626' : 'inherit'}; font-weight: ${p.overdue > 0 ? '600' : 'normal'}">${p.overdue}</td>
              <td class="text-right">${p.avgAdherence}%</td>
            </tr>
          `,
            )
            .join('')}
        </tbody>
      </table>
      
      ${data.topPartners.length === 0 ? '<div style="padding: 30px; text-align: center; color: #64748b; background: #f8fafc; border-radius: 8px; margin-top: 15px;">No partners active yet.</div>' : ''}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    return Buffer.from(pdfBytes);
  } finally {
    await browser.close();
  }
}
