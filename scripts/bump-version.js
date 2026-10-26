#!/usr/bin/env node
/**
 * scripts/bump-version.js（幂等容错版）
 * 用法：
 *   npm run release -- 0.1.2
 *
 * 自动完成：
 *   1. 修改 package.json / Cargo.toml / tauri.conf.json 版本号
 *   2. 有变更才 git commit（无变更跳过，避免 "nothing to commit"）
 *   3. 删除同名本地 tag 后重建
 *   4. 清理远程冲突 tag
 *   5. git push origin HEAD --tags 触发 GitHub Actions
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const rawVersion = process.argv[2];
if (!rawVersion || !/^v?\d+\.\d+\.\d+(-[\w.]+)?$/.test(rawVersion)) {
  console.error('');
  console.error('❌ 用法错误：需要一个合法的 semver 版本号');
  console.error('   示例：npm run release -- 0.1.2');
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

// ---------- 1. package.json ----------
{
  const content = fs.readFileSync(pkgPath, 'utf-8');
  const newContent = content.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  if (content === newContent) {
    console.log(`ℹ️  package.json             已经是 ${version}`);
  } else {
    fs.writeFileSync(pkgPath, newContent);
    console.log(`✅ package.json              → ${version}`);
  }
}

// ---------- 2. Cargo.toml ----------
{
  const content = fs.readFileSync(cargoPath, 'utf-8');
  const newContent = content.replace(/^version\s*=\s*"[^"]*"/m, `version = "${version}"`);
  if (content === newContent) {
    console.log(`ℹ️  src-tauri/Cargo.toml     已经是 ${version}`);
  } else {
    fs.writeFileSync(cargoPath, newContent);
    console.log(`✅ src-tauri/Cargo.toml      → ${version}`);
  }
}

// ---------- 3. tauri.conf.json ----------
{
  const content = fs.readFileSync(tauriConfPath, 'utf-8');
  const newContent = content.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${version}"`);
  if (content === newContent) {
    console.log(`ℹ️  src-tauri/tauri.conf.json 已经是 ${version}`);
  } else {
    fs.writeFileSync(tauriConfPath, newContent);
    console.log(`✅ src-tauri/tauri.conf.json → ${version}`);
  }
}

// ---------- 4. 检查是否有实际变更 ----------
const status = execSync('git status --porcelain package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json', { encoding: 'utf-8' }).trim();

if (status) {
  console.log('\n📦 提交变更...');
  execSync('git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json', { stdio: 'inherit' });
  try {
    execSync(`git commit -m "chore(release): bump version to ${version}"`, { stdio: 'inherit' });
  } catch (e) {
    // 极端情况下（如 autocrlf 导致 diff 被忽略）commit 可能失败，容错继续
    console.log('⚠️  git commit 失败，但继续执行（可能之前已提交）');
  }
} else {
  console.log('\nℹ️  版本号文件无变更（已提交过），跳过 commit');
}

// ---------- 5. 清理本地 tag ----------
try {
  execSync(`git rev-parse ${tag}`, { stdio: 'ignore' });
  console.log(`⚠️  本地标签 ${tag} 已存在，删除后重建`);
  execSync(`git tag -d ${tag}`, { stdio: 'inherit' });
} catch {}

// ---------- 6. 打新 tag ----------
console.log(`\n🏷️  打标签 ${tag}...`);
execSync(`git tag ${tag}`, { stdio: 'inherit' });

// ---------- 7. 清理远程冲突 tag（若有） ----------
try {
  const remoteTag = execSync(`git ls-remote --tags origin refs/tags/${tag}`, { encoding: 'utf-8' }).trim();
  if (remoteTag) {
    console.log(`⚠️  远程标签 ${tag} 已存在，先删除远程`);
    execSync(`git push origin :refs/tags/${tag}`, { stdio: 'inherit' });
  }
} catch {}

// ---------- 8. 推送 ----------
console.log(`\n🚀 推送到 origin（将自动触发 GitHub Actions 构建 & 发布）...`);
execSync('git push origin HEAD --tags', { stdio: 'inherit' });

console.log('');
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  ✅ 版本号已更新，Tag 已推送！                             ║');
console.log('║  GitHub Actions 正在构建多平台安装包...                     ║');
console.log('║  约 10~20 分钟后，所有平台构建完成 → 自动发布 Release      ║');
console.log('║  进度查看: https://github.com/txquan06-max/modelvault/actions ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');