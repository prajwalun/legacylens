// Test script for detectors
// Run with: npm run test:detectors

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { indexRepository, waitForIndexing } from '@/lib/tools/greptile';
import {
  runAllDetectors,
  runDetectorsByCategory,
  getDetectorStats,
  getAvailableDetectors,
} from './index';

// Import individual detectors for targeted testing
import { detectHardcodedSecrets, detectEvalUsage } from './security';
import { detectMissingHTTPTimeouts, detectEmptyCatchBlocks } from './reliability';
import { detectTODOClusters, detectGodFiles } from './maintainability';

async function main() {
  console.log('\n🔬 Testing Detector System\n');
  console.log('=' .repeat(60));
  
  // Check environment variables
  if (!process.env.GREPTILE_API_KEY) {
    console.error('❌ Error: GREPTILE_API_KEY not found in environment');
    console.log('\nPlease create .env.local file with:');
    console.log('GREPTILE_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  try {
    // Show detector stats
    console.log('\n📊 Detector Statistics:');
    const stats = getDetectorStats();
    console.log(`   Total Detectors: ${stats.total}`);
    console.log(`   - Security: ${stats.security}`);
    console.log(`   - Reliability: ${stats.reliability}`);
    console.log(`   - Maintainability: ${stats.maintainability}`);
    
    console.log('\n📋 Available Detectors:');
    const detectors = getAvailableDetectors();
    detectors.forEach(d => console.log(`   - ${d}`));
    
    // Test with a real repository
    console.log('\n🔗 Indexing test repository...');
    console.log('   Repository: https://github.com/vercel/next.js');
    console.log('   (This is cached if previously indexed)');
    
    const repoUrl = 'https://github.com/vercel/next.js';
    const repoId = await indexRepository(repoUrl);
    console.log(`   ✓ Repository ID: ${repoId}`);
    
    // Wait for indexing (with short timeout for testing)
    console.log('\n⏳ Checking indexing status...');
    const completed = await waitForIndexing(repoId, 30000); // 30 second timeout
    
    if (!completed) {
      console.log('   ⚠️  Repository not fully indexed yet.');
      console.log('   Continuing with test (may have limited results)...\n');
    } else {
      console.log('   ✓ Repository fully indexed!\n');
    }
    
    // Test individual detectors
    console.log('═'.repeat(60));
    console.log('🧪 Testing Individual Detectors');
    console.log('═'.repeat(60));
    
    console.log('\n1️⃣  Security Detector: Hardcoded Secrets');
    const secrets = await detectHardcodedSecrets(repoId);
    console.log(`   Results: ${secrets.length} findings`);
    if (secrets.length > 0) {
      console.log('   Sample:', {
        file: secrets[0].file,
        line: secrets[0].line,
        snippet: secrets[0].snippet.slice(0, 80) + '...',
      });
    }
    
    console.log('\n2️⃣  Security Detector: Eval Usage');
    const evalUsage = await detectEvalUsage(repoId);
    console.log(`   Results: ${evalUsage.length} findings`);
    if (evalUsage.length > 0) {
      console.log('   Sample:', {
        file: evalUsage[0].file,
        line: evalUsage[0].line,
      });
    }
    
    console.log('\n3️⃣  Reliability Detector: Missing HTTP Timeouts');
    const timeouts = await detectMissingHTTPTimeouts(repoId);
    console.log(`   Results: ${timeouts.length} findings`);
    if (timeouts.length > 0) {
      console.log('   Sample:', {
        file: timeouts[0].file,
        line: timeouts[0].line,
      });
    }
    
    console.log('\n4️⃣  Reliability Detector: Empty Catch Blocks');
    const emptyCatch = await detectEmptyCatchBlocks(repoId);
    console.log(`   Results: ${emptyCatch.length} findings`);
    
    console.log('\n5️⃣  Maintainability Detector: TODO Clusters');
    const todos = await detectTODOClusters(repoId);
    console.log(`   Results: ${todos.length} findings`);
    if (todos.length > 0) {
      console.log('   Sample:', {
        file: todos[0].file,
        snippet: todos[0].snippet,
      });
    }
    
    console.log('\n6️⃣  Maintainability Detector: God Files');
    const godFiles = await detectGodFiles(repoId);
    console.log(`   Results: ${godFiles.length} findings`);
    if (godFiles.length > 0) {
      console.log('   Sample:', {
        file: godFiles[0].file,
        snippet: godFiles[0].snippet,
      });
    }
    
    // Test category-based detection
    console.log('\n═'.repeat(60));
    console.log('🔍 Testing Category-Based Detection');
    console.log('═'.repeat(60));
    
    console.log('\n🔒 Security Detectors');
    const securityFindings = await runDetectorsByCategory(repoId, 'security');
    console.log(`   Total Security Findings: ${securityFindings.length}`);
    
    // Breakdown by rule
    const securityRules = new Map<string, number>();
    securityFindings.forEach(f => {
      securityRules.set(f.ruleId, (securityRules.get(f.ruleId) || 0) + 1);
    });
    securityRules.forEach((count, rule) => {
      console.log(`   - ${rule}: ${count}`);
    });
    
    console.log('\n⚡ Reliability Detectors');
    const reliabilityFindings = await runDetectorsByCategory(repoId, 'reliability');
    console.log(`   Total Reliability Findings: ${reliabilityFindings.length}`);
    
    console.log('\n🔧 Maintainability Detectors');
    const maintainabilityFindings = await runDetectorsByCategory(repoId, 'maintainability');
    console.log(`   Total Maintainability Findings: ${maintainabilityFindings.length}`);
    
    // Test full scan
    console.log('\n═'.repeat(60));
    console.log('🚀 Testing Full Detector Scan');
    console.log('═'.repeat(60));
    
    const allFindings = await runAllDetectors(repoId);
    
    console.log('\n📊 Results Summary:');
    console.log(`   Total Findings: ${allFindings.length}`);
    
    // Breakdown by category
    const byCategory = {
      security: allFindings.filter(f => f.category === 'security').length,
      reliability: allFindings.filter(f => f.category === 'reliability').length,
      maintainability: allFindings.filter(f => f.category === 'maintainability').length,
    };
    console.log(`   - Security: ${byCategory.security}`);
    console.log(`   - Reliability: ${byCategory.reliability}`);
    console.log(`   - Maintainability: ${byCategory.maintainability}`);
    
    // Top files with most issues
    console.log('\n📂 Top Files with Issues:');
    const fileCount = new Map<string, number>();
    allFindings.forEach(f => {
      fileCount.set(f.file, (fileCount.get(f.file) || 0) + 1);
    });
    const topFiles = Array.from(fileCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    topFiles.forEach(([file, count], i) => {
      console.log(`   ${i + 1}. ${file} (${count} issues)`);
    });
    
    // Sample findings
    if (allFindings.length > 0) {
      console.log('\n📝 Sample Findings:');
      const samples = allFindings.slice(0, 3);
      samples.forEach((finding, i) => {
        console.log(`\n   ${i + 1}. [${finding.category.toUpperCase()}] ${finding.ruleId}`);
        console.log(`      File: ${finding.file}:${finding.line}`);
        console.log(`      Snippet: ${finding.snippet.slice(0, 100)}...`);
      });
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ All Detector Tests Completed Successfully!');
    console.log('═'.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

main();

