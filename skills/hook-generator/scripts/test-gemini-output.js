const { spawn } = require('child_process');
const fs = require('fs');

async function testGeminiOutput() {
  const prompt = 'Generate 1 hook for LinkedIn about LinkedIn infographics. Return only JSON: {"hooks": [{"hook_text": "test", "pattern": "test", "why_it_works": "test", "estimated_score": 80, "similar_to_example": 1}]}';
  
  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    
    const gemini = spawn('gemini', ['-o', 'json', '-p', prompt], {
      cwd: process.cwd()
    });

    gemini.stdout.on('data', (data) => {
      output += data.toString();
    });

    gemini.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    gemini.on('close', (code) => {
      console.log('=== RAW OUTPUT ===');
      console.log(output);
      console.log('==================');
      
      // Try the regex match
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      console.log('\n=== REGEX MATCH ===');
      console.log(jsonMatch ? jsonMatch[0].substring(0, 200) + '...' : 'NO MATCH');
      console.log('==================');
      
      if (jsonMatch) {
        try {
          const result = JSON.parse(jsonMatch[0]);
          console.log('\n=== PARSED RESULT ===');
          console.log(typeof result);
          console.log(Object.keys(result));
          console.log('==================');
        } catch (err) {
          console.log('Parse error:', err.message);
        }
      }
      
      resolve(output);
    });
  });
}

testGeminiOutput();
