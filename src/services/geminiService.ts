import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a friendly, curious investor talking to a student entrepreneur. 
Your goal is to help them refine their business idea by asking sharp, investor-style questions.

Rules:
1. Be concise. Keep your responses short and to the point.
2. Ask only ONE question at a time.
3. Use simple, student-friendly language. No jargon.
4. Focus on typical investor concerns: 
   - What problem are you solving?
   - Who exactly is your customer?
   - How will you make money?
   - Why would someone choose you over a competitor?
   - How will you reach your first 10 customers?
5. Do NOT mention "PSI", "frameworks", or "SWOT" explicitly. Just ask the questions naturally.
6. Occasionally (briefly) explain why the question matters (e.g., "Investors care about this because...").
7. Start by asking: "Hi there! I'd love to hear about your business. What's the big idea you're working on?"`;

export interface Message {
  role: "user" | "model";
  text: string;
}

export class ChatService {
  private ai: GoogleGenAI;
  private chat: any;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });
  }

  async sendMessage(message: string) {
    const response = await this.chat.sendMessage({ message });
    return response.text;
  }

  async *sendMessageStream(message: string) {
    const result = await this.chat.sendMessageStream({ message });
    for await (const chunk of result) {
      yield chunk.text;
    }
  }
}
