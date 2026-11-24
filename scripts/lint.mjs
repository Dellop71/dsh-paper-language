#!/usr/bin/env node
/**
 * 论文语言 lint CLI（零依赖）。
 *
 *   node scripts/lint.mjs --file draft.md
 *   node scripts/lint.mjs --file draft.md --lang zh --all
 *   cat draft.txt | node scripts/lint.mjs --stdin --json
 *   node scripts/lint.mjs "One sentence to check." --lang en
 *
 * 退出码：0 = 无 HIGH；1 = 有 HIGH（便于在流程里当闸门用）；2 = 用法错误。
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { lint, formatReport, autofix } from '../lib/lint.js';

const argv = process.argv.slice(2);
const opts = { file: '', stdin: false, lang: 'auto', json: false, all: false, fix: false, text: [] };

for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--file' || a === '-f') opts.file = argv[++i] || '';
  else if (a === '--stdin') opts.stdin = true;
  else if (a === '--lang') opts.lang = argv[++i] || 'auto';
  else if (a.startsWith('--lang=')) opts.lang = a.slice(7);
  else if (a === '--json') opts.json = true;
  else if (a === '--all') opts.all = true;
  else if (a === '--fix') opts.fix = true;
  else if (a === '--help' || a === '-h') {
    console.log('用法：node scripts/lint.mjs [--file 路径 | --stdin | "文本"] [--lang auto|en|zh] [--json] [--all] [--fix]');
    process.exit(0);
  } else opts.text.push(a);
}

let text = '';
let source = '';
try {
  if (opts.file) {
    const p = resolve(opts.file);
    text = readFileSync(p, 'utf8');
    source = p;
  } else if (opts.stdin) {
    text = readFileSync(0, 'utf8');
    source = '(stdin)';
  } else if (opts.text.length > 0) {
    text = opts.text.join(' ');
    source = '(inline)';
  } else {
    console.error('没有输入。用 --file、--stdin 或直接给文本。');
    process.exit(2);
  }
} catch (error) {
  console.error(`读取失败：${error.message}`);
  process.exit(2);
}

const result = lint(text, { lang: opts.lang });

if (opts.json) {
  console.log(JSON.stringify({ source, ...result }, null, 2));
} else {
  console.log(`来源：${source}`);
  console.log(formatReport(result, { limit: opts.all ? 999 : 40 }));
  if (opts.fix) {
    const fixed = autofix(text);
    console.log(`\n—— 安全替换（${fixed.replacements} 处）——\n${fixed.text}`);
  }
}

process.exit(result.counts.HIGH > 0 ? 1 : 0);
