/**
 * 确定性论文语言检查器（零依赖）。
 *
 * 设计原则：
 *  1) 只报可判定的问题（字符串 / 正则 / 计数 / 句长），不做"文风品味"评判；
 *  2) 每条 finding 都给出可执行的改法，而不是"建议优化"；
 *  3) 阈值来自语料统计（SCI 40 篇 / 中文 59 篇，见 corpus/stats.json），
 *     不是拍脑袋：英文句长中位数 24 词、p90 38 词；中文句长中位数 59 字、p90 100 字。
 */

const EN_SENT_SPLIT = /(?<=[.!?])\s+(?=[A-Z(\[])/;
const ZH_SENT_SPLIT = /(?<=[。！？；])/;

/** 绝对禁用：语料中 0 次出现，或属于"写作动作"而非科学内容。 */
const EN_BANNED = [
  [/\bdelve(?:s|d|ing)?\b/i, 'delve', '改用具体动作：investigated / examined / quantified'],
  [/\bshed(?:s|ding)? light on\b/i, 'shed light on', '改用 clarify / explain / reveal how'],
  [/\bpav(?:e|es|ed|ing) the way for\b/i, 'pave the way for', '改用 enable / provide a basis for'],
  [/\bvaluable insights?\b/i, 'valuable insights', '删除评价，直接写结论事实'],
  [/\bgrowing body of literature\b/i, 'growing body of literature', '删除；引 1–2 篇具体文献即可'],
  [/\bit is (?:worth|important) (?:noting|to note) that\b/i, 'it is worth noting that', '删除该框架，直接陈述事实'],
  [/\bin today'?s (?:world|era|society)\b/i, "in today's world", '删除时代背景套话'],
  [/\bin the realm of\b/i, 'in the realm of', '改用 in'],
  [/\bnavigat(?:e|es|ed|ing) the (?:landscape|complexity)\b/i, 'navigate the landscape', '删除比喻，写具体关系'],
  [/\btapestry\b/i, 'tapestry', '删除比喻'],
  [/\bunlock(?:s|ed|ing)? the potential\b/i, 'unlock the potential', '改用具体效应动词'],
  [/\bgame[- ]chang(?:er|ers)\b/i, 'game-changer', '删除评价性名词'],
  [/\bparadigm shift\b/i, 'paradigm shift', '删除；除非确有范式变化证据'],
  [/\b(?:obviously|clearly|undoubtedly|needless to say)\b/i, 'obviously / clearly / undoubtedly', '删除副词；主张强度由证据承担'],
  [/\bprove(?:s|d)? that\b/i, 'prove that', '观察性数据用 indicate / demonstrate，不用 prove'],
  [/\bwe (?:would like to|wish to) (?:note|emphasi[sz]e)\b/i, 'we would like to note', '删除；直接写内容'],
  [/\bthis (?:section|chapter|paper) will (?:discuss|describe|present)\b/i, 'this section will discuss', '删除写作元话语，直接进入内容'],
];

/** 限用（密度上限）：语料里存在，但 AI 会滥用。 */
const EN_LIMITED = [
  [/\bcrucial role\b/gi, 'crucial role', 1, '多数场合改成具体动词：governs / determines / limits'],
  [/\bplays? (?:a|an) (?:important|key|critical|vital) role\b/gi, 'plays an important role', 1, '写清"起了什么作用"：promoted / mediated / constrained'],
  [/\bnot only\b[^.]{0,120}\bbut also\b/gi, 'not only … but also', 1, '拆成两句，或只保留对比的一侧'],
  [/\bfurthermore\b/gi, 'furthermore', 2, '改用 Moreover / In addition，或直接删'],
  [/\bmoreover\b/gi, 'moreover', 4, '同一段最多一次；其余用 In addition / 直接并列'],
  [/\bin conclusion\b/gi, 'in conclusion', 1, '结论段首句用 These results / Collectively'],
  [/\bcomprehensive understanding\b/gi, 'comprehensive understanding', 1, '写清理解了哪个机制'],
  [/\bholistic\b/gi, 'holistic', 1, '改用 integrated / whole-system，并说明范围'],
  [/\brobust(?:ly)?\b/gi, 'robust', 2, '写清稳健性来自什么（n、重复、验证集）'],
  [/\bleverage(?:s|d|ing)?\b/gi, 'leverage', 1, '改用 use / exploit / take advantage of'],
  [/\bunderscore(?:s|d|ing)?\b/gi, 'underscore', 1, '改用 highlight / show'],
  [/\bmultifaceted\b/gi, 'multifaceted', 1, '列出具体维度'],
];

/** 中文绝对禁用 / 限用。 */
const ZH_BANNED = [
  [/值得注意的是/g, '值得注意的是', '删除；直接给事实，或改成"此外"'],
  [/在当今(?:社会|时代|世界)/g, '在当今社会', '删除时代背景套话'],
  [/赋能/g, '赋能', '改用具体动词：提高 / 降低 / 缩短'],
  [/助力/g, '助力', '改用 promote / 促进 / 支撑（写明支撑什么）'],
  [/多维度|全方位|立体化/g, '多维度/全方位', '删除形容词，列出具体指标'],
  [/深度融合/g, '深度融合', '写清结合方式'],
  [/具有(?:重要|一定)的?(?:理论|现实|实践)?(?:意义|价值)(?:和|与)(?:实践|理论)(?:意义|价值)?/g, '具有重要的理论意义和实践价值', '删除；结论只写本研究支持的具体判断'],
  [/提供了?(?:新的|一条新的)?(?:思路|方向|视角)/g, '提供了新的思路', '写清"为谁的什么决策提供什么参数"'],
  [/奠定了(?:坚实|重要)?的?(?:基础|理论基础)/g, '奠定了基础', '改用 provide a basis for + 具体对象'],
  [/极大地/g, '极大地', '删除程度副词，用数据表达幅度'],
  [/起到(?:了)?[^。；]{0,12}的作用/g, '起到了……的作用', '直接用作谓动词：促进 / 抑制 / 缓冲'],
  [/进行(?:了)?[^。；]{0,10}的?(?:研究|分析|探讨|测定|评价)/g, '进行了……的研究/分析', '改成动词：研究了 / 分析了 / 测定了 / 评价了'],
  [/通过[^。；]{0,12}的方式/g, '通过……的方式', '删"的方式"，直接用"通过……"'],
  [/随着[^。；]{0,24}的?(?:不断)?(?:发展|推进|深入|提高)/g, '随着……的不断发展', '改写为具体事实：2020 年以来 X 由 A 增至 B'],
];

const ZH_LIMITED = [
  [/综上所述/g, '综上所述', 1, '全文最多一次；其余用"因此 / 综上"或直接给结论'],
  [/重要作用/g, '重要作用', 2, '写清作用方式，避免空泛'],
  [/显著/g, null, 0, '每个"显著"都要有检验与水平（P<0.05 / P<0.01），否则改"较高/较低"'],
];

const SAFE_FIXES = [
  [/\bdelve(?:s|d|ing)? into\b/gi, 'investigate'],
  [/\bshed light on\b/gi, 'clarify'],
  [/\bit is (?:worth|important) (?:noting|to note) that\s*/gi, ''],
  [/\bin order to\b/gi, 'to'],
  [/\bdue to the fact that\b/gi, 'because'],
  [/\ba large number of\b/gi, 'many'],
  [/\bwas found to be\b/gi, 'was'],
  [/\bby us\b/gi, ''],
  [/值得注意的是[，,]?\s*/g, ''],
  [/极大地/g, ''],
  [/通过([^。；]{0,12})的方式/g, '通过$1'],
];

function sentences(text, lang) {
  const out = [];
  for (const para of String(text).split(/\n{2,}|\r\n\r\n/)) {
    const p = para.trim();
    if (!p) continue;
    const parts = lang === 'zh' ? p.split(ZH_SENT_SPLIT) : p.split(EN_SENT_SPLIT);
    for (const s of parts) {
      const t = s.trim();
      if (t) out.push(t);
    }
  }
  return out;
}

function detectLang(text) {
  const s = String(text);
  const han = (s.match(/[\u4e00-\u9fff]/g) || []).length;
  return han / Math.max(s.length, 1) > 0.25 ? 'zh' : 'en';
}

function wordCount(s) {
  return (s.match(/[A-Za-z0-9%°µμ][A-Za-z0-9'’%°µμ.\-]*/g) || []).length;
}

function excerpt(s, max = 90) {
  const flat = String(s).replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : flat.slice(0, max - 1) + '…';
}

/**
 * @param {string} text
 * @param {{lang?: 'en'|'zh'|'auto'}} [opts]
 */
export function lint(text, opts = {}) {
  const raw = String(text ?? '');
  const lang = opts.lang && opts.lang !== 'auto' ? opts.lang : detectLang(raw);
  const findings = [];
  const add = (level, rule, sentence, fix, extra = {}) =>
    findings.push({ level, rule, sentence: excerpt(sentence), fix, ...extra });

  const sents = sentences(raw, lang);
  const totalWords = wordCount(raw);
  const per1k = (n) => (totalWords > 0 ? (n * 1000) / totalWords : 0);

  // ---- 句级检查
  for (const s of sents) {
    if (lang === 'en') {
      const w = wordCount(s);
      if (w > 45) add('HIGH', `句长 ${w} 词（语料 p90 = 38）`, s, '拆成两句：一句给数据，一句给判断');
      else if (w > 36) add('MEDIUM', `句长 ${w} 词（语料中位数 24）`, s, '优先删从句，而不是换词');
      if ((s.match(/,/g) || []).length >= 4 && !/[;:]/.test(s))
        add('MEDIUM', '逗号串句（4 个以上逗号，无分号/冒号）', s, '断句，或把并列项改成列表结构');
      if (/\b(?:may|might|could)\s+(?:potentially|possibly|perhaps)\b/i.test(s))
        add('MEDIUM', '双重模糊（may potentially）', s, '二选一：may 或 potentially');
      if (/\bthe (?:implementation|optimization|evaluation|determination|characterization) of the\b/i.test(s))
        add('MEDIUM', '名词化套叠（the X of the Y of）', s, '还原成动词：we optimized …');
      if (/\bsignificant(?:ly)?\b/i.test(s) && !/\b[Pp]\s*[<>=]\s*0?\.\d+|\bP\s*<\s*0\.0\d|\bF\s*=|ANOVA|LSD|Duncan|Tukey/i.test(s))
        add('MEDIUM', '"significant" 未给检验或水平', s, '补 P 值/检验方法，或改 higher/lower/numerically');
      if (/\bwas found to be\b/i.test(s))
        add('LOW', 'was found to be（冗长被动）', s, '直接写 was + 形容词');
      if (/\bin order to\b/i.test(s)) add('LOW', 'in order to', s, '改 to');
      if (/\bdue to the fact that\b/i.test(s)) add('LOW', 'due to the fact that', s, '改 because');
      if (/\ba large number of\b/i.test(s)) add('LOW', 'a large number of', s, '改 many');
      if (/\b(?:very|really|quite)\s+\w+/i.test(s)) add('LOW', '程度副词 very/quite', s, '删副词，用幅度或数值');
      if (/\bet al\.?\s*$/i.test(s)) add('LOW', '句末残缺引用', s, '补全引用或删除');
    } else {
      const c = s.replace(/\s/g, '').length;
      if (c > 120) add('HIGH', `句长 ${c} 字（语料 p90 = 100）`, s, '拆句：数据一句，判断一句');
      else if (c > 95) add('MEDIUM', `句长 ${c} 字（语料中位数 59）`, s, '删插入语或拆句');
      if ((s.match(/的/g) || []).length >= 7) add('MEDIUM', '「的」字连用 ≥7 次', s, '拆短定语，改成动词句');
      if (/进行/.test(s) && /(?:研究|分析|测定|评价|探讨)/.test(s))
        add('MEDIUM', '「进行……研究/分析」空心动词', s, '直接用实义动词：研究了 / 分析了');
      if (/(?:表明|说明|显示)/.test(s) && (s.match(/(?:表明|说明|显示)/g) || []).length >= 2)
        add('MEDIUM', '一句内重复判断词', s, '只保留一个判断词，后半句改成数据');
      if (/显著/.test(s) && !/P\s*[<>=]|p\s*[<>=]|差异显著|极显著/.test(s))
        add('MEDIUM', '「显著」未给检验水平', s, '补 P 值，或改"较高/较低"');
      if (/是[^。；]{0,30}的(?:重要)?(?:因素|原因|途径|方式)[。；]?/.test(s) && !/主要|关键|主导/.test(s))
        add('LOW', '「是……的因素/原因」弱判断', s, '补限定：主要/次要/在……条件下');
    }
  }

  // ---- 词表检查（绝对禁用）
  const scanTable = (table, lvl) => {
    for (const [re, label, fix] of table) {
      const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = rx.exec(raw)) !== null) {
        const start = Math.max(0, m.index - 40);
        add(lvl, `禁用表达：${label}`, raw.slice(start, m.index + m[0].length + 40), fix);
        if (!re.flags.includes('g')) break;
      }
    }
  };
  scanTable(lang === 'zh' ? ZH_BANNED : EN_BANNED, 'HIGH');

  // ---- 词表检查（密度上限）
  const limited = lang === 'zh' ? ZH_LIMITED : EN_LIMITED;
  for (const [re, label, cap, fix] of limited) {
    const hits = raw.match(re);
    if (!hits) continue;
    if (label === null) {
      const n = hits.length;
      const sigSentences = sents.filter((s) => /显著/.test(s)).length;
      if (n > Math.max(3, sigSentences))
        add('MEDIUM', `「显著」使用 ${n} 次，其中 ${sigSentences} 句带检验线索`, raw.slice(0, 80), fix);
      continue;
    }
    if (hits.length > cap)
      add('MEDIUM', `限用表达超限：${label} × ${hits.length}（上限 ${cap}）`, raw.slice(0, 80), fix);
  }

  // ---- 篇章级
  if (lang === 'en') {
    const dash = (raw.match(/—|–/g) || []).length;
    if (per1k(dash) > 3) add('MEDIUM', `破折号密度 ${per1k(dash).toFixed(1)}/千词`, raw.slice(0, 80), '改成括号或逗号从句');
    const we = (raw.match(/\bwe\b/gi) || []).length;
    if (totalWords > 300 && per1k(we) > 12)
      add('LOW', `第一人称 we 密度 ${per1k(we).toFixed(1)}/千词`, raw.slice(0, 80), 'Methods 用被动，Discussion 保留 we');
    if (/\b(?:very|really)\b/i.test(raw)) add('LOW', '口语化程度副词', raw.slice(0, 80), '删除');
  } else {
    if (/[a-zA-Z]{3,}[，。；：]/.test(raw))
      add('LOW', '中英标点混用', raw.slice(0, 80), '中文句内用全角标点');
    const jinxing = (raw.match(/进行/g) || []).length;
    if (jinxing > 2 && per1k(jinxing) > 6)
      add('MEDIUM', `「进行」出现 ${jinxing} 次`, raw.slice(0, 80), '改成具体动词');
  }

  // ---- 去重（同一规则命中同一句只报一次）
  const seen = new Set();
  const unique = [];
  for (const f of findings) {
    const key = `${f.level}|${f.rule}|${f.sentence}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }

  // ---- 统计
  const lens = sents.map((s) => (lang === 'zh' ? s.replace(/\s/g, '').length : wordCount(s)));
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const sorted = [...lens].sort((a, b) => a - b);
  const p90 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9))] : 0;

  return {
    lang,
    stats: {
      sentences: sents.length,
      words: totalWords,
      avgSentence: Number(avg.toFixed(1)),
      p90Sentence: p90,
      corpusMedian: lang === 'zh' ? 59 : 24,
      corpusP90: lang === 'zh' ? 100 : 38,
    },
    findings: unique,
    counts: {
      HIGH: unique.filter((f) => f.level === 'HIGH').length,
      MEDIUM: unique.filter((f) => f.level === 'MEDIUM').length,
      LOW: unique.filter((f) => f.level === 'LOW').length,
    },
  };
}

/** 只做安全字面替换，不做任何语义改写。 */
export function autofix(text) {
  let out = String(text ?? '');
  let n = 0;
  for (const [re, rep] of SAFE_FIXES) {
    out = out.replace(re, (m) => {
      n += 1;
      return rep;
    });
  }
  out = out.replace(/[ \t]{2,}/g, ' ');
  return { text: out, replacements: n };
}

export function formatReport(result, opts = {}) {
  const { lang, stats, findings, counts } = result;
  const lines = [];
  lines.push(
    lang === 'zh'
      ? `语言：中文　句数 ${stats.sentences}　字数 ${String(raw).replace(/\s/g, '').length}`
      : `语言：英文　句数 ${stats.sentences}　词数 ${stats.words}`,
  );
  lines.push(
    `平均句长 ${stats.avgSentence}（语料中位数 ${stats.corpusMedian}）　p90 ${stats.p90Sentence}（语料 p90 ${stats.corpusP90}）`,
  );
  lines.push(`问题：HIGH ${counts.HIGH} / MEDIUM ${counts.MEDIUM} / LOW ${counts.LOW}`);
  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const shown = findings
    .slice()
    .sort((a, b) => order[a.level] - order[b.level])
    .slice(0, opts.limit ?? 40);
  if (shown.length === 0) {
    lines.push('', '未发现可判定问题。');
    return lines.join('\n');
  }
  lines.push('');
  for (const f of shown) {
    lines.push(`[${f.level}] ${f.rule}`);
    if (f.sentence) lines.push(`  句：${f.sentence}`);
    if (f.fix) lines.push(`  改：${f.fix}`);
  }
  if (findings.length > shown.length) lines.push('', `……另有 ${findings.length - shown.length} 条未显示（--all 查看）`);
  return lines.join('\n');
}

export const RULES = { EN_BANNED, EN_LIMITED, ZH_BANNED, ZH_LIMITED };
