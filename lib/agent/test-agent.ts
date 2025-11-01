// Test script for LangGraph agent
// Run with: npm run test:agent

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runAgent } from './graph';
import { v4 as uuidv4 } from 'uuid';
import { generateRoadmap } from '@/lib/utils/roadmap';

async function testAgent() {
  console.log('\n🤖 Testing LangGraph Agent\n');
  console.log('═'.repeat(60));
  
  // Check environment
  if (!process.env.GREPTILE_API_KEY) {
    console.error('❌ Error: GREPTILE_API_KEY not found in environment');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment');
    process.exit(1);
  }
  
  const scanId = uuidv4();
  const testRepo = 'https://github.com/vercel/next.js';
  
  console.log(`\n📋 Test Configuration:`);
  console.log(`   Scan ID: ${scanId}`);
  console.log(`   Repository: ${testRepo}`);
  console.log(`   Timeout: 5 minutes for indexing`);
  console.log();
  
  try {
    const result = await runAgent(scanId, testRepo);
    
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Final Results:\n');
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      console.log(`\nLogs (${result.logs?.length || 0} entries):`);
      result.logs?.forEach(log => {
        console.log(`   [${log.phase}] ${log.message}`);
      });
      return;
    }
    
    console.log(`✅ Scan completed successfully!\n`);
    
    // Repository info
    console.log(`🔗 Repository:`);
    console.log(`   ID: ${result.repoId}`);
    console.log(`   Languages: ${result.repoMetadata?.languages.join(', ') || 'Unknown'}`);
    console.log(`   Frameworks: ${result.repoMetadata?.frameworks.join(', ') || 'None'}`);
    console.log(`   Total Files: ${result.repoMetadata?.totalFiles || 0}`);
    
    // Findings summary
    console.log(`\n🔍 Findings:`);
    console.log(`   Raw Findings: ${result.findings?.length || 0}`);
    console.log(`   Enriched Findings: ${result.enrichedFindings?.length || 0}`);
    
    // Severity breakdown
    if (result.enrichedFindings && result.enrichedFindings.length > 0) {
      const critical = result.enrichedFindings.filter(f => f.severity === 'critical').length;
      const high = result.enrichedFindings.filter(f => f.severity === 'high').length;
      const medium = result.enrichedFindings.filter(f => f.severity === 'medium').length;
      const low = result.enrichedFindings.filter(f => f.severity === 'low').length;
      
      console.log(`\n🎯 Severity Breakdown:`);
      console.log(`   🔴 Critical: ${critical}`);
      console.log(`   ⚠️  High: ${high}`);
      console.log(`   🟡 Medium: ${medium}`);
      console.log(`   🔵 Low: ${low}`);
      
      // Category breakdown
      const security = result.enrichedFindings.filter(f => f.category === 'security').length;
      const reliability = result.enrichedFindings.filter(f => f.category === 'reliability').length;
      const maintainability = result.enrichedFindings.filter(f => f.category === 'maintainability').length;
      
      console.log(`\n📦 Category Breakdown:`);
      console.log(`   🔒 Security: ${security}`);
      console.log(`   ⚡ Reliability: ${reliability}`);
      console.log(`   🔧 Maintainability: ${maintainability}`);
      
      // Time saved
      const totalMinutes = result.enrichedFindings.reduce((sum, f) => sum + f.minutesSaved, 0);
      const totalHours = Math.round(totalMinutes / 60 * 10) / 10;
      
      console.log(`\n⏱️  Time Saved: ${totalHours} hours`);
      
      // Sample findings
      console.log(`\n📝 Sample Findings (showing first 3):\n`);
      
      result.enrichedFindings.slice(0, 3).forEach((finding, i) => {
        console.log(`${i + 1}. ${finding.title}`);
        console.log(`   File: ${finding.file}:${finding.line}`);
        console.log(`   Severity: ${finding.severity} | ETA: ${finding.eta}`);
        console.log(`   Timeline (3mo): ${finding.timeline.t3m}`);
        console.log();
      });
      
      // Test roadmap generation
      console.log('📄 Testing Roadmap Generation...');
      const roadmap = generateRoadmap(result.enrichedFindings, testRepo);
      console.log(`   ✓ Roadmap generated: ${roadmap.length} characters`);
      console.log(`   Preview: ${roadmap.substring(0, 150)}...`);
    }
    
    // Workflow logs
    console.log(`\n📋 Workflow Logs (${result.logs?.length || 0} entries):`);
    const logsByPhase = {
      plan: result.logs?.filter(l => l.phase === 'plan').length || 0,
      hunt: result.logs?.filter(l => l.phase === 'hunt').length || 0,
      explain: result.logs?.filter(l => l.phase === 'explain').length || 0,
      write: result.logs?.filter(l => l.phase === 'write').length || 0,
    };
    
    console.log(`   Plan: ${logsByPhase.plan} logs`);
    console.log(`   Hunt: ${logsByPhase.hunt} logs`);
    console.log(`   Explain: ${logsByPhase.explain} logs`);
    console.log(`   Write: ${logsByPhase.write} logs`);
    
    // Show recent logs
    console.log(`\n📜 Recent Logs (last 10):`);
    result.logs?.slice(-10).forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      console.log(`   [${time}] [${log.phase.toUpperCase()}] ${log.message}`);
    });
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ Agent Test Completed Successfully!');
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Agent test failed:');
    console.error(error);
    process.exit(1);
  }
}

testAgent();

