#!/usr/bin/env node
/**
 * scripts/bump-version.js
 * 用法：
 *   npm run release -- 0.1.1
 * 或 node scripts/bump-version.js 0.1.1
 *
 * 自动完成：
 *   1. 修改 package.json          version
 *   2. 修改 src-tauri/Cargo.toml  version
 *   3. 修改 src-tauri/tauri.conf.json version
 *   4. git add + commit
 *   5. git tag v{version}
 *   6. git push origin HEAD --tags  ← 触发 GitHub Actions 全自动构建
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rawVersion = process.argv[2];
if (!rawVersion || !/^v?\d+\.\d+\.\d+(-[\w.]+)?$/.test(rawVersion)) {
  console.error('');
  console.error('❌ 用法错误：需要一个合法的 semver 版本号');
  console.error('   示例：npm run release -- 0.1.1');
  console.error('         node scripts/bump-version.js 0.1.1');
  console.error('');
  process.exit(1);
}

const version = rawVersion.replace(/^v/, '');
const tag = `v${version}`;

console.log(`\n🚀 准备发版：${tag}\n`);

const rootDir = process.cwd();
const pkgPath = path.join(rootDir, 'package.json');
const cargoPath = path.join(rootDir, 'src-tauri/Cargo.toml');
const tauriConfPath = path.join(rootDir, 'src-tauri/tauri.conf.json');

// ---------- 1. package.json（只替换顶层 version 字段，保持其他格式不变） ----------
{
  const content = fs.readFileSync(pkgPath, 'utf-8');
  const newContent = content.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  fs.writeFileSync(pkgPath, newContent);
  console.log(`✅ package.json              → ${version}`);
}

// ---------- 2. src-tauri/Cargo.toml（只匹配行首的 version = "..."，不影响依赖段） ----------
{
  const content = fs.readFileSync(cargoPath, 'utf-8');
  const newContent = content.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
  fs.writeFileSync(cargoPath, newContent);
  console.log(`✅ src-tauri/Cargo.toml      → ${version}`);
}

// ---------- 3. src-tauri/tauri.conf.json（只替换顶层 version 字段） ----------
{
  const content = fs.readFileSync(tauriConfPath, 'utf-8');
  const newContent = content.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  fs.writeFileSync(tauriConfPath, newContent);
  console.log(`✅ src-tauri/tauri.conf.json → ${version}`);
}

// ---------- 4. git commit ----------
console.log('\n📦 提交变更...');
execSync('git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json', { stdio: 'inherit' });
execSync(`git commit -m "chore(release): bump version to ${version}"`, { stdio: 'inherit' });

// ---------- 5. git tag ----------
console.log(`\n🏷️  打标签 ${tag}...`);
execSync(`git tag ${tag}`, { stdio: 'inherit' });

// ---------- 6. git push（触发 GitHub Actions） ----------
console.log(`\n🚀 推送到 origin（将自动触发 GitHub Actions 构建 & 发布）...`);
execSync('git push origin HEAD --tags', { stdio: 'inherit' });

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  ✅ 版本号已更新，Tag 已推送！                             ║');
console.log('║  GitHub Actions 正在构建多平台安装包...                     ║');
console.log('║  约 10~20 分钟后，所有平台构建完成 → 自动发布 Release      ║');
console.log('║  进度查看: https://github.com/你的用户名/modelvault/actions ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');