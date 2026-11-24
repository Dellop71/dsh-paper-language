#!/usr/bin/env node
/**
 * 幂等安装/修复脚本：把 dsh-paper-language 接进指定 DSH profile。
 *
 *   node scripts/install.mjs                 # 默认接进 desktop profile
 *   node scripts/install.mjs --profile web   # 接进别的 profile
 *   node scripts/install.mjs --check         # 只体检，不写任何文件
 *
 * 做四件事（都已存在则跳过）：
 *   1. node_modules/<pkg> 目录联接（Windows junction，不需要管理员权限）
 *   2. profile/package.json 依赖一行（link: 指向本插件目录）
 *   3. profile/pnpm-lock.yaml importers 对应一行（保证 --frozen-lockfile 不报错）
 *   4. profile/cordis.patch.yml 追加一条 insert 行
 *
 * 只改 profile 的配置，不碰 DSH 安装目录、不改版本号。
 */
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, lstatSync, symlinkSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const PLUGIN_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG_NAME = 'dsh-paper-language';
const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh');

const argv = process.argv.slice(2);
const checkOnly = argv.includes('--check');
const profileIdx = argv.indexOf('--profile');
const profileName = profileIdx >= 0 ? argv[profileIdx + 1] : 'desktop';
const PROFILE_DIR = join(DSH_HOME, 'profiles', profileName);

const results = [];
const ok = (msg) => results.push(`  ✔ ${msg}`);
const changed = (msg) => results.push(`  ✎ ${msg}`);
const skipped = (msg) => results.push(`  · ${msg}`);
const failed = (msg) => results.push(`  ✘ ${msg}`);

function backup(file) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dst = `${file}.bak-paperlang-${stamp}`;
  copyFileSync(file, dst);
  return dst;
}

function main() {
  if (!existsSync(PROFILE_DIR)) {
    console.error(`找不到 profile 目录：${PROFILE_DIR}`);
    process.exit(2);
  }

  // 1) 目录联接
  const linkPath = join(PROFILE_DIR, 'node_modules', PKG_NAME);
  let linkState = 'missing';
  try {
    const st = lstatSync(linkPath);
    linkState = st.isSymbolicLink() || st.isDirectory() ? 'present' : 'other';
  } catch {
    linkState = 'missing';
  }
  if (linkState === 'present') {
    ok(`node_modules/${PKG_NAME} 已就位`);
  } else if (checkOnly) {
    failed(`node_modules/${PKG_NAME} 缺失（去掉 --check 运行安装）`);
  } else {
    mkdirSync(join(PROFILE_DIR, 'node_modules'), { recursive: true });
    // junction 类型：Windows 上不需要管理员权限，也不需要开发者模式
    symlinkSync(PLUGIN_DIR, linkPath, 'junction');
    changed(`已建立 node_modules/${PKG_NAME} → ${PLUGIN_DIR}`);
  }

  // 2) package.json 依赖
  const pkgPath = join(PROFILE_DIR, 'package.json');
  const pkgRaw = readFileSync(pkgPath, 'utf8');
  const spec = `link:${PLUGIN_DIR.replace(/\\/g, '/')}`;
  if (pkgRaw.includes(`"${PKG_NAME}"`)) {
    ok('package.json 已有依赖条目');
  } else if (checkOnly) {
    failed('package.json 缺依赖条目');
  } else {
    const b = backup(pkgPath);
    const anchor = /"dependencies"\s*:\s*\{\s*\n/;
    const m = pkgRaw.match(anchor);
    if (!m) {
      failed('package.json 里没有 dependencies 段，需手动添加');
    } else {
      const at = m.index + m[0].length;
      const next = `${pkgRaw.slice(0, at)}    "${PKG_NAME}": "${spec}",\n${pkgRaw.slice(at)}`;
      JSON.parse(next); // 写之前先验证
      writeFileSync(pkgPath, next, 'utf8');
      changed(`package.json 已加依赖（备份 ${b.split(/[\\/]/).pop()}）`);
    }
  }

  // 3) pnpm-lock.yaml importers
  const lockPath = join(PROFILE_DIR, 'pnpm-lock.yaml');
  if (existsSync(lockPath)) {
    const lockRaw = readFileSync(lockPath, 'utf8');
    if (lockRaw.includes(`\n      ${PKG_NAME}:\n`)) {
      ok('pnpm-lock.yaml 已有 importer 条目');
    } else if (checkOnly) {
      failed('pnpm-lock.yaml 缺 importer 条目（--frozen-lockfile 会报错）');
    } else {
      const b = backup(lockPath);
      const anchor = /(\n {6}[a-z@][^\n]*:\n {8}specifier:[^\n]*\n {8}version:[^\n]*\n)/;
      const m = lockRaw.match(anchor);
      if (!m) {
        failed('pnpm-lock.yaml 结构不符合预期，跳过（需手动添加）');
      } else {
        const block = `      ${PKG_NAME}:\n        specifier: ${spec}\n        version: link:../../plugins/${PKG_NAME}\n`;
        const at = m.index + m[1].length;
        writeFileSync(lockPath, `${lockRaw.slice(0, at)}${block}${lockRaw.slice(at)}`, 'utf8');
        changed(`pnpm-lock.yaml 已加 importer 条目（备份 ${b.split(/[\\/]/).pop()}）`);
      }
    }
  } else {
    skipped('没有 pnpm-lock.yaml，跳过');
  }

  // 4) cordis.patch.yml
  const patchPath = join(PROFILE_DIR, 'cordis.patch.yml');
  const patchRaw = existsSync(patchPath) ? readFileSync(patchPath, 'utf8') : '';
  if (patchRaw.includes('id: paper-language')) {
    ok('cordis.patch.yml 已有 insert 行');
  } else if (checkOnly) {
    failed('cordis.patch.yml 缺 insert 行');
  } else {
    const b = existsSync(patchPath) ? backup(patchPath) : '(新建)';
    const block = [
      '',
      '# ---- dsh-paper-language：论文语言契约 ----',
      '- insert:',
      '    - id: paper-language',
      `      name: ${PKG_NAME}`,
      '      config:',
      '        mode: strict',
      '        lang: auto',
      '        order: 5000',
      "        extraRules: ''",
      '',
    ].join('\n');
    writeFileSync(patchPath, `${patchRaw}${patchRaw.endsWith('\n') || patchRaw === '' ? '' : '\n'}${block}`, 'utf8');
    changed(`cordis.patch.yml 已追加 insert（备份 ${b.split(/[\\/]/).pop()}）`);
  }

  console.log(`profile: ${PROFILE_DIR}`);
  console.log(results.join('\n'));
  const bad = results.filter((r) => r.includes('✘')).length;
  console.log(bad === 0 ? '\n体检通过。重启 DSH 后 / 菜单里会出现 /paper-lang 等四个命令。' : `\n有 ${bad} 项需要处理。`);
  process.exit(bad === 0 ? 0 : 1);
}

// 顶层 await 不便在同步 main 里用，这里统一在文件头 import。
main();
