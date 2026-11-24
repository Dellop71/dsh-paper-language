#!/usr/bin/env node
/**
 * 语料检索 CLI（零依赖）。
 *
 *   node scripts/corpus_search.mjs "increased yield" --lang en --fn result
 *   node scripts/corpus_search.mjs "微生物 群落" --lang zh
 *   node scripts/corpus_search.mjs "replant" --limit 20 --json
 */
import { search, byFunction, formatHits, FUNCTIONS, stats } from '../lib/corpus.js';

const argv = process.argv.slice(2);
const opts = { lang: 'both', fn: '', limit: 8, json: false, sample: false, words: [] };

for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--lang') opts.lang = argv[++i] || 'both';
  else if (a.startsWith('--lang=')) opts.lang = a.slice(7);
  else if (a === '--en') opts.lang = 'en';
  else if (a === '--zh') opts.lang = 'zh';
  else if (a === '--fn') opts.fn = argv[++i] || '';
  else if (a.startsWith('--fn=')) opts.fn = a.slice(5);
  else if (a === '--limit' || a === '-n') opts.limit = Number(argv[++i]) || 8;
  else if (a === '--json') opts.json = true;
  else if (a === '--stats') opts.sample = true;
  else if (a === '--help' || a === '-h') {
    console.log(
      '用法：node scripts/corpus_search.mjs <关键词...> [--lang en|zh|both] [--fn <' +
        FUNCTIONS.join('|') +
        '>] [--limit n] [--json]\n      node scripts/corpus_search.mjs --stats',
    );
    process.exit(0);
  } else opts.words.push(a);
}

if (opts.sample) {
  console.log(JSON.stringify(stats(), null, 2));
  process.exit(0);
}

if (opts.fn && !FUNCTIONS.includes(opts.fn)) {
  console.error(`未知 --fn「${opts.fn}」。可用：${FUNCTIONS.join(' / ')}`);
  process.exit(2);
}

if (opts.words.length === 0) {
  console.error('给一个关键词。例如：node scripts/corpus_search.mjs "increased" --fn result');
  process.exit(2);
}

const query = opts.words.join(' ');
const hits = opts.fn && opts.words.length === 0
  ? byFunction(opts.fn, { lang: opts.lang === 'zh' ? 'zh' : 'en', limit: opts.limit })
  : search(query, { lang: opts.lang, fn: opts.fn || undefined, limit: opts.limit });

if (opts.json) {
  console.log(JSON.stringify({ query, count: hits.length, hits }, null, 2));
} else {
  console.log(`查询：${query}${opts.fn ? ` · fn=${opts.fn}` : ''} · 命中 ${hits.length}\n`);
  console.log(formatHits(hits));
}
