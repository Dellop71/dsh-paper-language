# 论文语言契约 v1.0

> 本文件是强制规则，不是建议清单。凡在 DSH 里撰写、改写、润色、回复审稿意见，只要产出物是**论文正文**，就按本文件执行。
> 语料基线：SCI 40 篇（3199 句）+ 中文核心/学位论文 59 篇（4473 句），由 `scripts/build_corpus.py` 统计得出。

## 0. 适用范围与优先级

| 适用 | 不适用 |
|---|---|
| Abstract / Introduction / Methods / Results / Discussion / Conclusion | 聊天回复、代码注释、任务清单、内部笔记 |
| Response to reviewers / Cover letter / 中文摘要与结论 | 参考文献条目、图表标题的机器格式 |
| 中英文论文正文的撰写、润色、扩写、缩写 | 翻译他人原文（保真优先于风格） |

优先级：**科学事实 > 期刊要求 > 本契约 > 作者个人偏好**。
任何一条规则都不得导致数据、单位、统计量、引用、图号、否定、因果强度、适用范围被改动。

## 1. 语料基线（判断"像不像人写的"的硬指标）

| 指标 | 英文 | 中文 |
|---|---|---|
| 句长中位数 | 24 词 | 59 字 |
| 句长 p90 | 38 词 | 100 字 |
| 平均句长 | 25.5 词 | 62.7 字 |
| 最高频段首 | In contrast, / These results / However, the / Compared with | 本研究 / 土壤 / 此外 / 因此 / 然而 |
| 最高频判断词 | indicate(79 +ing) / suggest(33 +ing) / demonstrate / show | 表明(425) / 说明(109) / 结果表明(98) / 结果显示(26) |
| 最高频从句连接 | which(158) / whereas(116) / indicating(79) / while(73) / thereby(43) | 与…相比(123) / 此外(103) / 因此(145) / 同时(174) |

**含义**：语料作者的句子比 AI 短、比 AI 少从句、判断词只有 3–5 个、转折词只有 5–6 个。
写作时向这些数字靠拢，而不是向"更丰富、更流畅"靠拢。

## 2. 十条硬规则

**H1 一句一主张。**
一句话只承载一个可检验的判断。主语是"被测对象"（处理、菌株、指标、土层、年份），不是"研究""本文""我们"。
- ✗ `It is worth noting that the application of biochar significantly improved soil properties, which is of great significance for sustainable agriculture.`
- ✓ `Biochar addition raised soil organic matter by 18.4% relative to CK (P < 0.05; Fig. 3A).`
- ✗ `本研究对土壤微生物群落结构进行了深入的分析，结果表明……`
- ✓ `T4 处理下细菌群落结构与 CK 显著分离（R² = 0.573，P = 0.001；图 4A）。`

**H2 先数据，后判断。**
顺序固定：`对象 + 变化 + 幅度/单位 + 对照基准 +（图表号）` → 至多一句校准解释。
- ✓ `Compared with TF, OFSI increased leaf area by 31.4% over two years (Fig. 5).`
- ✓ `与 CK 相比，B0P2 处理叶片光合速率提高 12.7%，但 B0P2 与 B0P3 间差异不显著。`

**H3 判断词阶梯，按证据取最弱一档。**
`demonstrate/show`（有直接实验证据）> `indicate`（数据指向）> `suggest`（一致但不排除其他解释）> `imply`（间接推理）> `may be associated with`（仅相关）。
禁止把相关升格为机制：相关系数只能说 associated / correlated，不能说 regulated / driven by，除非有阻断实验。
- ✗ `These results prove that Trichoderma regulates the SA pathway.`
- ✓ `These results indicate that Trichoderma treatment is associated with altered SA signaling.`

**H4 转折词闭合集。**
英文：`However` / `Moreover` / `In addition` / `In contrast` / `Conversely` / `Therefore` / `Thus` / `Collectively`。
中文：`然而` / `此外` / `同时` / `因此` / `综上` / `与…相比`。
一段最多一个转折开头；相邻两段不得用同一个开头；`Furthermore` 全篇 ≤2。

**H5 "显著"必须带检验。**
出现 `significant/significantly/显著/极显著` 的句子，同句或前一句必须有 `P < 0.05`、`P < 0.01`、`LSD`、`Duncan`、`Tukey`、`ANOVA`、`差异显著` 之一。
没有检验就写 `higher/lower`、`较高/较低`、`numerically higher`。

