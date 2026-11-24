# 句式骨架库（来自语料，可直接套用）

> 用法：先定位功能（背景/空白/目的/方法/结果/解释/比较/局限/结论），取骨架，把 `{}` 换成自己的事实。
> 每个骨架后面给出语料里的真实例句，用来校准"密度感"——句子里有几个信息块、有没有多余修饰。
> 更细的检索：`node scripts/corpus_search.mjs "关键词" --fn result --lang en`

---

## 1. 背景 background

**EN**
1. `{Object} has been shown to {effect} in {system} (Author, Year).`
2. `{Practice} is widely recognized as a {role} for {purpose} (Author, Year).`
3. `{Indicator} is a key determinant of {process} in {system}.`
4. `{Factor A} and {Factor B} jointly govern {outcome}, but their interaction is rarely quantified.`

> As an active component of biopesticides, Trichoderma has been widely applied in controlling crop diseases (Guzmán et al., 2023; Widmer, 2014).
> Enhancing soil organic matter (SOM) is widely recognized as a fundamental strategy for improving sandy soil structure (Park and Lee, 2025).
> It has been shown that this type of defense response (ISR) is correlated with PPO and POD activities in plants (Kashyap et al., 2022).

**ZH**
1. `{对象}是{系统}中{过程}的关键环节，直接影响{结果}。`
2. `{措施}因{优点}在生产中被广泛采用。`
3. `一般认为，{物质}是{过程}的重要{角色}[引用]。`
4. `{A}与{B}共同决定{结果}，但二者的交互作用少见定量报道。`

> ‘龙丰’苹果作为寒地苹果的主要品种，具有抗寒、高产、优质、耐贮藏等优良特性，在寒地被广泛种植。
> 一般认为，磷素是自养微生物固定CO2的重要营养元素[4, 46]。

---

## 2. 空白 gap

**EN**
1. `However, how {A} responds to {B} remains unclear.`
2. `Few studies have quantified {X} under {condition}.`
3. `Whether {pattern} also holds for {system} has not been tested.`
4. `{Practice} is still largely based on {experience/heuristic}, with little {quantitative evidence}.`
5. `There is a growing gap between {expansion} and {regulation}.`

> Nonetheless, the quantity and timing of irrigation and fertilization for jujubes are still mostly based on the long-term planting experience of local farmers in various regions.
> However, there is a growing disparity between the rapid expansion of water-saving irrigation areas and technological improvements, and the slower progress in implementing regulatory measures.
> However, there are important groups of biotic agents harmful to these crops that have not yet been attempted to control using Trichoderma.

**ZH**
1. `然而，{条件}下{A}与{B}的关系尚不清楚。`
2. `目前，相关研究多集中于{场景一}，针对{场景二}的系统研究相对缺乏。`
3. `{问题}日益凸显，但{机制}尚缺乏定量证据。`
4. `{做法}多依赖{经验}，缺少{参数/阈值}支撑。`

> 目前，相关研究多集中于农业场景中农药施用类型或浓度对土壤微生物的影响[5-6]，而针对城市绿地开展的系统性研究却相对缺乏。
> 然而，随着沙氏鹿茸草集约化栽培工作的推进，其土传病害问题日益凸显。

---

## 3. 目的 objective

**EN**
1. `Here, we examined how {A} affects {B} across {levels}.`
2. `This study aimed to quantify {X} and to identify the factors governing {Y}.`
3. `We hypothesized that {A} would {direction} {B} because {reason}.`
4. `To test this, {materials} were {treated} in {design}.`
5. `We sought to elucidate how {A} affected {B} and to reveal {mechanism} (Fig. 1).`

> Thus, we sought to elucidate how the soil C/N ratio affected the biocontrol strains and pathogenic strains, and reveal the mechanism of regulating soil C/N ratio and applying biocontrol agents on plants and soil microorganisms (Figure 1).
> In this study, 4% (w/w) biochar, Phytophthora capsici strain, and our previously screened biocontrol strain Trichoderma brevicompactum 6311 were used in pot experiments and evaluated.

**ZH**
1. `本研究旨在明确{对象}对{指标}的影响，并识别{驱动因子}。`
2. `为解析{机制}，本研究设置{处理}，测定{指标}。`
3. `研究旨在从{角度}揭示{机制}。`
4. `本研究假设：{处理}通过{途径}改善{指标}。`

