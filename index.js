/**
 * dsh-paper-language —— 论文语言契约插件（宿主侧）
 *
 * 做三件事：
 *   1) 把语料提炼出的语言规则作为常驻 system prompt section 注入（每个 agent、每一轮）；
 *   2) 注册 4 个斜杠命令：/paper-lang /paper-rules /paper-lint /paper-corpus；
 *   3) 提供零依赖的 lint 与语料检索（同一套代码也被 scripts/*.mjs CLI 复用）。
 *
 * 版本兼容策略：不 import 任何 @deepseek-ai/* 包，只通过 ctx 服务取用；
 * 服务缺失时静默降级（不抛错、不阻断其它插件），因此任何 DSH 版本都能装上。
 */
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

import { lint, formatReport, autofix } from './lib/lint.js';
import { search, stats as corpusStats, formatHits, FUNCTIONS } from './lib/corpus.js';
import { buildContract } from './lib/prompt.js';

const PLUGIN_DIR = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = join(PLUGIN_DIR, 'rules');
const CORPUS_DIR = join(PLUGIN_DIR, 'corpus');
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh');
const STATE_FILE = join(DSH_HOME, 'paper-language.json');

const DEFAULT_CONFIG = {
  mode: 'strict', // strict | lenient | off
  lang: 'auto', // auto | en | zh
  order: 5000,
  extraRules: '',
};

let mounted = false; // 防止重复挂载导致 section 重名抛错

function log(ctx, level, msg) {
  const logger = ctx?.logger;
  try {
    if (logger && typeof logger[level] === 'function') logger[level](`[paper-language] ${msg}`);
    else if (level === 'error' || level === 'warn') console.warn(`[paper-language] ${msg}`);
  } catch {
    /* 日志失败不影响主流程 */
  }
}

function readState() {
  try {
    if (!existsSync(STATE_FILE)) return {};
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) || {};
  } catch {
    return {};
  }
}

