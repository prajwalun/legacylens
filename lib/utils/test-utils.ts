// Test script for utilities
// Run with: npm run test:utils

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { testLLMConnection } from '@/lib/tools/llm';
import {
  generateTimeline,
  generateExplanation,
  generateFix,
  type TimelinePrediction,
} from './timeline';
import {
  calculateSeverity,
  calculateETA,
  calculateMinutesSaved,
  getETALabel,
  getSeverityEmoji,
  getCategoryEmoji,
  getPriorityScore,
  calculateStats,
  sortByPriority,
} from './scoring';
import { generateRoadmap, generateChecklist, generateCSV } from './roadmap';
import type { Finding } from '@/types';

async function main() {
  console.log('\n🔬 Testing LegacyLens Utilities\n');
  console.log('═'.repeat(60));
  
  // Check environment
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment');
    console.log('\nPlease create .env.local file with:');
    console.log('OPENAI_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  try {
    // Test 1: LLM Connection
    console.log('\n✅ Test 1: OpenAI Connection');
    console.log('-'.repeat(60));
    const llmWorks = await testLLMConnection();
    if (!llmWorks) {
      throw new Error('OpenAI connection failed');
    }
    
    // Test 2: Scoring System
    console.log('\n✅ Test 2: Scoring System');
    console.log('-'.repeat(60));
    
    const testRules = [
      'hardcoded-secrets',
      'sql-injection',
      'no-http-timeout',
      'god-file',
    ];
    
    console.log('\nSeverity Calculations:');
    testRules.forEach(ruleId => {
      const severity = calculateSeverity(ruleId);
      const emoji = getSeverityEmoji(severity);
      console.log(`   ${emoji} ${ruleId}: ${severity}`);
    });
    
    console.log('\nETA Calculations:');
    const snippets = [
      { rule: 'hardcoded-secrets', snippet: 'const API_KEY = "sk_live_abc"' },
      { rule: 'god-file', snippet: 'function massive() { /* 500 lines */ }' },
      { rule: 'sql-injection', snippet: 'db.query("SELECT * WHERE id=" + id)' },
    ];
    
    snippets.forEach(({ rule, snippet }) => {
      const eta = calculateETA(rule, snippet);
      const label = getETALabel(eta);
      console.log(`   ${rule}: ${eta} (${label})`);
    });
    
    console.log('\nTime Saved Calculations:');
    console.log(`   Critical + Easy: ${calculateMinutesSaved('critical', 'easy')} min`);
    console.log(`   High + Medium: ${calculateMinutesSaved('high', 'medium')} min`);
    console.log(`   Medium + Large: ${calculateMinutesSaved('medium', 'large')} min`);
    console.log(`   Low + Easy: ${calculateMinutesSaved('low', 'easy')} min`);
    
    // Test 3: Timeline Generation
    console.log('\n✅ Test 3: Timeline Generation');
    console.log('-'.repeat(60));
    console.log('Generating timeline for hardcoded secrets...');
    
    const timeline = await generateTimeline(
      'hardcoded-secrets',
      'src/config/api.ts',
      'const API_KEY = "sk_live_1234567890abcdef";'
    );
    
    console.log('Timeline:');
    console.log(`   3 months: ${timeline.t3m}`);
    console.log(`   6 months: ${timeline.t6m}`);
    console.log(`   1 year:   ${timeline.t1y}`);
    console.log(`   2 years:  ${timeline.t2y}`);
    
    // Test 4: Explanation Generation
    console.log('\n✅ Test 4: Explanation Generation');
    console.log('-'.repeat(60));
    console.log('Generating explanation for SQL injection...');
    
    const explanation = await generateExplanation(
      'sql-injection',
      'src/db/users.ts',
      'db.query("SELECT * FROM users WHERE id=" + userId)'
    );
    
    console.log(`Explanation: ${explanation}`);
    
    // Test 5: Fix Generation
    console.log('\n✅ Test 5: Fix Generation');
    console.log('-'.repeat(60));
    console.log('Generating fix for hardcoded secret...');
    
    const fix = await generateFix(
      'hardcoded-secrets',
      'const API_KEY = "sk_live_abc123";'
    );
    
    console.log(`Fix:\n${fix}`);
    
    // Test 6: Statistics Calculation
    console.log('\n✅ Test 6: Statistics Calculation');
    console.log('-'.repeat(60));
    
    const mockFindings = [
      { severity: 'critical' as const, category: 'security' as const, minutesSaved: 17 },
      { severity: 'critical' as const, category: 'security' as const, minutesSaved: 17 },
      { severity: 'high' as const, category: 'reliability' as const, minutesSaved: 14 },
      { severity: 'medium' as const, category: 'reliability' as const, minutesSaved: 9 },
      { severity: 'low' as const, category: 'maintainability' as const, minutesSaved: 5 },
    ];
    
    const stats = calculateStats(mockFindings);
    
    console.log('Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Critical: ${stats.criticalCount}`);
    console.log(`   High: ${stats.highCount}`);
    console.log(`   Medium: ${stats.mediumCount}`);
    console.log(`   Low: ${stats.lowCount}`);
    console.log(`   Total Time: ${stats.totalHours} hours`);
    console.log(`   Security: ${stats.byCategory.security}`);
    console.log(`   Reliability: ${stats.byCategory.reliability}`);
    console.log(`   Maintainability: ${stats.byCategory.maintainability}`);
    
    // Test 7: Priority Sorting
    console.log('\n✅ Test 7: Priority Sorting');
    console.log('-'.repeat(60));
    
    const unsorted = [
      { id: 1, severity: 'low' as const, eta: 'easy' as const },
      { id: 2, severity: 'critical' as const, eta: 'large' as const },
      { id: 3, severity: 'high' as const, eta: 'easy' as const },
      { id: 4, severity: 'critical' as const, eta: 'easy' as const },
    ];
    
    const sorted = sortByPriority(unsorted);
    console.log('Sorted by priority:');
    sorted.forEach((item, i) => {
      const score = getPriorityScore(item.severity, item.eta);
      console.log(`   ${i + 1}. ID ${item.id}: ${item.severity} + ${item.eta} (score: ${score})`);
    });
    
    // Test 8: Roadmap Generation
    console.log('\n✅ Test 8: Roadmap Generation');
    console.log('-'.repeat(60));
    
    const fullFinding: Finding = {
      id: 'test-1',
      ruleId: 'hardcoded-secrets',
      category: 'security',
      severity: 'critical',
      eta: 'easy',
      file: 'src/config/api.ts',
      line: 12,
      snippet: 'const API_KEY = "sk_live_1234567890";',
      title: 'Hardcoded API key in configuration',
      explanation: 'This code contains a hardcoded API key that should be in environment variables. If these credentials leak through version control, they cannot be rotated without code changes.',
      fix: 'const API_KEY = process.env.API_KEY;\n// Add to .env: API_KEY=your_key_here',
      timeline,
      minutesSaved: 17,
    };
    
    const roadmap = generateRoadmap([fullFinding], 'https://github.com/test/repo');
    console.log('Roadmap generated successfully!');
    console.log(`Length: ${roadmap.length} characters`);
    console.log('\nFirst 500 characters:');
    console.log(roadmap.substring(0, 500) + '...\n');
    
    // Test 9: Checklist Generation
    console.log('\n✅ Test 9: Checklist Generation');
    console.log('-'.repeat(60));
    
    const checklist = generateChecklist([fullFinding]);
    console.log('Checklist generated:');
    console.log(checklist);
    
    // Test 10: CSV Export
    console.log('\n✅ Test 10: CSV Export');
    console.log('-'.repeat(60));
    
    const csv = generateCSV([fullFinding]);
    console.log('CSV generated:');
    console.log(csv);
    
    // Summary
    console.log('═'.repeat(60));
    console.log('✅ All Utility Tests Completed Successfully!');
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

main();

