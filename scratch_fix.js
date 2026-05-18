const fs = require('fs');
const file = 'src/actions/ai.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Update resolveGroqKey to return groqClients
code = code.replace(
  'async function resolveGroqKey(): Promise<{ groq: Groq; isAdmin: boolean } | null> {',
  `// Helper to execute groq request with automatic retry on 429 rate limits
async function executeGroqWithRetry(
  resolved: { groqClients: Groq[]; isAdmin: boolean },
  params: Parameters<Groq['chat']['completions']['create']>[0]
) {
  let lastError: any;
  // Shuffle clients for load balancing
  const clients = [...resolved.groqClients].sort(() => Math.random() - 0.5);
  for (const groq of clients) {
    try {
      return await groq.chat.completions.create(params);
    } catch (err: any) {
      lastError = err;
      // If rate limited (429) and we have more keys, try the next one
      if (err?.status === 429 || err?.message?.includes('429')) {
        console.log('Groq 429 Rate Limit hit. Switching to another API key...');
        continue;
      }
      throw err; // Other errors (like 400 Bad Request) throw immediately
    }
  }
  throw lastError;
}

// ── Groq key resolver — admin uses env key, others use their stored key ─────
async function resolveGroqKey(): Promise<{ groqClients: Groq[]; isAdmin: boolean } | null> {`
);

code = code.replace(
  'return { groq: new Groq({ apiKey: randomKey }), isAdmin: true }',
  'return { groqClients: keys.map(k => new Groq({ apiKey: k })), isAdmin: true }'
);

code = code.replace(
  'return { groq: new Groq({ apiKey: profile.groq_api_key }), isAdmin: false }',
  'return { groqClients: [new Groq({ apiKey: profile.groq_api_key })], isAdmin: false }'
);

// 2. Replace all groq.chat.completions.create calls
code = code.replace(/await resolved\.groq\.chat\.completions\.create\(/g, 'await executeGroqWithRetry(resolved, ');

// 3. Fix the type casting inside chatWithAI
code = code.replace(
  "tools: MAYAZ_OS_TOOLS as unknown as Parameters<typeof resolved.groq.chat.completions.create>[0]['tools'],",
  "tools: MAYAZ_OS_TOOLS as unknown as Parameters<Groq['chat']['completions']['create']>[0]['tools'],"
);

fs.writeFileSync(file, code);
console.log('Fixed ai.ts');
