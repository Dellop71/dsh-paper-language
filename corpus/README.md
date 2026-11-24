# 语料目录（不入库）

`phrases.en.jsonl` / `phrases.zh.jsonl` / `stats.json` 是从论文 PDF 抽出的**原文句子**，
涉及第三方版权，所以不放进仓库。用自己的 PDF 生成：

```bash
python ../scripts/build_corpus.py --sci "<英文论文 PDF 目录>" --zh "<中文论文 PDF 目录>"
```

生成后每行一条：

```json
{"id":"en-00001","lang":"en","fn":"result","section":"results","src":"paper.pdf","text":"Leaf area increased by 31.4% ..."}
```

`fn` 是语篇功能标签（background / gap / objective / method / result / interpretation /
comparison / limitation / conclusion），`section` 是猜出来的 IMRaD 段，`src` 是来源文件名。

没有语料时插件照常工作：常驻规则与 `/paper-lint` 不依赖语料，只有 `/paper-corpus` 会返回空。
