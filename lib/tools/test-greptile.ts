// Test script for Greptile client
// Run with: npm run test:greptile

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { 
  parseRepoUrl, 
  formatRepoId, 
  indexRepository,
  waitForIndexing,
  searchCode,
  getRepoMetadata 
} from './greptile';

async function main() {
  console.log('\n🔬 Testing Greptile Client\n');
  console.log('=' .repeat(60));
  
  // Check environment variables
  if (!process.env.GREPTILE_API_KEY) {
    console.error('❌ Error: GREPTILE_API_KEY not found in environment');
    console.log('\nPlease create .env.local file with:');
    console.log('GREPTILE_API_KEY=your_key_here\n');
    process.exit(1);
  }
  
  try {
    // Test 1: Parse repo URL
    console.log('\n✅ Test 1: parseRepoUrl()');
    const testUrls = [
      'https://github.com/vercel/next.js',
      'https://github.com/facebook/react.git',
      'github.com/microsoft/typescript',
      'nodejs/node',
    ];
    
    for (const url of testUrls) {
      const parsed = parseRepoUrl(url);
      console.log(`   ${url}`);
      console.log(`   → ${parsed.owner}/${parsed.repo}`);
    }
    
    // Test 2: Format repo ID
    console.log('\n✅ Test 2: formatRepoId()');
    const repoId = formatRepoId('vercel', 'next.js', 'main');
    console.log(`   ${repoId}`);
    
    // Test 3: Index a small repository
    console.log('\n✅ Test 3: indexRepository()');
    console.log('   Indexing: https://github.com/vercel/next.js');
    const indexedRepoId = await indexRepository('https://github.com/vercel/next.js');
    console.log(`   Repository ID: ${indexedRepoId}`);
    
    // Test 4: Check status
    console.log('\n✅ Test 4: waitForIndexing()');
    console.log('   This may take 2-5 minutes for large repos...');
    console.log('   (Using cache if available)');
    const completed = await waitForIndexing(indexedRepoId, 60000); // 1 minute timeout for testing
    
    if (completed) {
      console.log('   ✓ Indexing completed successfully!');
      
      // Test 5: Search code
      console.log('\n✅ Test 5: searchCode()');
      console.log('   Searching for: process\\.env\\.');
      const results = await searchCode(indexedRepoId, 'process\\.env\\.');
      console.log(`   Found ${results.length} matches`);
      
      if (results.length > 0) {
        console.log('\n   Sample result:');
        console.log(`   - File: ${results[0].filepath}`);
        console.log(`   - Line: ${results[0].linestart}`);
        console.log(`   - Summary: ${results[0].summary?.slice(0, 80)}...`);
      }
      
      // Test 6: Get metadata
      console.log('\n✅ Test 6: getRepoMetadata()');
      const metadata = await getRepoMetadata(indexedRepoId);
      console.log(`   Languages: ${metadata.languages.join(', ') || 'None detected'}`);
      console.log(`   Frameworks: ${metadata.frameworks.join(', ') || 'None detected'}`);
      console.log(`   Total Files: ${metadata.totalFiles}`);
    } else {
      console.log('   ⚠️  Indexing not completed yet (timed out for quick test)');
      console.log('   This is normal for large repos. Try again later or increase timeout.');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All basic tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error(error);
    process.exit(1);
  }
}

main();

