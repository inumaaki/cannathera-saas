"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportHtml = reportHtml;
exports.footerTemplate = footerTemplate;
exports.renderReportPdf = renderReportPdf;
const TYPE_TITLE = {
    MONTHLY: 'Monatsreport',
    QUARTERLY: 'Quartalsbericht',
    YEARLY: 'Jahresbericht',
    LONG_TERM: 'Langzeit-Verlaufsbericht',
};
const de = (d) => d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
function dosageChart(weeks) {
    if (!weeks.length)
        return '<p class="empty">Keine Dosierungsdaten im Zeitraum.</p>';
    const max = Math.max(...weeks.map((w) => w.avgG ?? 0), 0.1);
    const W = 640;
    const TOP = 16;
    const H = 140;
    const gap = 14;
    const bw = Math.min(70, (W - gap * (weeks.length + 1)) / weeks.length);
    const base = TOP + H;
    return `<svg viewBox="0 0 ${W} ${base + 26}" class="chart">
    ${weeks
        .map((w, i) => {
        const h = ((w.avgG ?? 0) / max) * H;
        const x = gap + i * (bw + gap);
        const y = base - h;
        return `
        <rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="4" fill="#066c41" />
        <text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" class="bar-val">${(w.avgG ?? 0).toFixed(2)} g</text>
        <text x="${x + bw / 2}" y="${base + 16}" text-anchor="middle" class="bar-lbl">${esc(w.label)}</text>`;
    })
        .join('')}
    <line x1="0" y1="${base}" x2="${W}" y2="${base}" stroke="#d9d9d9" />
  </svg>`;
}
function metricRow(m) {
    if (m.start == null || m.end == null) {
        return `<tr><td class="m-label">${esc(m.label)}</td><td colspan="3" class="empty">Keine Daten</td></tr>`;
    }
    const improving = m.changePct != null &&
        m.changePct !== 0 &&
        (m.betterWhenDown ? m.changePct < 0 : m.changePct > 0);
    const badge = m.changePct == null
        ? '<span class="badge neutral">—</span>'
        : `<span class="badge ${improving ? 'good' : m.changePct === 0 ? 'neutral' : 'bad'}">${m.changePct > 0 ? '+' : ''}${m.changePct} %</span>`;
    const pct = (v) => Math.min(100, (v / 10) * 100);
    return `<tr>
    <td class="m-label">${esc(m.label)}</td>
    <td class="m-val">${m.start}<span class="unit">${esc(m.unit)}</span></td>
    <td class="m-bar">
      <div class="track"><div class="fill ${improving ? 'good' : 'bad'}" style="width:${pct(m.end)}%"></div></div>
    </td>
    <td class="m-val end">${m.end}<span class="unit">${esc(m.unit)}</span> ${badge}</td>
  </tr>`;
}
function reportHtml(d, logoDataUri) {
    const title = TYPE_TITLE[d.type] ?? 'Verlaufsbericht';
    const period = `${de(d.periodStart)} – ${de(d.periodEnd)}`;
    return `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<style>
  /* margins come from puppeteer's pdf() so the running footer has room */
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", Arial, sans-serif;
    color: #1f2937; font-size: 11px; margin: 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  /* Client requirement: logo watermark, low opacity, in the white content area.
     A fixed-position element repeats on every printed page in Chromium. */
  .watermark {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    opacity: .05; z-index: 0; pointer-events: none;
  }
  .watermark img { width: 360px; }
  .page { position: relative; z-index: 1; }
  h2, .card, .summary, .flag, table { break-inside: avoid; }

  header { display: flex; justify-content: space-between; align-items: flex-start;
           border-bottom: 3px solid #0b4d34; padding-bottom: 10px; }
  .brand { font-size: 22px; font-weight: 800; color: #0b4d34; letter-spacing: .5px; }
  .tagline { font-size: 8.5px; letter-spacing: 1.6px; color: #707973; text-transform: uppercase; }
  .doc-title { font-size: 16px; font-weight: 800; color: #0b4d34; text-align: right; }
  .doc-sub { font-size: 10px; color: #6b7280; text-align: right; margin-top: 2px; }
  .practice { font-size: 9px; color: #707973; text-align: right; margin-top: 4px; }

  .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 12px 0 4px; }
  .meta div { background: #f8f8f6; border: 1px solid #e6e8e6; border-radius: 6px; padding: 7px 9px; }
  .meta .k { font-size: 8px; text-transform: uppercase; letter-spacing: .8px; color: #707973; }
  .meta .v { font-size: 12px; font-weight: 700; color: #0b4d34; margin-top: 2px; }

  h2 { font-size: 12px; color: #0b4d34; margin: 16px 0 7px;
       border-left: 4px solid #f97316; padding-left: 7px; }
  .chart { width: 100%; height: auto; }
  .bar-val { font-size: 9px; fill: #0b4d34; font-weight: 700; }
  .bar-lbl { font-size: 9px; fill: #6b7280; }

  table { width: 100%; border-collapse: collapse; }
  td, th { padding: 6px 8px; vertical-align: middle; }
  tbody tr { border-bottom: 1px solid #eef0ee; }
  .m-label { font-weight: 600; width: 30%; }
  .m-val { font-weight: 700; color: #0b4d34; white-space: nowrap; width: 14%; }
  .m-val.end { width: 24%; text-align: right; }
  .unit { font-weight: 400; color: #9aa3a0; font-size: 9px; margin-left: 1px; }
  .m-bar { width: 32%; }
  .track { background: #eef1f8; height: 7px; border-radius: 4px; overflow: hidden; }
  .fill { height: 100%; border-radius: 4px; }
  .fill.good { background: #066c41; }
  .fill.bad  { background: #e66a12; }
  .badge { display: inline-block; font-size: 9px; font-weight: 700; padding: 1px 6px;
           border-radius: 20px; margin-left: 5px; }
  .badge.good { background: #dff3e7; color: #066c41; }
  .badge.bad  { background: #fdece0; color: #c2560c; }
  .badge.neutral { background: #eef1f8; color: #6b7280; }

  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .card { border: 1px solid #e6e8e6; border-radius: 8px; padding: 9px 11px; background: #fff; }
  .card h3 { margin: 0 0 5px; font-size: 10px; text-transform: uppercase;
             letter-spacing: .8px; color: #707973; }
  .big { font-size: 20px; font-weight: 800; color: #0b4d34; }
  ul { margin: 4px 0 0; padding-left: 15px; }
  li { margin: 3px 0; }
  .chip { display: inline-block; background: #fdece0; color: #c2560c; border-radius: 20px;
          padding: 2px 8px; font-size: 9.5px; font-weight: 600; margin: 2px 3px 0 0; }
  .chip.ok { background: #dff3e7; color: #066c41; }
  .flag { border-left: 3px solid #dc2626; background: #fef2f2; padding: 5px 8px;
          border-radius: 4px; margin-top: 4px; font-size: 10px; }
  .flag.warn { border-color: #ca8a04; background: #fdf7e6; }
  .summary { background: #f8f8f6; border: 1px solid #e6e8e6; border-left: 4px solid #0b4d34;
             border-radius: 6px; padding: 9px 11px; line-height: 1.5; }
  .disclaimer { margin-top: 10px; font-size: 8.5px; color: #707973; line-height: 1.45; }
  .empty { color: #9aa3a0; font-style: italic; }

  .powered { font-weight: 700; color: #0b4d34; }
</style></head>
<body>
  ${logoDataUri ? `<div class="watermark"><img src="${logoDataUri}" alt=""></div>` : ''}
  <div class="page">
    <header>
      <div>
        <div class="brand">CANNATHERA</div>
        <div class="tagline">Struktur · Orientierung · Verbindlichkeit</div>
      </div>
      <div>
        <div class="doc-title">${esc(title)}</div>
        <div class="doc-sub">Cannabis-Therapiebegleitung · ${esc(period)}</div>
        ${d.practice?.name ? `<div class="practice">${esc(d.practice.name)}</div>` : ''}
      </div>
    </header>

    <div class="meta">
      <div><div class="k">Patient:in</div><div class="v">${esc(d.patient.name || '—')}</div></div>
      <div><div class="k">Patienten-ID</div><div class="v">${esc(d.patient.patientRef ?? '—')}</div></div>
      <div><div class="k">Therapietag</div><div class="v">${d.patient.therapyDay ?? '—'}</div></div>
      <div><div class="k">Erstellt am</div><div class="v">${de(d.generatedAt)}</div></div>
    </div>

    <h2>1. Dosierungsverlauf (Blüten)</h2>
    ${dosageChart(d.dosage.weeks)}
    <div class="cols" style="margin-top:6px">
      <div class="card"><h3>Durchschnittliche Tagesdosis</h3>
        <div class="big">${d.dosage.avgDailyG != null ? d.dosage.avgDailyG.toFixed(2) + ' g' : '—'}</div></div>
      <div class="card"><h3>Gesamtmenge im Zeitraum</h3>
        <div class="big">${d.dosage.totalG.toFixed(2)} g</div></div>
    </div>

    <h2>2. Sortenverlauf</h2>
    ${d.strains.length
        ? `<div>${d.strains
            .map((s) => `<span class="chip ok">${esc(s.name)} · ${s.days} Tage</span>`)
            .join('')}</div>
           ${d.strains.length === 1 ? '<p style="margin:6px 0 0" class="empty">Keine Sortenumstellung im Zeitraum.</p>' : ''}`
        : '<p class="empty">Keine Sortenangaben im Zeitraum.</p>'}

    <h2>3. Entwicklung im Verlauf</h2>
    <table><tbody>${d.metrics.map(metricRow).join('')}</tbody></table>

    <h2>4. Nebenwirkungen &amp; Therapietreue</h2>
    <div class="cols">
      <div class="card"><h3>Nebenwirkungen</h3>
        ${d.sideEffects.length
        ? d.sideEffects.map((s) => `<span class="chip">${esc(s)}</span>`).join('')
        : '<span class="chip ok">Keine berichtet</span>'}
      </div>
      <div class="card"><h3>Therapietreue</h3>
        <div class="big">${d.adherence.pct} %</div>
        <div style="color:#6b7280">${d.adherence.loggedDays} von ${d.adherence.totalDays} Tagen dokumentiert</div>
      </div>
    </div>

    <h2>5. Therapiezufriedenheit &amp; Zielerreichung</h2>
    <div class="cols">
      <div class="card"><h3>Zufriedenheit</h3>
        <div class="big">${d.satisfaction != null ? d.satisfaction + ' / 10' : '—'}</div></div>
      <div class="card"><h3>Therapieziele</h3>
        <div class="big" style="font-size:14px">${esc(d.goalsReached ?? '—')}</div></div>
    </div>
    ${d.notes ? `<div class="card" style="margin-top:8px"><h3>Bemerkungen der Patient:in</h3><em>„${esc(d.notes)}"</em></div>` : ''}

    ${d.redFlags.length
        ? `<h2>6. Ärztlich zu prüfende Hinweise</h2>
           ${d.redFlags
            .map((f) => `<div class="flag ${f.severity === 'CRITICAL' ? '' : 'warn'}">
                    <strong>${f.severity === 'CRITICAL' ? 'Kritisch' : 'Warnung'}:</strong> ${esc(f.message)}
                    <span style="color:#707973"> (${de(f.createdAt)})</span>
                  </div>`)
            .join('')}`
        : ''}

    <h2>${d.redFlags.length ? '7' : '6'}. Vorbereitung für den nächsten Arzttermin</h2>
    <ul>${d.nextAppointmentPrep.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>

    <h2>${d.redFlags.length ? '8' : '7'}. Cannathera-Zusammenfassung</h2>
    <div class="summary">${esc(d.summary)}</div>

    <p class="disclaimer">
      Dieser Report dient ausschließlich der strukturierten Dokumentation und Reflexion des
      Therapieverlaufs. Cannathera stellt keine Diagnosen, trifft keine Therapieentscheidungen
      und ersetzt keine ärztliche Beratung. Die medizinische Bewertung verbleibt jederzeit bei
      der behandelnden Ärztin / dem behandelnden Arzt. Verarbeitung DSGVO-konform auf Grundlage
      der Einwilligung der Patient:in (Art. 9 DSGVO).
    </p>
  </div>
</body></html>`;
}
function footerTemplate(d) {
    const period = `${de(d.periodStart)} – ${de(d.periodEnd)}`;
    return `<div style="width:100%; font-size:8px; color:#707973;
      font-family:'Segoe UI',Arial,sans-serif; padding:0 14mm;
      border-top:1px solid #d9d9d9; margin-top:4mm;
      display:flex; justify-content:space-between; align-items:center;">
    <span>${esc(d.patient.patientRef ?? '')} · ${esc(period)}</span>
    <span>Seite <span class="pageNumber"></span> / <span class="totalPages"></span></span>
    <span style="font-weight:700; color:#0b4d34;">Powered by Cannathera</span>
  </div>`;
}
async function renderReportPdf(d) {
    const puppeteer = await import('puppeteer');
    const fs = await import('fs/promises');
    const path = await import('path');
    let logoDataUri = null;
    const candidates = [
        d.practice?.logoUrl
            ? path.join(process.cwd(), d.practice.logoUrl.replace(/^\//, ''))
            : null,
        path.join(process.cwd(), '..', 'web', 'public', 'brand', 'logo-transparent.png'),
    ].filter(Boolean);
    for (const file of candidates) {
        try {
            const buf = await fs.readFile(file);
            const ext = path.extname(file).slice(1).toLowerCase();
            const mime = ext === 'svg' ? 'image/svg+xml' : ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
            logoDataUri = `data:${mime};base64,${buf.toString('base64')}`;
            break;
        }
        catch {
        }
    }
    const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-dev-shm-usage'],
    });
    try {
        const page = await browser.newPage();
        await page.setContent(reportHtml(d, logoDataUri), { waitUntil: 'load' });
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            displayHeaderFooter: true,
            headerTemplate: '<div></div>',
            footerTemplate: footerTemplate(d),
            margin: { top: '16mm', bottom: '22mm', left: '14mm', right: '14mm' },
        });
        return Buffer.from(pdf);
    }
    finally {
        await browser.close();
    }
}
//# sourceMappingURL=report-template.js.map