function writeState(patch) {
  try {
    const next = { ...readState(), ...patch };
    if (!existsSync(DSH_HOME)) mkdirSync(DSH_HOME, { recursive: true });
    writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

/** 配置优先级：运行时开关（$DSH_HOME/paper-language.json） > patch 里的 config */
function resolveSettings(config = {}) {
  const saved = readState();
  const pick = (key) => (saved[key] !== undefined && saved[key] !== null ? saved[key] : config[key]);
  return {
    mode: pick('mode') ?? DEFAULT_CONFIG.mode,
    lang: pick('lang') ?? DEFAULT_CONFIG.lang,
    order: Number.isFinite(Number(config.order)) ? Number(config.order) : DEFAULT_CONFIG.order,
    extraRules: config.extraRules ?? DEFAULT_CONFIG.extraRules,
  };
}

// ------------------------------------------------------------------ 命令实现

function helpText() {
  return [
    '论文语言契约 —— 可用命令：',
    '  /paper-lang [status|on|off|strict|lenient|lang en|zh|auto]',
    '      查看状态或切换强制档位。off 会立即撤下系统提示里的语言契约。',
    '  /paper-rules [章节关键词]',
    '      打印规则全文；带关键词（如 gap、结果、局限、banned）只看该节。',
    '  /paper-lint <文本 | @文件路径> [--lang en|zh] [--all] [--fix]',
    '      按语料基线检查句长、禁用表达、判断词强度、显著性与检验。',
    '  /paper-corpus <关键词> [--en|--zh] [--fn background|gap|objective|method|result|interpretation|comparison|limitation|conclusion]',
    '      从你自己的 7672 句语料里检索真实例句。',
  ].join('\n');
}

function statusText(settings) {
  const st = corpusStats(CORPUS_DIR);
  const lines = [
    `档位：${settings.mode}　语言：${settings.lang}`,
    `规则目录：${RULES_DIR}`,
    `语料：英文 ${st?.en?.__total__ ?? '?'} 句 / 中文 ${st?.zh?.__total__ ?? '?'} 句` +
      `（来源 ${st?.files?.en ?? '?'} + ${st?.files?.zh ?? '?'} 篇）`,
    `运行时开关文件：${STATE_FILE}`,
  ];
  if (settings.mode === 'off') lines.push('⚠ 当前已关闭，系统提示中不再包含语言契约。用 /paper-lang on 恢复。');
  return lines.join('\n');
}

function readRuleFile(section) {
  const files = ['paper-language.md', 'frames.md', 'banned.md'].map((f) => join(RULES_DIR, f));
  const key = String(section || '').trim().toLowerCase();
  if (!key) {
    return files
      .filter((f) => existsSync(f))
      .map((f) => `# ${f}\n${readFileSync(f, 'utf8')}`)
      .join('\n\n---\n\n');
  }
  const alias = {
    banned: 'banned.md',
    禁用: 'banned.md',
    frames: 'frames.md',
    句式: 'frames.md',
    骨架: 'frames.md',
  };
  const target = alias[key];
  if (target) {
    const p = join(RULES_DIR, target);
    return existsSync(p) ? readFileSync(p, 'utf8') : `找不到 ${target}`;
  }
  // 按二级标题抽取
  const all = files.filter((f) => existsSync(f)).map((f) => readFileSync(f, 'utf8')).join('\n\n');
  const blocks = all.split(/\n(?=## )/);
  const hit = blocks.filter((b) => b.split('\n')[0].toLowerCase().includes(key));
  if (hit.length === 0) return `规则里没有匹配「${section}」的小节。可选：${blocks.map((b) => b.split('\n')[0].replace(/^##\s*/, '')).filter(Boolean).join(' | ')}`;
  return hit.join('\n\n');
}

function parseLintArgs(raw) {
  const out = { text: '', lang: 'auto', all: false, fix: false, file: '' };
  const rest = [];
  const tokens = String(raw || '').split(/\s+/);
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t === '--all') out.all = true;
    else if (t === '--fix') out.fix = true;
    else if (t === '--lang') out.lang = tokens[++i] || 'auto';
    else if (t.startsWith('--lang=')) out.lang = t.slice(7);
    else if (t === '--file') out.file = tokens[++i] || '';
    else rest.push(t);
  }
  out.text = rest.join(' ').trim();
  return out;
}

function looksLikePath(s) {
  if (!s) return false;
  if (/^@/.test(s)) return true;
  if (/^[A-Za-z]:[\\/]/.test(s)) return true;
  if (/\.(md|txt|tex|docx|csv|json)$/i.test(s)) return true;
  return false;
}

function loadTargetText(args) {
  const candidate = args.file || args.text;
  if (looksLikePath(candidate)) {
    const p = resolve(candidate.replace(/^@/, '').trim());
    if (!existsSync(p)) return { error: `文件不存在：${p}` };
    const st = statSync(p);
    if (st.isDirectory()) return { error: `这是目录：${p}` };
    if (/\.docx$/i.test(p)) return { error: 'docx 请先转成纯文本（或用 DSH 的文档工具读出正文）后再 lint。' };
    return { text: readFileSync(p, 'utf8'), source: p };
  }
  if (!candidate) return { error: '没有可检查的文本。用法：/paper-lint <文本> 或 /paper-lint @C:\\path\\draft.md' };
  return { text: candidate, source: '(命令内联文本)' };
}

function corpusCommand(raw) {
  const tokens = String(raw || '').split(/\s+/).filter(Boolean);
  let lang = 'both';
  let fn;
  const words = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i];
    if (t === '--en' || t === '--en-only') lang = 'en';
    else if (t === '--zh') lang = 'zh';
    else if (t === '--fn') fn = tokens[++i];
    else if (t.startsWith('--fn=')) fn = t.slice(5);
    else if (t === '--lang') lang = tokens[++i] === 'zh' ? 'zh' : 'en';
    else words.push(t);
  }
  if (fn && !FUNCTIONS.includes(fn)) {
    return { kind: 'error', text: `未知功能标签「${fn}」。可用：${FUNCTIONS.join(' / ')}` };
  }
  if (words.length === 0) {
    return {
      kind: 'error',
      text: `用法：/paper-corpus 关键词 [--en|--zh] [--fn ${FUNCTIONS.slice(0, 4).join('|')}…]\n例：/paper-corpus increased yield --en --fn result`,
    };
  }
  const hits = search(words.join(' '), { lang, fn, limit: 10, dir: CORPUS_DIR });
  return { kind: 'success', text: formatHits(hits) };
}

function applyMode(settings, action) {
  const map = {
    on: 'strict',
    strict: 'strict',
    lenient: 'lenient',
    soft: 'lenient',
    off: 'off',
  };
  const mode = map[action];
  if (!mode) return null;
  settings.mode = mode;
  writeState({ mode });
  return mode;
}