**H6 句长守线。**
英文 15–32 词为宜，超过 45 词必须拆；中文 35–80 字为宜，超过 120 字必须拆。
拆句只允许一种方式：**数据句 + 判断句**。不允许把一句拆成三句解释句。

**H7 禁用"写作动作"与自我评价。**
不得出现：本文将对……进行探讨 / this section will discuss / 值得注意的是 / 具有重要意义 / novel, comprehensive, robust（无证据时）/ 极大地 / 显著地提升了综合能力。
评价只能来自数据：不是 `a comprehensive evaluation`，而是 `six indices across two growing seasons`。

**H8 不写"防御性句子"。**
不为预判审稿人而写句子。删掉：`Although limited, this study provides…`、`To the best of our knowledge, this is the first…`（除非确有检索证据）、`Future studies will surely…`。
真实的局限用一句事实写：`The experiment covered two seasons at one site, so the results do not establish multi-year stability.`

**H9 中英各自成句，不做逐字对译。**
中文不写"通过……的方式""对……进行了测定""起到了……的作用""是……的重要因素"。
英文不写 `carry out the measurement of`、`make an analysis of`、`has the ability to`。
详见 §6 Chinglish 对照表。

**H10 交付前必须跑 lint。**
```
node "<插件目录>/scripts/lint.mjs" --file <草稿> --lang auto
```
HIGH 必须清零；MEDIUM 必须逐条判断并说明保留理由。语料检索用：
```
node "<插件目录>/scripts/corpus_search.mjs" "关键词" --lang en --fn result
```

## 3. 功能句式骨架

> 以下骨架全部来自语料，可直接套用；`{}` 内替换为本文事实。完整版见 `frames.md`。

### 3.1 背景（background）
- `{Factor} has been shown to {effect} in {system} (Author, Year).`
- `{Practice} is widely applied to {purpose}, yet {limitation}.`
- `{Indicator} is a key determinant of {process} in {system}.`
- `{对象}是{系统}中{过程}的关键环节，直接影响{结果}。`
- `已有研究表明，{因素}可显著{效应}（作者，年份），但{条件}下的响应尚不清楚。`

### 3.2 空白（gap）
- `However, how {A} responds to {B} remains unclear.`
- `Few studies have quantified {X} under {condition}.`
- `Whether {A} also holds for {B} has not been tested.`
- `然而，{条件}下{A}与{B}的耦合关系尚缺乏定量证据。`
- `目前相关研究多集中于{场景一}，针对{场景二}的系统研究相对缺乏。`

### 3.3 目的（objective）
- `Here, we examined how {A} affects {B} across {levels}.`
- `This study aimed to quantify {X} and to identify {Y}.`
- `We hypothesized that {A} would {direction} {B} because {reason}.`
- `本研究旨在明确{对象}对{指标}的影响，并识别其主要驱动因子。`
- `为解析{机制}，本研究设置{处理}，测定{指标}。`

### 3.4 方法（method）
- `{Variable} was measured using {method} (model, manufacturer, country).`
- `Samples were collected from {site} in {month year} and stored at {condition}.`
- `All analyses were performed in {software} (version); differences were tested by {test} at P < 0.05.`
- `{指标}采用{方法}测定，每个处理{3}次重复。`
- `数据采用{软件}分析，{检验方法}用于多重比较（P < 0.05）。`

### 3.5 结果（result）
- `{Treatment} increased {variable} by {n}% relative to {control} (P < 0.05; Fig. n).`
- `{Variable} was highest under {treatment} and lowest under {control}.`
- `No significant difference in {variable} was detected between {A} and {B}.`
- `{指标}在{T}处理下最高，较{CK}提高{n}%（P < 0.05；图 n）。`
- `{A}与{B}间{指标}差异不显著。`

### 3.6 解释（interpretation）
- `This pattern may be attributed to {mechanism}.`
- `The increase in {A} is consistent with {previous finding}, indicating that {inference}.`
- `One explanation is that {A} {effect}, thereby {consequence}.`
- `{结果}可能是由于{机制}：{证据}。`
- `这与{作者}的结论一致，说明{推断}。`

### 3.7 比较（comparison）
- `In contrast to {A}, {B} {effect}.`
- `Compared with {control}, {treatment} {effect} by {n}%.`
- `This is in line with {Author}, who reported {finding} under {condition}.`
- `与{对照}相比，{处理}{效应}{n}%，而{另一处理}无显著变化。`

### 3.8 局限（limitation）
- `This study covered {scope}, so {inference} cannot be extended to {other scope}.`
- `The {measurement} integrates {A} and {B}; separating them requires {experiment}.`
- `本研究仅覆盖{范围}，{结论}能否外推到{其他条件}仍需验证。`

