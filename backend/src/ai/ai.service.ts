import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { ReportsService } from '../reports/reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { CHAT_TOOLS, executeTool } from './tools';
import {
  demoGetSalesInsights,
  demoWriteFooterNotes,
  demoGetDemandForecast,
  demoChat,
} from './ai.demo';

const DEFAULT_QWEN_BASE_URL =
  'https://llm-r0dddz90e42xqg2z.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1';
const DEFAULT_QWEN_MODEL = 'qwen3.6-flash';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI | null = null;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {
    const key = this.config.get<string>('QWEN_API_KEY');
    this.model = this.config.get<string>('QWEN_MODEL') ?? DEFAULT_QWEN_MODEL;

    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        baseURL: this.config.get<string>('QWEN_BASE_URL') ?? DEFAULT_QWEN_BASE_URL,
      });
      this.logger.log(`Qwen AI configured (model: ${this.model})`);
    } else if (this.config.get<boolean>('DEMO_MODE')) {
      this.logger.log('DEMO_MODE enabled — AI endpoints use data-aware mock responses');
    } else {
      this.logger.warn('QWEN_API_KEY not set — AI features disabled');
    }
  }

  private requireClient(): OpenAI {
    if (!this.client) {
      throw new ServiceUnavailableException('AI features are not configured (missing QWEN_API_KEY)');
    }
    return this.client;
  }

  private async complete(prompt: string, maxTokens: number): Promise<string> {
    const client = this.requireClient();
    const response = await client.chat.completions.create({
      model: this.model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0]?.message?.content ?? '';
  }

  // ── (a) Sales insights ────────────────────────────────────────────────────

  /** Generate a natural-language summary of sales for a given date range */
  async getSalesInsights(startDate: string, endDate: string): Promise<{ summary: string; highlights: string[] }> {
    if (this.config.get<boolean>('DEMO_MODE')) {
      return demoGetSalesInsights(this.reportsService, startDate, endDate);
    }

    // Compute aggregates from DB (never pass raw tables to the LLM)
    const allDays: Array<{ date: string; count: number; revenueCents: number }> = [];

    const start = new Date(startDate + 'T00:00:00Z');
    const end = new Date(endDate + 'T00:00:00Z');
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayReport = await this.reportsService.getDailySales(dateStr);
      allDays.push({ date: dateStr, count: dayReport.receiptCount, revenueCents: dayReport.totalRevenueCents });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    const totalRevenue = allDays.reduce((s, d) => s + d.revenueCents, 0);
    const totalReceipts = allDays.reduce((s, d) => s + d.count, 0);
    const avgDaily = totalRevenue / Math.max(allDays.length, 1);
    const bestDay = allDays.reduce((best, d) => (d.revenueCents > best.revenueCents ? d : best), allDays[0]);
    const worstDay = allDays.reduce((worst, d) => (d.revenueCents < worst.revenueCents ? d : worst), allDays[0]);

    const prompt = `Kamu adalah asisten analitik bisnis laundry. Buat ringkasan singkat performa penjualan dalam bahasa Indonesia yang ramah dan profesional.

Data agregat (dalam satuan sen/cents IDR):
- Periode: ${startDate} s/d ${endDate}
- Total bon: ${totalReceipts}
- Total pendapatan: Rp${(totalRevenue / 100).toLocaleString('id-ID')}
- Rata-rata harian: Rp${(avgDaily / 100).toLocaleString('id-ID')}
- Hari terbaik: ${bestDay?.date} (Rp${((bestDay?.revenueCents ?? 0) / 100).toLocaleString('id-ID')}, ${bestDay?.count} bon)
- Hari terendah: ${worstDay?.date} (Rp${((worstDay?.revenueCents ?? 0) / 100).toLocaleString('id-ID')}, ${worstDay?.count} bon)

Berikan:
1. Ringkasan naratif (2-3 kalimat)
2. 3 poin highlight utama (bullet points)

Format respons sebagai JSON: {"summary": "...", "highlights": ["...", "...", "..."]}`;

    const text = await this.complete(prompt, 500);
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, highlights: [] };
    } catch {
      return { summary: text, highlights: [] };
    }
  }

  // ── (b) Footer/promo writer ───────────────────────────────────────────────

  /** Generate new footer notes for the receipt */
  async writeFooterNotes(businessName: string, context?: string): Promise<{ footerNotes: string[] }> {
    if (this.config.get<boolean>('DEMO_MODE')) {
      return demoWriteFooterNotes(businessName);
    }

    const prompt = `Kamu adalah copywriter bisnis laundry bernama "${businessName}".
Tulis 3-4 catatan kaki untuk struk laundry yang ramah, profesional, dan informatif dalam bahasa Indonesia.
${context ? `Konteks tambahan: ${context}` : ''}

Contoh yang baik:
- Terima kasih atas kepercayaan Anda
- Jam operasional: 08:00-21:00 Senin-Sabtu
- Komplain maks 1x24 jam setelah pengambilan
- Ikuti kami di Instagram @${businessName.toLowerCase().replace(/\s+/g, '')}

Buat catatan yang relevan dan tidak terlalu panjang (max 50 karakter per catatan).
Format respons: JSON array of strings, e.g. ["catatan 1", "catatan 2", "catatan 3"]`;

    const text = await this.complete(prompt, 300);
    try {
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      const notes: string[] = arrayMatch ? JSON.parse(arrayMatch[0]) : [];
      return { footerNotes: notes };
    } catch {
      return { footerNotes: [] };
    }
  }

  // ── (c) Demand forecast ───────────────────────────────────────────────────

  /** Generate a narrative demand forecast based on recent volume trends */
  async getDemandForecast(): Promise<{ forecast: string; staffingNote: string }> {
    if (this.config.get<boolean>('DEMO_MODE')) {
      return demoGetDemandForecast(this.reportsService);
    }

    // Fetch last 28 days of data
    const days: Array<{ date: string; count: number }> = [];
    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const report = await this.reportsService.getDailySales(dateStr);
      days.push({ date: dateStr, count: report.receiptCount });
    }

    const avgLast7 = days.slice(-7).reduce((s, d) => s + d.count, 0) / 7;
    const avgPrev7 = days.slice(-14, -7).reduce((s, d) => s + d.count, 0) / 7;
    const trend = avgLast7 > avgPrev7 ? 'meningkat' : avgLast7 < avgPrev7 ? 'menurun' : 'stabil';
    const weeklyData = days.map((d) => `${d.date}:${d.count}`).join(', ');

    const prompt = `Kamu adalah analis bisnis laundry. Berikan prediksi permintaan singkat berdasarkan tren berikut.

Data volume harian (28 hari terakhir):
${weeklyData}

Rata-rata 7 hari terakhir: ${avgLast7.toFixed(1)} bon/hari
Rata-rata 7 hari sebelumnya: ${avgPrev7.toFixed(1)} bon/hari
Tren: ${trend}

Berikan:
1. Prediksi naratif untuk minggu depan (2-3 kalimat)
2. Catatan staffing/kepegawaian yang disarankan (1 kalimat)

Format: JSON {"forecast": "...", "staffingNote": "..."}`;

    const text = await this.complete(prompt, 400);
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { forecast: text, staffingNote: '' };
    } catch {
      return { forecast: text, staffingNote: '' };
    }
  }

  // ── (d) Chat-over-data ────────────────────────────────────────────────────

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ reply: string; toolsUsed: string[] }> {
    if (this.config.get<boolean>('DEMO_MODE')) {
      return demoChat(messages, this.prisma);
    }

    const client = this.requireClient();
    const toolsUsed: string[] = [];

    const systemPrompt = `Kamu adalah asisten analitik bisnis laundry bernama "Laundry AI".
Bantu pemilik bisnis memahami data penjualan mereka melalui pertanyaan bahasa alami dalam bahasa Indonesia.
Gunakan tools yang tersedia untuk mengambil data yang relevan sebelum menjawab.
Selalu jawab dalam bahasa Indonesia yang ramah dan profesional.
Semua nilai uang dalam satuan sen (cents) — tampilkan ke user sebagai Rupiah (bagi 100, format ribuan).`;

    const apiMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    let response = await client.chat.completions.create({
      model: this.model,
      max_tokens: 1024,
      tools: CHAT_TOOLS,
      messages: apiMessages,
    });

    // Agentic loop: keep going while the model wants to use tools
    while (response.choices[0]?.finish_reason === 'tool_calls') {
      const assistantMessage = response.choices[0].message;
      const toolCalls = assistantMessage.tool_calls ?? [];

      apiMessages.push(assistantMessage);

      for (const toolCall of toolCalls) {
        if (toolCall.type !== 'function') continue;
        toolsUsed.push(toolCall.function.name);

        let result: unknown;
        try {
          const input = JSON.parse(toolCall.function.arguments || '{}') as Record<string, unknown>;
          result = await executeTool(toolCall.function.name, input, this.prisma);
        } catch (err) {
          result = { error: String(err) };
        }

        apiMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      response = await client.chat.completions.create({
        model: this.model,
        max_tokens: 1024,
        tools: CHAT_TOOLS,
        messages: apiMessages,
      });
    }

    const reply = response.choices[0]?.message?.content ?? '';
    return { reply, toolsUsed };
  }
}
