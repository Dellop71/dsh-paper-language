/**
 * 语料检索：直接读 corpus/*.jsonl（由 scripts/build_corpus.py 生成）。
 * 不依赖任何第三方库；7k 级句子常驻内存约 4 MB，可接受。
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEFAULT_DIR = join(HERE, '..', 'corpus');

export const FUNCTIONS = [
  'background',
  'gap',
  'objective',
  'method',
  'result',
  'interpretation',
  'comparison',
  'limitation',
  'conclusion',
];

const cache = new Map();

function loadFile(path) {
  if (cache.has(path)) return cache.get(path);
  const rows = [];
  if (existsSync(path)) {
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        rows.push(JSON.parse(line));
      } catch {
        /* 跳过坏行，不让一条脏数据毁掉整个检索 */
      }
    }
  }
  cache.set(path, rows);
  return rows;
}

export function loadCorpus(dir = DEFAULT_DIR) {
  return {
    en: loadFile(join(dir, 'phrases.en.jsonl')),
    zh: loadFile(join(dir, 'phrases.zh.jsonl')),
  };
}

export function stats(dir = DEFAULT_DIR) {
  const p = join(dir, 'stats.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function score(text, terms) {
  const t = text.toLowerCase();
  let s = 0;
  for (const term of terms) {
    if (!t.includes(term)) return -1;
    s += t.split(term).length - 1;
  }
  // 短句优先：同等相关时，越短越像"可直接借用的句式"
  return s - text.length / 400;
}

/**
 * @param {string} query 空格分隔的多个词，全部命中才算匹配
 * @param {{lang?: 'en'|'zh'|'both', fn?: string, limit?: number, dir?: string}} [opts]
 */
export function search(query, opts = {}) {
  const { lang = 'both', fn, limit = 8, dir = DEFAULT_DIR } = opts;
  const corpus = loadCorpus(dir);
  const terms = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (terms.length === 0) return [];

  const pools = [];
  if (lang === 'en' || lang === 'both') pools.push(['en', corpus.en]);
  if (lang === 'zh' || lang === 'both') pools.push(['zh', corpus.zh]);

  const out = [];
  for (const [lg, rows] of pools) {
    for (const row of rows) {
      if (fn && row.fn !== fn) continue;
      const s = score(row.text, terms);
      if (s < 0) continue;
      out.push({ ...row, score: s });
    }
  }
  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}

export function byFunction(fn, opts = {}) {
  const { lang = 'en', limit = 5, dir = DEFAULT_DIR } = opts;
  const corpus = loadCorpus(dir);
  const rows = (lang === 'zh' ? corpus.zh : corpus.en).filter((r) => r.fn === fn);
  const out = [];
  const step = Math.max(1, Math.floor(rows.length / Math.max(limit, 1)));
  for (let i = 0; i < rows.length && out.length < limit; i += step) out.push(rows[i]);
  return out;
}

export function formatHits(hits, { showSource = true } = {}) {
  if (hits.length === 0) return '（无匹配。换更短的词，或去掉 --fn 限制）';
  return hits
    .map((h, i) => {
      const tag = `${h.lang}/${h.fn}${showSource ? ` · ${h.src.replace(/\.pdf$/i, '')}` : ''}`;
      return `${i + 1}. [${tag}] ${h.text}`;
    })
    .join('\n');
}
