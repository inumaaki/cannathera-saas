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
      return `AI-generierte Zusammenfassung konnte nicht erstellt werden, da der API-Schlüssel fehlt.`;
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
        'Fehler bei der Generierung der KI-Zusammenfassung.'
      );
    } catch (error: any) {
      this.logger.error('Error generating AI clinical summary', error);
      return `Fehler bei der Kommunikation mit dem KI-Dienst: ${error.message}`;
    }
  }
}
