import { create } from 'zustand';

export type LayoutType = 'horizontal' | 'vertical' | 'grid';

export interface TextBubble {
  id: string;
  text: string;
  type: 'speech' | 'thought';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Panel {
  id: string;
  image?: string;
  textBubbles: TextBubble[];
}

export interface ComicState {
  // Layout settings
  layout: LayoutType;
  panelCount: number;
  panels: Panel[];
  
  // Actions
  setLayout: (layout: LayoutType) => void;
  setPanelCount: (count: number) => void;
  updatePanel: (panelId: string, updates: Partial<Panel>) => void;
  addTextBubble: (panelId: string, bubble: Omit<TextBubble, 'id'>) => void;
  updateTextBubble: (panelId: string, bubbleId: string, updates: Partial<TextBubble>) => void;
  removeTextBubble: (panelId: string, bubbleId: string) => void;
  setPanelImage: (panelId: string, image: string) => void;
  initializePanels: (count: number) => void;
}

export const useComicStore = create<ComicState>((set, get) => ({
  layout: 'horizontal',
  panelCount: 3,
  panels: [],

  setLayout: (layout) => set({ layout }),
  
  setPanelCount: (count) => {
    set({ panelCount: count });
    get().initializePanels(count);
  },

  initializePanels: (count) => {
    const panels: Panel[] = Array.from({ length: count }, (_, i) => ({
      id: `panel-${i}`,
      textBubbles: [],
    }));
    set({ panels });
  },

  updatePanel: (panelId, updates) => 
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      ),
    })),

  addTextBubble: (panelId, bubble) =>
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              textBubbles: [
                ...panel.textBubbles,
                { ...bubble, id: `bubble-${Date.now()}` },
              ],
            }
          : panel
      ),
    })),

  updateTextBubble: (panelId, bubbleId, updates) =>
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              textBubbles: panel.textBubbles.map((bubble) =>
                bubble.id === bubbleId ? { ...bubble, ...updates } : bubble
              ),
            }
          : panel
      ),
    })),

  removeTextBubble: (panelId, bubbleId) =>
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId
          ? {
              ...panel,
              textBubbles: panel.textBubbles.filter((bubble) => bubble.id !== bubbleId),
            }
          : panel
      ),
    })),

  setPanelImage: (panelId, image) =>
    set((state) => ({
      panels: state.panels.map((panel) =>
        panel.id === panelId ? { ...panel, image } : panel
      ),
    })),
}));

// Initialize with default 3 panels
useComicStore.getState().initializePanels(3); 