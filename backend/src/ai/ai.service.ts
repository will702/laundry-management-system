import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages/messages';
import { ReportsService } from '../reports/reports.service';
import { PrismaService } from '../prisma/prisma.service';
import { CHAT_TOOLS, executeTool } from './tools';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: Anthropic | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly reportsService: ReportsService,
    private readonly prisma: PrismaService,
  ) {
    const key = this.config.get<string>('ANTHROPIC_API_KEY');
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    } else {
      this.logger.warn('ANTHROPIC_API_KEY not set — AI features disabled');
    }
  }

  private requireClient(): Anthropic {
    if (!this.client) {
      throw new ServiceUnavailableException('AI features are not configured (missing ANTHROPIC_API_KEY)');
    }
    return this.client;
  }

  // ── (a) Sales insights ────────────────────────────────────────────────────

  /** Generate a natural-language summary of sales for a given date range */
  async getSalesInsights(startDate: string, endDate: string): Promise<{ summary: string; highlights: string[] }> {
    const anthropic = this.requireClient();

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
    const bestDay = allDays.reduce((best, d) => d.revenueCents > best.revenueCents ? d : best, allDays[0]);
    const worstDay = allDays.reduce((worst, d) => d.revenueCents < worst.revenueCents ? d : worst, allDays[0]);

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

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const text = block.type === 'text' ? block.text : '{}';
    try {
      // Extract JSON from response (it may have markdown fences)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text, highlights: [] };
    } catch {
      return { summary: text, highlights: [] };
    }
  }

  // ── (b) Footer/promo writer ───────────────────────────────────────────────

  /** Generate new footer notes for the receipt */
  async writeFooterNotes(businessName: string, context?: string): Promise<{ footerNotes: string[] }> {
    const anthropic = this.requireClient();

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

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const text = block.type === 'text' ? block.text : '[]';
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
    const anthropic = this.requireClient();

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

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const block = response.content[0];
    const text = block.type === 'text' ? block.text : '{}';
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { forecast: text, staffingNote: '' };
    } catch {
      return { forecast: text, staffingNote: '' };
    }
  }

  // ── (c) Chat-over-data ────────────────────────────────────────────────────

  async chat(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<{ reply: string; toolsUsed: string[] }> {
    const anthropic = this.requireClient();
    const toolsUsed: string[] = [];

    const systemPrompt = `Kamu adalah asisten analitik bisnis laundry bernama "Laundry AI".
Bantu pemilik bisnis memahami data penjualan mereka melalui pertanyaan bahasa alami dalam bahasa Indonesia.
Gunakan tools yang tersedia untuk mengambil data yang relevan sebelum menjawab.
Selalu jawab dalam bahasa Indonesia yang ramah dan profesional.
Semua nilai uang dalam satuan sen (cents) — tampilkan ke user sebagai Rupiah (bagi 100, format ribuan).`;

    // Build initial message array
    const apiMessages: MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: systemPrompt,
      tools: CHAT_TOOLS,
      messages: apiMessages,
    });

    // Agentic loop: keep going while Claude wants to use tools
    while (response.stop_reason === 'tool_use') {
      const assistantMessage: MessageParam = {
        role: 'assistant',
        content: response.content,
      };

      const toolResults: ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        toolsUsed.push(block.name);
        let result: unknown;
        try {
          result = await executeTool(block.name, block.input as Record<string, unknown>, this.prisma);
        } catch (err) {
          result = { error: String(err) };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      const toolResultMessage: MessageParam = {
        role: 'user',
        content: toolResults,
      };

      response = await anthropic.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        tools: CHAT_TOOLS,
        messages: [...apiMessages, assistantMessage, toolResultMessage],
      });
    }

    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('\n');

    return { reply, toolsUsed };
  }
}