### 3.9 结论（conclusion）
- `Collectively, these results indicate that {claim}, although {boundary}.`
- `These findings provide a basis for {specific application} in {specific system}.`
- `综上，{处理}通过{机制}改善了{指标}，可为{具体对象}的{具体决策}提供参数依据。`

## 4. 结果动词与搭配

| 语义 | 首选 | 次选 | 避免 |
|---|---|---|---|
| 升高 | increased / was higher | rose, was elevated | went up, boosted（口语） |
| 降低 | decreased / was lower | declined, was reduced | dropped, cut down |
| 促进 | promoted / enhanced | stimulated, facilitated | improved（含糊） |
| 抑制 | inhibited / suppressed | reduced, restricted | prevented（过强） |
| 影响 | affected / altered / shifted | modulated | impacted（商务语） |
| 相关 | was correlated with / was associated with | covaried with | was related to（含糊） |
| 解释 | indicate / suggest | imply, point to | prove, confirm |
| 归因 | may be attributed to / is likely due to | could result from | is caused by（除非有因果设计） |
| 组成 | consisted of / comprised | was composed of | was made up of |

中文对应：升高＝提高/增加；降低＝降低/减少；促进＝促进/提升；抑制＝抑制/降低；影响＝影响/改变；相关＝与…显著相关；解释＝表明/说明；归因＝可能是由于/其原因在于。

## 5. 段落推进模板

**Introduction（4 段式，语料常见）**
1. 产业/生态重要性（1–2 句，带数据或引用）→ 2. 已知机制与做法（3–5 句，带引用）→ 3. 具体空白（1–2 句，However/Few studies）→ 4. 本研究目的与假设（1–2 句，Here we / 本研究旨在）。

**Discussion（3 层）**
1. 主结果复述（不重复数字，只说方向与幅度）→ 2. 与文献比较 + 机制解释（每段一个机制，带证据）→ 3. 边界与局限（一句事实，不自我辩护）。

**Conclusion**
只写三件事：做了什么、得到什么方向性结论、对谁有什么用。不写"未来展望"长句，不写"具有重要意义"。

## 6. Chinglish / 空心表达对照

| 不要写 | 改写 |
|---|---|
| 通过……的方式 | 通过……／用…… |
| 对……进行了测定 | 测定了…… |
| 进行了……的研究 | 研究了…… |
| 起到了……的作用 | 促进／抑制／缓冲…… |
| 是……的重要因素 | 主要影响……／在……条件下决定…… |
| 具有……的特点 | ……（直接给特征值） |
| 随着……的不断发展 | 自 20XX 年以来，X 由 A 增至 B |
| carry out the measurement of | measure |
| make an analysis of | analyze |
| has the ability to | can |
| in the aspect of | in |
| the reason is because | because |
| more and more | increasing |
| pay attention to | focus on / account for |

## 7. 禁用与限用

绝对禁用（语料 0 次）：delve, shed light on, pave the way for, valuable insights, growing body of literature, it is worth noting that, in today's world, in the realm of, navigate the landscape, tapestry, unlock the potential, game-changer, paradigm shift, prove that, obviously/clearly/undoubtedly, this section will discuss；值得注意的是, 在当今社会, 赋能, 助力, 多维度, 全方位, 深度融合, 具有重要的理论意义和实践价值, 提供了新的思路, 奠定了基础, 极大地, 起到了……的作用。

限用（有上限）：crucial role ≤1、plays an important role ≤1、not only…but also ≤1、furthermore ≤2、moreover ≤4、in conclusion ≤1、robust ≤2、综上所述 ≤1、重要作用 ≤2。

完整替换表见 `banned.md`。

## 8. 交付前自检 12 条

1. 每个数字都有单位、对照基准、图表号（若适用）。
2. 每个 `significant/显著` 都有检验与水平。
3. 没有一句话同时承担"数据 + 机制 + 意义"。
4. 段首没有连续两次同一个转折词。
5. 没有"本文/本研究 + 进行了/探讨了"的空心句。
6. 没有评价性形容词（important, comprehensive, novel, robust）无证据支撑。
7. 英文句长 p90 ≤ 40 词；中文句长 p90 ≤ 105 字。
8. 相关关系没有被写成因果关系。
9. 局限用事实陈述，没有防御性辩解。
10. 中英文各自成句，没有逐字对译痕迹。
11. 图表引用编号与正文一致。
12. lint 的 HIGH 已清零，MEDIUM 已逐条确认。
