# dsh-paper-language · 论文语言契约

把你自己语料里的表达方式，变成 DSH 写论文时的**硬约束**。

- **常驻注入**：插件向 `ctx.systemPrompt` 注册一个 section，每一轮、每个 agent 都带着这份契约。
- **语料检索**：`/paper-corpus` 直接查你 40 篇 SCI + 59 篇中文（7672 句）里的真实例句。
- **确定性 lint**：`/paper-lint` 按语料基线查句长、禁用表达、判断词强度、"显著"有没有检验。
- **零依赖、零改版**：不 import 任何 `@deepseek-ai/*` 包，服务缺失时静默降级；不碰 DSH 版本与安装目录。

## 安装（已由安装脚本完成）

```
~/.dsh/plugins/dsh-paper-language/          # 插件本体
~/.dsh/skills/paper-language/               # 配套 skill（长文playbook）
profiles/desktop/package.json               # 依赖一行：dsh-paper-language: link:...
profiles/desktop/pnpm-lock.yaml             # importers 里对应一行
profiles/desktop/node_modules/dsh-paper-language  # 目录联接（junction）
profiles/desktop/cordis.patch.yml           # 一条 insert 行，id: paper-language
```

改完配置**重启 DSH**（或重新加载插件树）生效。`/` 菜单里会出现四个命令。

## 四个命令

| 命令 | 作用 |
|---|---|
| `/paper-lang` | 状态；`on`/`off`/`strict`/`lenient` 切档；`lang en\|zh\|auto` 设默认检查语言 |
| `/paper-rules [关键词]` | 打印规则全文；`banned`、`frames`、`gap`、`局限` 等可只看一节 |
| `/paper-lint <文本 \| @文件>` | 检查一段文本或文件；`--all` 看全部，`--fix` 输出安全字面替换 |
| `/paper-corpus <关键词>` | 检索真实例句；`--en`/`--zh`，`--fn result` 等按功能过滤 |

命令行等价物（模型自己也会用，便于强制）：

```bash
node scripts/lint.mjs --file draft.md --lang auto        # 退出码 1 = 还有 HIGH
node scripts/corpus_search.mjs "increased yield" --fn result --en
```

## 语料基线（规则不是拍脑袋）

| 指标 | 英文 | 中文 |
|---|---|---|
| 句长中位数 / p90 | 24 / 38 词 | 59 / 100 字 |
| 高频判断词 | indicate, suggest, demonstrate | 表明(425), 说明(109), 结果表明(98) |
| 高频转折 | In contrast, However, Compared with | 然而, 此外, 因此, 与…相比 |

`delve / shed light on / pave the way / valuable insights / it is worth noting` 在语料里 **0 次**；
`值得注意的是 / 赋能 / 多维度 / 具有重要的理论意义和实践价值 / 奠定了基础` 同样是 **0 次**。

## 重建语料（新增 PDF 后）

```bash
python scripts/build_corpus.py --sci "<英文论文 PDF 目录>" --zh "<中文论文 PDF 目录>"
```

脚本只依赖 pymupdf（DSH 运行时自带，路径 `$DSH_HOME/dsh-runtimes/dsh-primary-runtime/dependencies/python/python.exe`），
会重写 `corpus/phrases.{en,zh}.jsonl` 与 `stats.json`。只重建一侧时另一个参数留空，不会覆盖已有文件。

> 仓库里不带语料：`corpus/*.jsonl` 是从第三方论文 PDF 抽出的原文句子，公开发布有版权问题。
> 拉下来后用自己的 PDF 跑一次上面的命令即可生成。

## 配置

`cordis.patch.yml`（或 `profiles/desktop/cordis.patch.yml` 里那一行）：

```yaml
mode: strict        # strict | lenient | off
lang: auto          # auto | en | zh
order: 5000         # 系统提示插入位置
extraRules: ''      # 追加课题专属要求
```

运行时 `/paper-lang` 的开关写在 `$DSH_HOME/paper-language.json`，优先级高于上面的 `mode/lang`。

## 卸载

```bash
rm -rf ~/.dsh/profiles/desktop/node_modules/dsh-paper-language
```
再从 `profiles/desktop/package.json` 依赖、`pnpm-lock.yaml` importers、`cordis.patch.yml` 的 insert 行里删掉对应三处即可。
插件目录与 skill 目录可保留（不加载就不生效）。

## 兼容性

- 只用 `ctx.inject` + `ctx.systemPrompt.section` + `ctx.commands.register` 三个长期稳定接口；
- 任一接口缺失 → 该能力跳过，其余照常，不抛异常、不阻断启动；
- 不修改 DSH 本体、不 pin 版本、不依赖 peer 版本号。
