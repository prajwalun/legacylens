// LangGraph workflow definition
import { StateGraph } from "@langchain/langgraph";
import type { AgentState } from "@/types";
import { agentStateChannels } from "./state";
import { planNode, huntNode, explainNode, writeNode } from "./nodes";

/**
 * Create and compile the agent workflow graph
 */
export function createAgentGraph() {
  // Create the state graph with defined channels
  const workflow = new StateGraph<AgentState>({
    channels: agentStateChannels,
  });

  // Add nodes to the workflow
  workflow.addNode("plan", planNode);
  workflow.addNode("hunt", huntNode);
  workflow.addNode("explain", explainNode);
  workflow.addNode("write", writeNode);

  // Define edges (workflow sequence)
  workflow.addEdge("__start__", "plan");
  workflow.addEdge("plan", "hunt");
  workflow.addEdge("hunt", "explain");
  workflow.addEdge("explain", "write");
  workflow.addEdge("write", "__end__");

  // Compile and return the graph
  return workflow.compile();
}

/**
 * Run the agent workflow from start to finish
 * Returns the final state after all nodes have executed
 */
export async function runAgent(scanId: string, repoUrl: string): Promise<AgentState> {
  const graph = createAgentGraph();
  
  // Initialize state
  const initialState: AgentState = {
    scanId,
    repoUrl,
    findings: [],
    enrichedFindings: [],
    logs: [],
  };
  
  console.log(`\n[Agent] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`[Agent] Starting scan for ${repoUrl}`);
  console.log(`[Agent] Scan ID: ${scanId}`);
  console.log(`[Agent] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  // Stream the execution
  const stream = await graph.stream(initialState);
  
  let finalState: AgentState = initialState;
  
  // Process each node's output
  for await (const update of stream) {
    // Get the node output (LangGraph returns { nodeName: output })
    const nodeOutput = Object.values(update)[0] as Partial<AgentState>;
    
    // Properly merge logs by appending, not replacing
    const mergedLogs = [...finalState.logs, ...(nodeOutput.logs || [])];
    
    // Merge the update into final state
    finalState = { 
      ...finalState, 
      ...nodeOutput,
      logs: mergedLogs // Ensure logs are appended
    };
    
    // Log any new messages
    if (nodeOutput.logs && nodeOutput.logs.length > 0) {
      for (const log of nodeOutput.logs) {
        console.log(`[${log.phase.toUpperCase()}] ${log.message}`);
      }
    }
    
    // If there's an error, stop early
    if (nodeOutput.error) {
      console.error(`\n[Agent] ❌ Error occurred: ${nodeOutput.error}`);
      break;
    }
  }
  
  console.log(`\n[Agent] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log('[Agent] Workflow complete!');
  console.log(`[Agent] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  return finalState;
}

/**
 * Run the agent with streaming callback
 * Useful for SSE (Server-Sent Events) in API routes
 */
export async function runAgentWithStreaming(
  scanId: string,
  repoUrl: string,
  onLog?: (log: AgentState['logs'][0]) => void
): Promise<AgentState> {
  const graph = createAgentGraph();
  
  const initialState: AgentState = {
    scanId,
    repoUrl,
    findings: [],
    enrichedFindings: [],
    logs: [],
  };
  
  console.log(`[Agent] Starting scan for ${repoUrl} with streaming`);
  
  const stream = await graph.stream(initialState);
  
  let finalState: AgentState = initialState;
  
  for await (const update of stream) {
    const nodeOutput = Object.values(update)[0] as Partial<AgentState>;
    
    // Properly merge logs by appending
    const mergedLogs = [...finalState.logs, ...(nodeOutput.logs || [])];
    finalState = { 
      ...finalState, 
      ...nodeOutput,
      logs: mergedLogs
    };
    
    // Stream logs via callback
    if (nodeOutput.logs && onLog) {
      for (const log of nodeOutput.logs) {
        onLog(log);
      }
    }
    
    if (nodeOutput.error) {
      break;
    }
  }
  
  return finalState;
}