function registerCommands(ctx, settings) {
  const commands = ctx.commands || (typeof ctx.get === 'function' ? ctx.get('commands') : undefined);
  if (!commands || typeof commands.register !== 'function') {
    log(ctx, 'debug', '宿主未提供 commands 服务，跳过斜杠命令注册（语言契约仍然生效）');
    return;
  }
  const disposers = [];
  const reg = (definition) => {
    try {
      const dispose = commands.register(definition);
      if (typeof dispose === 'function') disposers.push(dispose);
    } catch (error) {
      log(ctx, 'debug', `注册 /${definition.name} 失败：${error?.message || error}`);
    }
  };

  reg({
    name: 'paper-lang',
    description: '论文语言契约：查看状态 / 切换严格、宽松、关闭（status|on|off|lenient|lang en）',
    input: { hint: '[status|on|off|strict|lenient|lang en|zh|auto]' },
    handler(invocation) {
      const raw = String(invocation?.rawInput ?? invocation?.input ?? '').trim();
      const [action, value] = raw.split(/\s+/);
      if (!action || action === 'status') return { kind: 'success', ok: true, text: statusText(settings) };
      if (action === 'help') return { kind: 'success', ok: true, text: helpText() };
      if (action === 'lang') {
        const lang = ['en', 'zh', 'auto'].includes(value) ? value : null;
        if (!lang) return { kind: 'error', text: '用法：/paper-lang lang en|zh|auto' };
        settings.lang = lang;
        writeState({ lang });
        return { kind: 'success', text: `检查语言已设为 ${lang}。` };
      }
      const mode = applyMode(settings, action);
      if (!mode) return { kind: 'error', text: `未知动作「${action}」。\n\n${helpText()}` };
      const tail = mode === 'off' ? '语言契约已从系统提示撤下（下一轮生效）。' : `语言契约档位：${mode}（下一轮生效）。`;
      return { kind: 'success', text: `${tail}\n\n${statusText(settings)}` };
    },
  });

  reg({
    name: 'paper-rules',
    description: '打印论文语言规则全文，或按关键词只看一节（gap / 结果 / 局限 / banned / frames）',
    input: { hint: '[关键词]' },
    handler(invocation) {
      const key = String(invocation?.rawInput ?? invocation?.input ?? '').trim();
      try {
        return { kind: 'success', text: readRuleFile(key) };
      } catch (error) {
        return { kind: 'error', text: `读取规则失败：${error?.message || error}` };
      }
    },
  });

  reg({
    name: 'paper-lint',
    description: '按语料基线检查一段文本或一个文件的句长、禁用表达、判断词与显著性',
    input: { hint: '<文本 | @文件路径> [--lang en|zh] [--all] [--fix]' },
    handler(invocation) {
      const args = parseLintArgs(invocation?.rawInput ?? invocation?.input ?? '');
      const target = loadTargetText(args);
      if (target.error) return { kind: 'error', text: target.error };
      const lang = args.lang === 'auto' ? settings.lang : args.lang;
      const result = lint(target.text, { lang });
      const report = formatReport(result, { limit: args.all ? 999 : 40 });
      if (args.fix) {
        const fixed = autofix(target.text);
        return {
          kind: 'success',
          text: `${report}\n\n—— 安全替换（${fixed.replacements} 处，仅字面替换，不改语义）——\n${fixed.text}`,
        };
      }
      return { kind: 'success', text: `来源：${target.source}\n\n${report}` };
    },
  });

  reg({
    name: 'paper-corpus',
    description: '从你自己的 SCI/中文语料里检索真实例句（按功能标签过滤）',
    input: { hint: '<关键词> [--en|--zh] [--fn result]' },
    handler(invocation) {
      const out = corpusCommand(invocation?.rawInput ?? invocation?.input ?? '');
      return out;
    },
  });

  log(ctx, 'info', '已注册 /paper-lang /paper-rules /paper-lint /paper-corpus');
  return () => {
    for (const dispose of disposers.reverse()) {
      try {
        dispose();
      } catch {
        /* 忽略卸载异常 */
      }
    }
  };
}

// ------------------------------------------------------------------ 插件入口

export function apply(ctx, config = {}) {
  const settings = resolveSettings(config || {});

  // 1) 常驻系统提示
  if (typeof ctx.inject === 'function') {
    ctx.inject(['systemPrompt'], (sctx) => {
      const service = sctx.systemPrompt || (typeof sctx.get === 'function' ? sctx.get('systemPrompt') : undefined);
      if (!service || typeof service.section !== 'function') return;
      const mount = () => {
        if (mounted) return () => undefined;
        const dispose = service.section({
          name: 'paper-language-contract',
          order: settings.order,
          text: () =>
            buildContract({
              dir: PLUGIN_DIR,
              mode: settings.mode,
              extraRules: settings.extraRules,
            }),
          interpolate: false,
        });
        mounted = true;
        log(ctx, 'info', `语言契约已注入系统提示（档位 ${settings.mode}，order ${settings.order}）`);
        return () => {
          mounted = false;
          try {
            dispose();
          } catch {
            /* 卸载时忽略 */
          }
        };
      };
      if (typeof sctx.effect === 'function') sctx.effect(mount, 'paper-language: system prompt section');
      else mount();
    });

    // 2) 斜杠命令
    ctx.inject(['commands'], (cctx) => {
      const dispose = registerCommands(cctx, settings);
      if (typeof cctx.effect === 'function' && typeof dispose === 'function') {
        cctx.effect(() => dispose, 'paper-language: slash commands');
      }
    });
  } else {
    log(ctx, 'warn', 'ctx.inject 不可用，插件未挂载');
  }
}

/** 供 CLI / 其它插件复用 */
export const api = {
  lint,
  formatReport,
  autofix,
  search,
  formatHits,
  buildContract,
  paths: { plugin: PLUGIN_DIR, rules: RULES_DIR, corpus: CORPUS_DIR },
};

export default apply;