> 研究旨在从土壤酶功能角度揭示光肥耦合的土壤微生物学机制。
> 为进一步解析不同有机物料调控下具体响应的自养固碳细菌类群，本研究基于LEfSe分析，揭示了秸秆与生物炭处理下自养群落的差异。

---

## 4. 方法 method

**EN**
1. `{Variable} was measured using {method} ({instrument}, {manufacturer}, {country}) and expressed as {unit}.`
2. `Samples were collected from {site} ({coordinates}) in {month year}.`
3. `{Material} was extracted using {kit} following the manufacturer's instructions.`
4. `All statistical analyses were performed in {software} ({version}); differences among treatments were tested by {test} at P < 0.05.`
5. `{A} was determined by {method A}, and {B} by {method B}.`

> The TSS content was measured in the apple juice using a digital refractometer (Biaokang, BK506, Shanghai, China) and expressed as percent.
> Genomic DNA was extracted using the commercial Ron's Tissue DNA Mini Kit (BIORON GmbH, Germany) following the manufacturer's instructions.
> OM content was measured using dichromate digestion, TN using the Kjeldahl method, TP and TK using the acid fusion method.

**ZH**
1. `{指标}采用{方法}测定，以{单位}表示。`
2. `每个处理{3}次重复，{时间}取样。`
3. `数据采用{软件}处理，{检验方法}用于多重比较（P < 0.05）。`
4. `{指标 A}用{方法 A}测定，{指标 B}用{方法 B}测定。`

> 有机质（SOM）含量采用重铬酸钾外加热法测定，以1 kg土壤中有机质的质量（g）表示。
> 在满足假设条件的基础上，对同一土层内不同降水处理进行多重比较，同时采用独立样本t检验分析同一处理下两个土层间的差异。

---

## 5. 结果 result

**EN**
1. `{Treatment} increased {variable} by {n}% relative to {control} (P < 0.05; Fig. n).`
2. `{Variable} was highest under {T1} and lowest under {T2}, ranging from {a} to {b} {unit}.`
3. `No significant difference in {variable} was detected between {A} and {B} (P > 0.05).`
4. `Although {A} increased {X}, it did not result in {Y}.`
5. `{Variable} increased with {factor} (R² = {r}, P < 0.01; Fig. n).`

> Over two years, leaf area increased by 31.4% and 19.5% under OFSI and OFI, respectively, compared with TF (Fig. 5).
> Although the higher nitrogen treatment increased total nutrient accumulation during some growth stages, it did not result in higher yield or resource-use efficiency.

**ZH**
1. `{处理}下{指标}较{CK}提高{n}%（P < 0.05；图 n）。`
2. `{指标}以{T1}处理最高，{T2}处理最低，变幅为{a}~{b}{单位}。`
3. `{A}与{B}间{指标}差异不显著（P > 0.05）。`
4. `{指标}随{因子}增加而{升高/降低}（R² = {r}，P < 0.01；图 n）。`

> T4处理土壤细菌群落受土壤全钾含量影响显著（图4A）。
> 土壤速效钾、总球囊霉素含量提高20.27%、5.49%，丛枝侵染率较未接种处理也提高了377.63%。

---

## 6. 解释 interpretation

**EN**
1. `This pattern may be attributed to {mechanism}.`
2. `The increase in {A} is consistent with {finding}, indicating that {inference}.`
3. `One explanation is that {A} {effect}, thereby {consequence}.`
4. `{Process} is mediated by {molecule/pathway}, a process requiring {condition}.`
5. `This implies that {A} may be associated with {B}, although {alternative}.`

> Under similar irrigation levels, in the present study, the lowest yield was obtained under no-N application, indicating that N application rate was the major reason for the increase in fruit yield.
> This implies that higher potassium levels may be associated with reduced microbial activity.
> One of the key aspects of parasitism is the ability of Trichoderma hyphae to firmly adhere to the surface of nematode eggs, a process mediated by the recognition of specific molecules.

**ZH**
1. `{结果}可能是由于{机制}：{证据}。`
2. `这与{作者}的结论一致，说明{推断}。`
3. `其原因可能在于{机制}，即{过程}。`
4. `{处理}通过{途径}改变了{指标}，从而{后果}。`

