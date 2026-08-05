import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI | null = null;
  private readonly logger = new Logger(AiService.name);

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY is missing from environment. AI features will fail gracefully.',
      );
    }
  }

  async generateClinicalSummary(
    patientName: string,
    periodStart: string,
    periodEnd: string,
    logsData: any,
  ): Promise<string> {
    if (!this.openai) {
      return this.fallbackSummary(logsData);
    }

    const systemPrompt = `
Du bist ein erfahrener, medizinischer KI-Assistent für eine Cannabinoid-Therapie-Plattform.
Deine Aufgabe ist es, aus den vorgegebenen täglichen Aufzeichnungen (Tagesprotokollen) und monatlichen Fragebögen eines Patienten eine objektive, präzise und professionelle klinische Zusammenfassung in deutscher Sprache für den behandelnden Arzt zu verfassen.

WICHTIGE REGELN:
1. Der Ton muss sachlich, objektiv und medizinisch-professionell sein.
2. Vermeide blumige oder wertende Sprache.
3. Strukturiere die Zusammenfassung logisch (z.B. Adhärenz, Symptomverlauf, Nebenwirkungen, Besonderheiten).
4. Wenn keine Nebenwirkungen gemeldet wurden, erwähne explizit, dass die Therapie gut vertragen wurde.
5. Fasse den Text in 2-3 flüssig lesbaren Absätzen zusammen, nutze keine Stichpunktlisten, es sei denn es ist absolut notwendig für die Übersicht.
6. Erwähne keine Patienten-Namen direkt, nutze Formulierungen wie "Der/Die Patient:in".
`;

    const userMessage = `
Hier sind die Daten für den Zeitraum vom ${periodStart} bis ${periodEnd} für den/die Patient:in ${patientName}.

Therapiedaten (als JSON):
${JSON.stringify(logsData, null, 2)}

Bitte verfasse nun die klinische Zusammenfassung basierend auf diesen Daten.
`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt.trim() },
          { role: 'user', content: userMessage.trim() },
        ],
        temperature: 0.2,
      });

      return (
        response.choices[0]?.message?.content ||
        this.fallbackSummary(logsData)
      );
    } catch (error: any) {
      this.logger.error('Error generating AI clinical summary', error);
      return this.fallbackSummary(logsData);
    }
  }

  /** Keeps medical reports useful when the external AI service is unavailable. */
  private fallbackSummary(data: {
    adherence?: { loggedDays?: number; totalDays?: number; pct?: number };
    dosage?: { avgDailyG?: number | null; totalG?: number };
    metrics?: Array<{
      label?: string;
      start?: number | null;
      end?: number | null;
    }>;
    monthlyReviewAnswers?: {
      sideEffects?: string[];
      improvementsDetail?: string | null;
      unresolvedIssues?: string | null;
      satisfaction?: number | null;
      goalsReached?: string | null;
    };
  }): string {
    const adherence = data.adherence?.pct ?? 0;
    const logged = data.adherence?.loggedDays ?? 0;
    const total = data.adherence?.totalDays ?? 0;
    const metricText = (data.metrics ?? [])
      .filter((m) => m.start != null && m.end != null)
      .map((m) => `${m.label ?? 'Messwert'}: ${m.start} auf ${m.end}`)
      .join(', ');
    const review = data.monthlyReviewAnswers ?? {};
    const effects = review.sideEffects ?? [];
    const tolerability =
      effects.length === 0 || effects.some((x) => /keine|none/i.test(x))
        ? 'Im Monatsreview wurden keine relevanten Nebenwirkungen angegeben.'
        : `Im Monatsreview wurden folgende Nebenwirkungen dokumentiert: ${effects.join(', ')}.`;

    const first = `Im Berichtszeitraum wurden ${logged} von ${total} möglichen Tagen dokumentiert (Adhärenz ${adherence} %).${
      data.dosage?.avgDailyG != null
        ? ` Die durchschnittlich dokumentierte Tagesdosis betrug ${data.dosage.avgDailyG} g.`
        : ''
    }${metricText ? ` Der Verlauf der Kernparameter war: ${metricText}.` : ''}`;

    const details = [
      tolerability,
      review.improvementsDetail
        ? `Als Verbesserung wurde angegeben: ${review.improvementsDetail}`
        : null,
      review.unresolvedIssues
        ? `Weiterhin bestehende Beschwerden: ${review.unresolvedIssues}`
        : null,
      review.satisfaction != null
        ? `Die Gesamtzufriedenheit wurde mit ${review.satisfaction}/10 bewertet.`
        : null,
    ].filter(Boolean);

    return `${first}\n\n${details.join(' ')}`;
  }
}
