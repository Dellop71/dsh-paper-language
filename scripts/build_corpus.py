#!/usr/bin/env python
"""Build the paper-language phrase bank from the user's PDF corpus.

Usage (from anywhere):
    python scripts/build_corpus.py --sci "<英文PDF目录>" --zh "<中文PDF目录>"

Outputs (relative to the plugin root):
    corpus/phrases.en.jsonl
    corpus/phrases.zh.jsonl
    corpus/stats.json

Every record: {"id","lang","fn","section","src","text"}
`fn` is the rhetorical function (background/gap/objective/method/result/
interpretation/comparison/limitation/conclusion/other), `section` the guessed
IMRaD section, `src` the source PDF file name.

The script is deliberately dependency-light: pymupdf only.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from collections import Counter

try:
    import pymupdf as fitz  # type: ignore
except Exception:  # pragma: no cover - older runtimes
    import fitz  # type: ignore


# ---------------------------------------------------------------- text cleanup

PAGE_NO = re.compile(r"^\s*(?:page\s*)?\d{1,4}\s*$", re.I)
JOURNAL_NOISE = re.compile(
    r"^(?:scientific reports|plos one|frontiers in|applied soil ecology|"
    r"scientia horticulturae|journal of |international journal|microorganisms|"
    r"agronomy|horticulturae|plants|agri[a-z]*|european journal|"
    r"physiologia plantarum|trees|results in |industrial crops|"
    r"agricultural water|bioresource technology|doi|https?://)",
    re.I,
)
CAPTION = re.compile(r"^(?:fig(?:ure)?\.?|table|scheme)\s*\d", re.I)
REF_HEAD = re.compile(r"^\s*(?:references|reference|bibliography|literature cited|参考文献)\s*$", re.I)
SECTION_HEAD = re.compile(
    r"^\s*(?:\d+\.?\s*)?(?:abstract|introduction|materials and methods|methods|"
    r"results|results and discussion|discussion|conclusion|conclusions|"
    r"摘要|引言|前言|材料与方法|结果|讨论|结论)\s*$",
    re.I,
)


def clean_text(raw: str) -> str:
    """De-hyphenate line breaks and drop page furniture."""
    lines = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            lines.append("")
            continue
        if PAGE_NO.match(line) or JOURNAL_NOISE.match(line):
            continue
        lines.append(line)
    text = "\n".join(lines)
    # join words broken across a line: "sustain-\nable" -> "sustainable"
    text = re.sub(r"(\w)-\n(\w)", r"\1\2", text)
    # join remaining intra-paragraph line breaks
    text = re.sub(r"(?<=[a-z,;])\n(?=[a-z(])", " ", text)
    text = re.sub(r"(?<=[\u4e00-\u9fff])\n(?=[\u4e00-\u9fff])", "", text)
    return text


def body_only(text: str) -> str:
    """Cut the reference list and everything after it."""
    cut = len(text)
    for m in REF_HEAD.finditer(text):
        cut = min(cut, m.start())
    return text[:cut]


# ------------------------------------------------------------- sentence split

EN_ABBR = re.compile(
    r"\b(?:e\.g|i\.e|et al|vs|Fig|Figs|No|approx|sp|spp|cf|resp|i\.e|etc|"
    r"Dr|Prof|St|al)\.$",
    re.I,
)


def split_en(text: str):
    text = text.replace("\n", " ")
    text = re.sub(r"\s{2,}", " ", text)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z(\[])", text)
    out = []
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if EN_ABBR.search(p):
            continue
        out.append(p)
    return out


def split_zh(text: str):
    text = text.replace("\n", "")
    parts = re.split(r"(?<=[。！？；])", text)
    return [p.strip() for p in parts if p.strip()]


# ------------------------------------------------------------- classification

EN_FN = [
    ("gap", r"\b(?:however|nevertheless|nonetheless|but |remains? (?:unclear|unknown|poorly|elusive)|"
            r"little is known|few studies|has not been (?:elucidated|clarified|reported)|"
            r"is still (?:lacking|limited|unclear)|limited (?:information|evidence|knowledge)|"
            r"have not been (?:fully|well) (?:understood|characterized)|knowledge gap|"
            r"it is (?:still )?unclear)\b"),
    ("objective", r"\b(?:the (?:aim|objective|purpose|goal) of (?:this|the present|our)|"
                  r"here,? we|in this study|we (?:aimed|sought|hypothesi[sz]ed|investigated|examined|"
                  r"evaluated|assessed|compared|tested|explored)|this study (?:aimed|was designed|"
                  r"was conducted|investigated|evaluated))\b"),
    ("limitation", r"\b(?:limitation|further (?:studies|research|work|investigation)|"
                   r"should be (?:interpreted|considered|treated) with caution|warrant(?:s)? "
                   r"(?:further|additional)|remains? to be (?:determined|tested)|"
                   r"cannot (?:be )?(?:excluded|ruled out)|caution is (?:needed|warranted))\b"),
    ("conclusion", r"\b(?:in conclusion|taken together|collectively|these (?:results|findings|data)|"
                   r"our (?:results|findings|data)|overall,|in summary|"
                   r"provide(?:s|d)? (?:a |an |new |novel |theoretical |practical )?(?:basis|reference|"
                   r"insight|framework|evidence|support))\b"),
    ("comparison", r"\b(?:in contrast|by contrast|whereas|compared (?:with|to)|similar to|unlike|"
                   r"consistent with|in line with|in agreement with|differed? (?:from|between))\b"),
    ("interpretation", r"\b(?:suggest(?:s|ed|ing)?|indicat(?:e|es|ed|ing)|impl(?:y|ies|ied)|"
                       r"may (?:be )?(?:attributed|due|related|reflect|result|arise)|"
                       r"is likely|we (?:speculate|propose|hypothesi[sz]e)|possibly because|"
                       r"could be explained|attributable to|driven by|mediated by)\b"),
    ("result", r"\b(?:significant(?:ly)?|increased|decreased|enhanced|improved|reduced|promoted|"
               r"inhibited|higher than|lower than|greater than|was (?:observed|found|detected)|"
               r"no significant|positively correlated|negatively correlated)\b"),
    ("method", r"\b(?:were (?:measured|determined|analy[sz]ed|collected|grown|performed|estimated|"
               r"calculated|recorded|extracted|sequenced|inoculated)|was (?:conducted|used|applied|"
               r"performed|carried out|prepared|added)|using (?:a|an|the)|samples were|"
               r"experiments were|triplicates|three replicates|according to)\b"),
    ("background", r"\b(?:is (?:widely|well) (?:known|recognized|documented|reported)|"
                   r"has been (?:reported|shown|demonstrated|documented|widely)|"
                   r"plays? (?:a|an) (?:important|key|crucial|critical|vital|central) role|"
                   r"is (?:one of|among) the most|is considered|are (?:known|regarded) as|"
                   r"constitutes?|represents?)\b"),
]

ZH_FN = [
    ("gap", r"(?:然而|但是|但|目前|尚不|尚缺乏|缺乏|少见|鲜有|亟需|亟须|仍不清楚|仍不明确|"
            r"未见报道|研究较少|有待深入|存在争议)"),
    ("objective", r"(?:本研究|本文|该研究|旨在|目的是|以期为|拟通过|试图|探讨|明确)"),
    ("limitation", r"(?:不足|局限性|有待进一步|尚需|仍需|未能|无法排除|需谨慎)"),
    ("conclusion", r"(?:综上所述|综上|因此|由此可见|表明|说明|可为|提供了.*(?:依据|参考|基础|理论)|"
                   r"具有.*(?:意义|价值|潜力))"),
    ("comparison", r"(?:与.*相比|高于|低于|大于|小于|显著高于|显著低于|而|反之|差异不显著)"),
    ("interpretation", r"(?:可能|推测|原因|机制|归因|由于|这与|其原因|可能是由于|说明)"),
    ("result", r"(?:结果表明|结果显示|显著|增加|降低|提高|促进|抑制|差异显著|相关性)"),
    ("method", r"(?:采用|通过|设置|测定|培养|采集|处理|分析|接种|选取|按照|分别)"),
    ("background", r"(?:是.*的重要|已被|已经|广泛|研究表明|被认为是|具有重要|起着重要作用|"
                   r"是.*的主要|已成为)"),
]

EN_SECTION = [
    ("abstract", r"\b(?:abstract|summary)\b"),
    ("introduction", r"\b(?:introduction)\b"),
    ("methods", r"\b(?:materials and methods|methods|experimental design)\b"),
    ("results", r"\b(?:results|results and discussion)\b"),
    ("discussion", r"\b(?:discussion)\b"),
    ("conclusion", r"\b(?:conclusions?)\b"),
]


def classify(text: str, table):
    for fn, pat in table:
        if re.search(pat, text, re.I):
            return fn
    return "other"


def guess_sections(text: str):
    """Return a parallel list of section labels for each character offset."""
    marks = []
    for m in SECTION_HEAD.finditer(text):
        marks.append((m.start(), m.group(0).strip().lower()))
    marks.sort()

    def label_at(pos):
        cur = "body"
        for off, name in marks:
            if off <= pos:
                cur = name
            else:
                break
        return cur

    return label_at


def keep_en(s: str) -> bool:
    if not (70 <= len(s) <= 330):
        return False
    if CAPTION.match(s):
        return False
    if s.count("(") > 4 or s.count("=") > 1:
        return False
    digits = sum(c.isdigit() for c in s)
    if digits / max(len(s), 1) > 0.12:
        return False
    letters = sum(c.isalpha() for c in s)
    if letters / max(len(s), 1) < 0.6:
        return False
    if re.search(r"\b(?:et al\.|doi|http|www\.|Fig\.|Table)\b", s):
        return False
    if s.count(",") > 8:
        return False
    return True


def keep_zh(s: str) -> bool:
    if not (22 <= len(s) <= 130):
        return False
    if re.match(r"^(?:图|表)\s*\d", s):
        return False
    han = sum("\u4e00" <= c <= "\u9fff" for c in s)
    if han / max(len(s), 1) < 0.55:
        return False
    if s.count("（") > 3 or s.count("=") > 1:
        return False
    return True


def iter_pdfs(root: str):
    for dirpath, _dirnames, filenames in os.walk(root):
        for name in sorted(filenames):
            if name.lower().endswith(".pdf"):
                yield os.path.join(dirpath, name)


def extract(path: str) -> str:
    doc = fitz.open(path)
    try:
        chunks = []
        for page in doc:
            chunks.append(page.get_text("text"))
        return "\n".join(chunks)
    finally:
        doc.close()


def main() -> int:
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ap = argparse.ArgumentParser()
    ap.add_argument("--sci", default="", help="英文论文 PDF 目录（可多次运行只重建一种语言）")
    ap.add_argument("--zh", default="", help="中文论文 PDF 目录")
    ap.add_argument("--out", default=os.path.join(here, "corpus"))
    args = ap.parse_args()

    if not args.sci and not args.zh:
        print(
            "用法：build_corpus.py --sci <英文PDF目录> --zh <中文PDF目录>\n"
            "      只重建一种语言时，另一个留空即可（留空的一侧不会覆盖已有 jsonl）。",
            file=sys.stderr,
        )
        return 2

    os.makedirs(args.out, exist_ok=True)
    stats = {"en": Counter(), "zh": Counter(), "files": {"en": 0, "zh": 0}, "failed": []}

    for lang, root, splitter, keeper, table, fnfile in (
        ("en", args.sci, split_en, keep_en, EN_FN, "phrases.en.jsonl"),
        ("zh", args.zh, split_zh, keep_zh, ZH_FN, "phrases.zh.jsonl"),
    ):
        records = []
        seen = set()
        if not root:
            continue
        if not os.path.isdir(root):
            stats["failed"].append(f"{lang}: 目录不存在 {root}")
            continue
        for path in iter_pdfs(root):
            base = os.path.basename(path)
            try:
                raw = extract(path)
            except Exception as exc:  # noqa: BLE001
                stats["failed"].append(f"{base}: {exc}")
                continue
            if len(raw.strip()) < 400:
                continue
            stats["files"][lang] += 1
            text = body_only(clean_text(raw))
            label_at = guess_sections(text)
            # walk with offsets so the section label stays correct
            cursor = 0
            for sent in splitter(text):
                pos = text.find(sent, cursor)
                if pos < 0:
                    pos = cursor
                cursor = pos + len(sent)
                if not keeper(sent):
                    continue
                key = sent.lower()[:120]
                if key in seen:
                    continue
                seen.add(key)
                fn = classify(sent, table)
                if fn == "other":
                    continue
                records.append({
                    "id": f"{lang}-{len(records):05d}",
                    "lang": lang,
                    "fn": fn,
                    "section": label_at(pos),
                    "src": base,
                    "text": sent,
                })
        with open(os.path.join(args.out, fnfile), "w", encoding="utf-8") as fh:
            for rec in records:
                fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
        stats[lang].update(rec["fn"] for rec in records)
        stats[lang]["__total__"] = len(records)

    with open(os.path.join(args.out, "stats.json"), "w", encoding="utf-8") as fh:
        json.dump(
            {
                "files": stats["files"],
                "en": dict(stats["en"]),
                "zh": dict(stats["zh"]),
                "failed": stats["failed"],
            },
            fh,
            ensure_ascii=False,
            indent=2,
        )
    print(json.dumps({"files": stats["files"], "en": dict(stats["en"]), "zh": dict(stats["zh"]),
                      "failed": len(stats["failed"])}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
