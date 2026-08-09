export interface AIGenerateOptions {
  systemInstruction?: string;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  model: string;
}
