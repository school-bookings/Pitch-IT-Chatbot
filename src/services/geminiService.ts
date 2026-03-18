import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are a friendly, curious investor talking to a student entrepreneur. 
Your goal is to help them refine their business idea by exploring the "4 P's": Problem, People, Product, and Potential.

Rules:
1. Be concise. Keep your responses short and to the point.
2. Ask only ONE question at a time.
3. Use simple, student-friendly language. No jargon.
4. Focus on these 4 areas (avoid focusing on profits or economic outputs):
   - Problem: What specific problem is being solved?
   - People: Who has this problem? Who would be involved in the solution?
   - Product: What exactly is the product or solution?
   - Potential: What opportunities or future possibilities does this product have?
5. Do NOT mention "4 P's" or "frameworks" explicitly. Just ask the questions naturally.
6. Occasionally (briefly) explain why the question matters (e.g., "I'm curious about this because understanding the people involved helps shape the solution...").
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
