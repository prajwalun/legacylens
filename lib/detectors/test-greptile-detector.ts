#!/usr/bin/env tsx
// Test script for Greptile AI-powered detector
// Run with: npx tsx lib/detectors/test-greptile-detector.ts

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { runGreptileDetectors, runHybridDetectors } from './greptile';
import { runAllDetectors } from './index';

async function testDetectors() {
  console.log('\n🧪 Testing Greptile Integration\n');
  console.log('='.repeat(60));
  
  // Check environment variables
  if (!process.env.GREPTILE_API_KEY) {
    console.error('\n❌ Error: GREPTILE_API_KEY not found');
    console.log('Please add it to your .env.local file\n');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('\n❌ Error: OPENAI_API_KEY not found');
    console.log('Please add it to your .env.local file\n');
    process.exit(1);
  }
  
  // Test repository (small, fast to index)
  const testRepo = 'https://github.com/prajwalun/bad-repo';
  console.log(`\n📦 Test Repository: ${testRepo}\n`);
  
  // ===== Test 1: GitHub API Detector (Baseline) =====
  console.log('\n' + '='.repeat(60));
  console.log('TEST 1: GitHub API Pattern Detector (Baseline)');
  console.log('='.repeat(60) + '\n');
  
  const startGitHub = Date.now();
  try {
    const githubFindings = await runAllDetectors(testRepo);
    const githubTime = ((Date.now() - startGitHub) / 1000).toFixed(1);
    
    console.log(`\n✅ GitHub API Test Complete`);
    console.log(`   Time: ${githubTime}s`);
    console.log(`   Findings: ${githubFindings.length}`);
    console.log(`   - Security: ${githubFindings.filter(f => f.category === 'security').length}`);
    console.log(`   - Reliability: ${githubFindings.filter(f => f.category === 'reliability').length}`);
    console.log(`   - Maintainability: ${githubFindings.filter(f => f.category === 'maintainability').length}`);
    
    // Sample findings
    if (githubFindings.length > 0) {
      console.log(`\n   Sample findings:`);
      githubFindings.slice(0, 3).forEach((f, i) => {
        console.log(`   ${i + 1}. [${f.category}] ${f.ruleId} in ${f.file}:${f.line}`);
      });
    }
  } catch (error: any) {
    console.error(`\n❌ GitHub API Test Failed: ${error.message}`);
  }
  
  // ===== Test 2: Greptile AI Detector =====
  console.log('\n' + '='.repeat(60));
  console.log('TEST 2: Greptile AI-Powered Detector');
  console.log('='.repeat(60) + '\n');
  console.log('⏳ This will take 60-90 seconds (indexing + AI analysis)...\n');
  
  const startGreptile = Date.now();
  try {
    const greptileFindings = await runGreptileDetectors(testRepo);
    const greptileTime = ((Date.now() - startGreptile) / 1000).toFixed(1);
    
    console.log(`\n✅ Greptile AI Test Complete`);
    console.log(`   Time: ${greptileTime}s`);
    console.log(`   Findings: ${greptileFindings.length}`);
    console.log(`   - Security: ${greptileFindings.filter(f => f.category === 'security').length}`);
    console.log(`   - Reliability: ${greptileFindings.filter(f => f.category === 'reliability').length}`);
    console.log(`   - Maintainability: ${greptileFindings.filter(f => f.category === 'maintainability').length}`);
    
    // Sample findings
    if (greptileFindings.length > 0) {
      console.log(`\n   Sample findings:`);
      greptileFindings.slice(0, 3).forEach((f, i) => {
        console.log(`   ${i + 1}. [${f.category}] ${f.ruleId} in ${f.file}:${f.line}`);
      });
    }
  } catch (error: any) {
    console.error(`\n❌ Greptile AI Test Failed: ${error.message}`);
    console.log(`\n   This might be due to:`);
    console.log(`   - Invalid API key`);
    console.log(`   - Rate limiting`);
    console.log(`   - Repository indexing timeout`);
    console.log(`   - Network issues\n`);
  }
  
  // ===== Test 3: Hybrid Detector =====
  console.log('\n' + '='.repeat(60));
  console.log('TEST 3: Hybrid Detector (Quick Scan + AI if Needed)');
  console.log('='.repeat(60) + '\n');
  
  const startHybrid = Date.now();
  try {
    const hybridFindings = await runHybridDetectors(testRepo);
    const hybridTime = ((Date.now() - startHybrid) / 1000).toFixed(1);
    
    console.log(`\n✅ Hybrid Test Complete`);
    console.log(`   Time: ${hybridTime}s`);
    console.log(`   Findings: ${hybridFindings.length}`);
    console.log(`   - Security: ${hybridFindings.filter(f => f.category === 'security').length}`);
    console.log(`   - Reliability: ${hybridFindings.filter(f => f.category === 'reliability').length}`);
    console.log(`   - Maintainability: ${hybridFindings.filter(f => f.category === 'maintainability').length}`);
  } catch (error: any) {
    console.error(`\n❌ Hybrid Test Failed: ${error.message}`);
  }
  
  // ===== Summary =====
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60) + '\n');
  console.log('✅ All tests completed!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Update .env.local with USE_GREPTILE=true to enable AI mode');
  console.log('   2. Or use USE_GREPTILE=hybrid for best of both worlds');
  console.log('   3. Run a real scan via the web UI to see it in action\n');
}

// Run tests
testDetectors().catch(error => {
  console.error('\n💥 Test suite failed:', error);
  process.exit(1);
});