> 本研究发现，毛管布设方式和施肥周期的交互作用对细根周转率的影响在两年均达到极显著水平……说明在一行一管条件下施肥周期对细根周转率的影响更明显。
> 这与前人在{系统}中的结果一致，说明{机制}在{条件}下同样成立。

---

## 7. 比较 comparison

**EN**
1. `In contrast to {A}, {B} {effect}.`
2. `Compared with {control}, {treatment} {effect} by {n}% (Fig. n).`
3. `This is in line with {Author}, who reported {finding} under {condition}.`
4. `Unlike {A}, which {effect}, {B} showed no response.`
5. `The two treatments differed in {variable} but not in {variable2}.`

> In contrast, the OF only resulted in a modest increase in total leaf area (Fig. 2B).
> Conversely, the pathogenesis-related gene STH-2-like was consistently more expressed in the presence of the biological treatments, in line with enhanced PR protein-based defenses.

**ZH**
1. `与{对照}相比，{处理}{效应}{n}%，而{另一处理}无显著变化。`
2. `这与{作者}在{条件}下的结果一致。`
3. `不同于{A}，{B}对{指标}无明显响应。`
4. `两种处理在{指标一}上差异显著，在{指标二}上无差异。`

> 与CK相比，{处理}{指标}提高{n}%，而{处理二}与CK差异不显著。
> 这与{作者}在{同类系统}中的报道一致。

---

## 8. 局限 limitation

**EN**
1. `This study covered {scope}, so {inference} cannot be extended to {other scope}.`
2. `The {measurement} integrates {A} and {B}; separating them requires {experiment}.`
3. `{Variable} was not measured here, so {alternative explanation} cannot be excluded.`
4. `Further work is needed to test whether {pattern} persists under {condition}.`

> Further studies conducted across broader geographic areas are needed to better understand the role of Trichoderma communities in Mediterranean cork oak ecosystems.
> Changes in community structure could potentially affect the distribution of opportunistic or resistance-associated taxa, although this requires further investigation.

**ZH**
1. `本研究仅覆盖{范围}，{结论}能否外推到{条件}仍需验证。`
2. `本研究未测定{指标}，{替代解释}尚不能排除。`
3. `{结果}在{更长年限/更多地点}下的稳定性有待进一步检验。`

> 本研究仅在一个试验点开展两年，{结论}在{多点/多年}条件下的稳定性仍需验证。
> 本研究未测定{指标}，{机制}是否成立尚不能排除其他解释。

---

## 9. 结论 conclusion

**EN**
1. `Collectively, these results indicate that {claim}, although {boundary}.`
2. `These findings demonstrate {effect} under {condition}, yet {limit}.`
3. `These results provide a basis for {specific application} in {specific system}.`
4. `{Treatment} improved {outcome} mainly through {mechanism}, as evidenced by {evidence}.`

> These results demonstrate organic fertilization's capacity to enhance resource-use efficiency while maintaining high productivity in arid sandy apple orchard systems.
> Collectively, these results demonstrate that under calcareous soil conditions, PSE180 functions as an efficient Fe-mobilizing bacterium, significantly increasing soil available Fe content, yet its capacity to promote plant Fe accumulation remains relatively limited.

**ZH**
1. `综上，{处理}通过{机制}改善了{指标}，可为{对象}的{决策}提供{参数/依据}。`
2. `{处理}提高了{指标}，但其对{指标二}的作用有限。`
3. `结果表明，{结论}，且该效应与{机制}密切相关。`

> 【结论】40%遮荫与施氮耦合显著促进了香樟幼苗生长，其效应与土壤氮有效性提高、氮循环相关酶（NAG、LAP）活性增强及土壤适度酸化密切关联。
> 综上，{处理}通过改善{指标}提高了{产出}，可为{区域}{作物}的水肥管理提供参数依据。

---

## 10. 段落开头禁则

| 不要这样开头 | 改成 |
|---|---|
| It is worth noting that… | 直接写事实 |
| In recent years, with the rapid development of… | 具体年份 + 具体变化 |
| As we all know… | 删除 |
| 随着……的不断发展 | 自 20XX 年以来，X 由 A 增至 B |
| 众所周知 | 删除，或给引用 |
| 本文将对……进行探讨 | 删除，直接进入内容 |
