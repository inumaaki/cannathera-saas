import type { ReportData } from './reports.service';
export declare function reportHtml(d: ReportData, logoDataUri: string | null): string;
export declare function footerTemplate(d: ReportData): string;
export declare function renderReportPdf(d: ReportData): Promise<Buffer>;
