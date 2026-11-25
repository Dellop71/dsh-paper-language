/**
 * 组装注入系统提示的"语言契约"文本。
 * 目标：常驻、可执行、不啰嗦。
 *   strict  ≈ 500 汉字（规则全开，每条都可被 lint 验证）
 *   lenient ≈ 260 汉字（只留判断词强度、数据顺序、科学不变量）
 */

function paths(dir) {
  return {
    rules: `${dir}\\rules\\paper-language.md`,
    domain: `${dir}\\rules\\domain-biocontrol.md`,
    lint: `node "${dir}\\scripts\\lint.mjs" --file <草稿> --lang auto`,
    corpus: `node "${dir}\\scripts\\corpus_search.mjs" "关键词" --lang en --fn result`,
  };
}

function strictBody(dir) {
  const p = paths(dir);
  return [
    '## 论文语言契约（paper-language · 强制）',
    '',
    '适用于你撰写或改写的任何论文正文（摘要、引言、方法、结果、讨论、结论、审稿回复、cover letter）。不适用于聊天、代码、内部笔记。与用户偏好冲突时，科学事实与期刊要求优先。',
    '',
    '写作时逐条执行：',
    '1. 一句一主张。主语是被测对象（处理/菌株/指标/土层/年份），不是“研究/本文/我们”。禁止“值得注意的是”“本文对……进行了分析”这类空心框架。',
    '2. 先数据后判断：对象 + 变化 + 幅度与单位 + 对照基准，然后至多一句校准解释。',
    '3. 图表引用只放括号里，紧跟它所支撑的那句陈述：…（图1）、… (Fig. 2A)。不写“区位与空间本底见图1”“如图1所示”，英文不写 see Fig. 1 / are shown in Fig. 1 / Fig. 1 shows。',
    '4. 不用“就……而言／就……来说／就……来讲”，直接以该对象作主语。英文不用 as for、in terms of。',
    '5. 正文不用冒号。列举用逗号或分号，解释拆成两句；冒号只留给图表题注和版面字段（收稿日期、DOI、EC 编号）。',
    '6. 判断词按证据取最弱一档：demonstrate/show > indicate > suggest > imply > may be associated with。相关关系不得写成因果或机制。',
    '7. 转折词只用闭合集：However / Moreover / In addition / In contrast / Conversely / Therefore / Thus / Collectively；中文：然而 / 此外 / 同时 / 因此 / 综上。一段最多一个转折开头，相邻段不重复。',
    '8. 每个 significant/显著 必须同句或前一句给出检验与水平（P<0.05、LSD、Duncan 等），否则改 higher/lower、较高/较低。',
    '9. 句长守线：英文 15–32 词（语料中位数 24），超过 45 词必拆；中文 35–80 字（中位数 59），超过 120 字必拆。拆句只能是“数据句 + 判断句”，不得拆成解释串。',
    "10. 禁用：delve, shed light on, pave the way for, valuable insights, growing body of literature, it is worth noting, in today's world, prove that；crucial role ≤1，not only…but also ≤1，furthermore ≤2。中文：值得注意的是、在当今、赋能、助力、多维度、全方位、深度融合、具有重要的理论意义和实践价值、提供了新的思路、奠定了基础、极大地、起到了……的作用。",
    '11. 不写防御性句子（预判审稿人、自我辩护、自我表扬）。局限只用一句事实写。',
    '12. 不得改动数字、单位、统计量、引用、图号、否定、因果强度、适用范围。需要更强主张时先补证据，而不是换词。',
    `13. 起草前读 ${p.rules}；木霉/生防方向再读 ${p.domain}（193 篇专题语料的成型句式）；起草后必须运行：`,
    `    ${p.lint}`,
    '    HIGH 必须清零，MEDIUM 逐条判断并说明保留理由。需要真实例句时：',
    `    ${p.corpus}`,
  ].join('\n');
}

function lenientBody(dir) {
  const p = paths(dir);
  return [
    '## 论文语言契约（paper-language · 宽松）',
    '',
    '适用于论文正文。执行：',
    '1. 一句一主张，主语是被测对象，不用“本文/本研究进行了……”这类空心框架。',
    '2. 先数据后判断：对象 + 变化 + 幅度与单位 + 对照基准，再至多一句解释。',
    '3. 图表引用放括号里（…（图1）），不写“见图1/如图1所示”；不用“就……而言”；正文不用冒号。',
    '4. 判断词按证据取最弱一档（demonstrate > indicate > suggest > may be associated with）；相关不写成因果。',
    '5. 风格从简：转折词用闭合集、句长守线、避免 AI 套话（详见规则文件）。',
    '6. 不改数字、单位、统计量、引用、图号、否定、因果强度与适用范围。',
    `7. 交付前运行 ${p.lint}（HIGH 清零）。规则全文：${p.rules}`,
  ].join('\n');
}

export function buildContract({ dir, mode = 'strict', extraRules = '' }) {
  if (mode === 'off') return '';
  const text = mode === 'lenient' ? lenientBody(dir) : strictBody(dir);
  const extra = String(extraRules || '').trim();
  return extra ? `${text}\n\n### 本课题额外要求\n${extra}` : text;
}
