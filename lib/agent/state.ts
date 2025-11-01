// Agent state definition with LangGraph channels
import type { StateGraphArgs } from "@langchain/langgraph";
import type { AgentState } from "@/types";

/**
 * Define state channels with reducer functions
 * Each channel specifies how state updates are merged
 */
export const agentStateChannels: StateGraphArgs<AgentState>["channels"] = {
  // Scan ID - simple replacement
  scanId: {
    value: (x: string, y?: string) => y ?? x,
    default: () => "",
  },
  
  // Repository URL - simple replacement
  repoUrl: {
    value: (x: string, y?: string) => y ?? x,
    default: () => "",
  },
  
  // Repository metadata - simple replacement
  repoMetadata: {
    value: (x?: any, y?: any) => y ?? x,
    default: () => undefined,
  },
  
  // Raw findings from detectors - simple replacement
  findings: {
    value: (x: any[], y?: any[]) => y ?? x,
    default: () => [],
  },
  
  // Enriched findings with AI content - simple replacement
  enrichedFindings: {
    value: (x: any[], y?: any[]) => y ?? x,
    default: () => [],
  },
  
  // Logs - APPEND mode (important!)
  logs: {
    value: (x: any[], y?: any[]) => {
      // Merge logs by appending new ones to existing
      return [...x, ...(y || [])];
    },
    default: () => [],
  },
  
  // Error message - simple replacement
  error: {
    value: (x?: string, y?: string) => y ?? x,
    default: () => undefined,
  },
};

