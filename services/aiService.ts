// AI Service for Tomorrow - Supports two modes: recommendation and explanation

const API_BASE_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api/v1';

export type ChatMode = 'recommend' | 'explain';

export interface ChatOptions {
  prompt: string;
  context?: string;
  mode?: ChatMode;
  demoId?: string;
  onChunk?: (chunk: string) => void;
}

export const AiService = {
  /**
   * Main chat method - supports both recommendation and explanation modes
   * 
   * @param options - Chat options including prompt, mode, and demoId
   * @returns Promise with the complete response text
   * 
   * Mode 'recommend' (default): Used on main page to help users discover demos
   * Mode 'explain': Used on demo page to explain code and scientific principles
   */
  chat: async (options: ChatOptions): Promise<string> => {
    const { prompt, context, mode = 'recommend', demoId, onChunk } = options;
    
    console.log('AI Service: Sending request', { mode, demoId, promptLength: prompt.length });
    
    try {
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          context,
          mode,
          demoId
        })
      });
      
      console.log('AI Service: Response status', response.status);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('AI Service: HTTP error', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const content = parsed.content || '';
              if (content) {
                fullText += content;
                onChunk?.(content);
              }
            } catch (e) {
              console.warn('AI Service: Failed to parse SSE data', line);
            }
          }
        }
      }

      console.log('AI Service: Complete response length', fullText.length);
      return fullText;
    } catch (error) {
      console.error('AI Service: Error', error);
      throw error;
    }
  },

  /**
   * Convenience method for main page recommendations
   */
  recommend: async (
    prompt: string,
    context?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    return AiService.chat({
      prompt,
      context,
      mode: 'recommend',
      onChunk
    });
  },

  /**
   * Convenience method for demo page explanations
   */
  explain: async (
    prompt: string,
    demoId: string,
    context?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    return AiService.chat({
      prompt,
      context,
      mode: 'explain',
      demoId,
      onChunk
    });
  }
};
