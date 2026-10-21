import Fuse from 'fuse.js';

export interface GunplaItem {
  id: string;
  name: { en: string; jp: string; zh: string };
  series: { en: string; jp: string; zh: string };
  grade: string;
}

// ---- 本地中文映射层 ----
const ZH_MAP: Record<string, { name?: string; series?: string }> = {
  // 核心机体与系列翻译
  'RX-78-2 Gundam': { name: 'RX-78-2 高达' },
  'RX-78-2 Gundam (MGEX)': { name: 'RX-78-2 高达 (MGEX)' },
  'MS-06S Zaku II Char Custom': { name: '夏亚专用扎古II' },
  'MS-06F Zaku II': { name: '扎古II' },
  'RX-77-2 Guncannon': { name: '钢加农' },
  'RX-75-4 Guntank': { name: '钢坦克' },
  'MSM-07 Z\'Gok': { name: '魔蟹' },
  'MSM-03 Gogg': { name: '战蟹' },
  'MSM-04 Acguy': { name: '龟霸' },
  'MSN-02 Zeong': { name: '吉翁号' },
  'YMS-15 Gyan': { name: '强人' },
  'MS-09 Dom': { name: '大魔' },
  'MS-09R Rick Dom': { name: '里克·大魔' },
  'MS-14S Gelgoog Char Custom': { name: '夏亚专用勇士' },
  'MS-14A Gelgoog': { name: '勇士' },
  'RX-79[G] Gundam Ground Type': { name: '陆战型高达' },
  'RX-79[G]Ez-8 Gundam Ez8': { name: 'Ez8 高达' },
  'RGM-79 GM': { name: '吉姆' },
  'RB-79 Ball': { name: '铁球' },
  'RX-78GP01 Gundam GP01': { name: '高达GP01' },
  'RX-78GP01Fb Gundam GP01Fb': { name: '高达GP01Fb' },
  'RX-78GP02A Gundam GP02A': { name: '高达GP02A' },
  'RX-78GP03S Gundam GP03S': { name: '高达GP03S' },
  'MSZ-006 Zeta Gundam': { name: 'Z高达' },
  'RX-178 Gundam Mk-II (AEUG)': { name: '高达Mk-II (奥古)' },
  'RX-178 Gundam Mk-II (Titans)': { name: '高达Mk-II (提坦斯)' },
  'MSN-00100 Hyaku Shiki': { name: '百式' },
  'AMX-004 Qubeley': { name: '卡碧尼' },
  'PMX-003 The-O': { name: '铁奥' },
  'MSZ-010 ZZ Gundam': { name: 'ZZ高达' },
  'AMX-004-2 Qubeley Mk-II': { name: '卡碧尼Mk-II' },
  'RX-93 v Gundam (Nu Gundam)': { name: '牛高达' },
  'MSN-04 Sazabi': { name: '沙扎比' },
  'RX-93-v2 Hi-Nu Gundam': { name: '海牛高达' },
  'MSN-04II Nightingale': { name: '夜莺' },
  'RX-0 Unicorn Gundam': { name: '独角兽高达' },
  'RX-0 Unicorn Gundam (MGEX)': { name: '独角兽高达 (MGEX)' },
  'RX-0 Full Armor Unicorn Gundam': { name: '全装甲独角兽高达' },
  'RX-0 Unicorn Gundam 02 Banshee': { name: '独角兽高达二号机 报丧女妖' },
  'RX-0 Unicorn Gundam 03 Phenex': { name: '独角兽高达三号机 菲尼克斯' },
  'MSN-06S Sinanju': { name: '新安洲' },
  'GAT-X105 Strike Gundam': { name: '强袭高达' },
  'ZGMF-X10A Freedom Gundam': { name: '自由高达' },
  'ZGMF-X09A Justice Gundam': { name: '正义高达' },
  'GAT-X303 Aegis Gundam': { name: '神盾高达' },
  'GAT-X207 Blitz Gundam': { name: '迅雷高达' },
  'GAT-X103 Buster Gundam': { name: '暴风高达' },
  'GAT-X102 Duel Gundam': { name: '决斗高达' },
  'ZGMF-X42S Destiny Gundam': { name: '命运高达' },
  'ZGMF-X20A Strike Freedom Gundam': { name: '强袭自由高达' },
  'ZGMF-X20A Strike Freedom Gundam (MGEX)': { name: '强袭自由高达 (MGEX)' },
  'ZGMF-X19A Infinite Justice Gundam': { name: '无限正义高达' },
  'ZGMF-X56S Impulse Gundam': { name: '脉冲高达' },
  'STTS-909 Rising Freedom Gundam': { name: '飞升自由高达' },
  'STTS-808 Immortal Justice Gundam': { name: '不朽正义高达' },
  'ZGMF-X20A Mighty Strike Freedom Gundam': { name: '非凡强袭自由高达' },
  'GN-001 Gundam Exia': { name: '能天使高达' },
  'GN-0000+GNR-010 00 Raiser': { name: '00强化模组' },
  'GNT-0000 00 Qan[T]': { name: '量子型00高达' },
  'GN-002 Gundam Dynames': { name: '力天使高达' },
  'GN-003 Gundam Kyrios': { name: '主天使高达' },
  'GN-005 Gundam Virtue': { name: '德天使高达' },
  'ASW-G-08 Gundam Barbatos': { name: '高达巴巴托斯' },
  'ASW-G-08 Gundam Barbatos (MGSD)': { name: '高达巴巴托斯 (MGSD)' },
  'ASW-G-08 Gundam Barbatos Lupus': { name: '高达巴巴托斯 狼王' },
  'ASW-G-66 Gundam Kimaris': { name: '高达锡蒙利' },
  'ASW-G-11 Gundam Gusion': { name: '高达古辛' },
  'ASW-G-11 Gundam Gusion Rebake': { name: '高达古辛重锻型' },
  'ASW-G-64 Gundam Flauros': { name: '高达佛劳洛斯' },
  'XVX-016 Gundam Aerial': { name: '风灵高达' },
  'XVX-016 Gundam Aerial Rebuild': { name: '风灵高达 改修型' },
  'X-EX01 Gundam Calibarn': { name: '异灵高达' },
  'X-EX01 Gundam Schwarzette': { name: '战骑高达' },
  'MD-0032G Darilbalde': { name: '达里尔巴尔德' },
  'FP/A-77 Gundam Pharact': { name: '铁骑高达' },
  'LM312V04 Victory Gundam': { name: 'V高达' },
  'LM314V21 V2 Gundam': { name: 'V2高达' },
  'GF13-017NJII God Gundam': { name: '神高达' },
  'GF13-017NJ Shining Gundam': { name: '闪光高达' },
  'XXXG-00W0 Wing Gundam Zero EW': { name: '飞翼零式高达 EW' },
  'XXXG-00W0 Wing Gundam Zero EW (MGSD)': { name: '飞翼零式高达 EW (MGSD)' },
  'XXXG-01D Gundam Deathscythe Hell EW': { name: '地狱死神高达 EW' },
  'XXXG-01H Gundam Heavyarms EW': { name: '重装高达 EW' },
  'GX-9901-DX Gundam Double X': { name: '高达DX' },
  'System-∀99 ∀ Gundam': { name: '倒A高达' },
  'Concept-X 6-1-2 Turn X': { name: '倒X' },
  'RX-9/C Narrative Gundam C-Packs': { name: '叙事高达 C装备' },
  'RX-104FF Penelope': { name: '潘娜洛普' },
  'RX-105 Xi Gundam': { name: 'Ξ高达' },
  'MSA-0011 S Gundam': { name: 'S高达' },
  'MSA-0011[Ext] Ex-S Gundam': { name: 'Ex-S高达' },
  'RX-78AN-01 Gundam AN-01 Tristan': { name: '高达AN-01 崔斯坦' },

  'Mobile Suit Gundam': { series: '机动战士高达' },
  'Mobile Suit Gundam: The Origin': { series: '机动战士高达 THE ORIGIN' },
  'The 08th MS Team': { series: '机动战士高达 第08MS小队' },
  '0080: War in the Pocket': { series: '机动战士高达0080 口袋里的战争' },
  '0083: Stardust Memory': { series: '机动战士高达0083 星尘的回忆' },
  'Zeta Gundam': { series: '机动战士Z高达' },
  'Gundam ZZ': { series: '机动战士高达ZZ' },
  "Char's Counterattack": { series: '逆袭的夏亚' },
  'Gundam Unicorn': { series: '机动战士高达UC' },
  'Gundam NT': { series: '机动战士高达NT' },
  "Hathaway's Flash": { series: '闪光的哈萨维' },
  'Gundam Sentinel': { series: '高达前哨战' },
  'Twilight AXIS': { series: '暮光轴心' },
  'Thunderbolt': { series: '雷霆宙域' },
  'Gundam SEED': { series: '高达SEED' },
  'Gundam SEED Destiny': { series: '高达SEED Destiny' },
  'Gundam SEED Freedom': { series: '高达SEED FREEDOM' },
  'Gundam 00': { series: '机动战士高达00' },
  'Iron-Blooded Orphans': { series: '铁血的奥尔芬斯' },
  'The Witch from Mercury': { series: '水星的魔女' },
  'Victory Gundam': { series: '机动战士V高达' },
  'G Gundam': { series: '机动武斗传G高达' },
  'Gundam Wing': { series: '新机动战记高达W' },
  'After War Gundam X': { series: '机动新世纪高达X' },
  'Turn A Gundam': { series: '逆A高达' },
  'GQuuuuuuX': { series: '机动战士Gundam GQuuuuuuX' },
};

// ---- 核心热门机体库（全规格整合） ----
const CORE_DB: GunplaItem[] = [
  // ==================== 宇宙世纪 (UC) ====================
  // --- 机动战士高达 (0079) ---
  { id: 'rx-78-2-eg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'EG' },
  { id: 'rx-78-2-hg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'rx-78-2-rg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'rx-78-2-mg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'rx-78-2-mgex', name: { en: 'RX-78-2 Gundam (MGEX)', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达 (MGEX)' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MGEX' },
  { id: 'rx-78-2-pg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'PG' },
  { id: 'zaku-char-hg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zaku-char-rg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'zaku-char-mg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'zaku-char-pg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'PG' },
  { id: 'guncannon-hg', name: { en: 'RX-77-2 Guncannon', jp: 'RX-77-2 ガンキャノン', zh: '钢加农' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'guncannon-rg', name: { en: 'RX-77-2 Guncannon', jp: 'RX-77-2 ガンキャノン', zh: '钢加农' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'guncannon-mg', name: { en: 'RX-77-2 Guncannon', jp: 'RX-77-2 ガンキャノン', zh: '钢加农' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'guntank-hg', name: { en: 'RX-75-4 Guntank', jp: 'RX-75-4 ガンタンク', zh: '钢坦克' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'guntank-mg', name: { en: 'RX-75-4 Guntank', jp: 'RX-75-4 ガンタンク', zh: '钢坦克' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'zgok-hg', name: { en: 'MSM-07 Z\'Gok', jp: 'MSM-07 ズゴック', zh: '魔蟹' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zgok-mg', name: { en: 'MSM-07 Z\'Gok', jp: 'MSM-07 ズゴック', zh: '魔蟹' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'gogg-hg', name: { en: 'MSM-03 Gogg', jp: 'MSM-03 ゴッグ', zh: '战蟹' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'acguy-hg', name: { en: 'MSM-04 Acguy', jp: 'MSM-04 アッガイ', zh: '龟霸' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zeong-hg', name: { en: 'MSN-02 Zeong', jp: 'MSN-02 ジオング', zh: '吉翁号' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zeong-rg', name: { en: 'MSN-02 Zeong', jp: 'MSN-02 ジオング', zh: '吉翁号' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'zeong-mg', name: { en: 'MSN-02 Zeong', jp: 'MSN-02 ジオング', zh: '吉翁号' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'gyan-hg', name: { en: 'YMS-15 Gyan', jp: 'YMS-15 ギャン', zh: '强人' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'dom-hg', name: { en: 'MS-09 Dom', jp: 'MS-09 ドム', zh: '大魔' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'dom-rg', name: { en: 'MS-09 Dom', jp: 'MS-09 ドム', zh: '大魔' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'dom-mg', name: { en: 'MS-09 Dom', jp: 'MS-09 ドム', zh: '大魔' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'gelgoog-char-hg', name: { en: 'MS-14S Gelgoog Char Custom', jp: 'MS-14S シャア専用ゲルググ', zh: '夏亚专用勇士' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gelgoog-char-mg', name: { en: 'MS-14S Gelgoog Char Custom', jp: 'MS-14S シャア専用ゲルググ', zh: '夏亚专用勇士' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'gm-hg', name: { en: 'RGM-79 GM', jp: 'RGM-79 ジム', zh: '吉姆' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gm-mg', name: { en: 'RGM-79 GM', jp: 'RGM-79 ジム', zh: '吉姆' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'ball-hg', name: { en: 'RB-79 Ball', jp: 'RB-79 ボール', zh: '铁球' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'ball-mg', name: { en: 'RB-79 Ball', jp: 'RB-79 ボール', zh: '铁球' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },

  // --- 第08MS小队 ---
  { id: 'ground-gundam-hg', name: { en: 'RX-79[G] Gundam Ground Type', jp: 'RX-79[G] 陸戦型ガンダム', zh: '陆战型高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'HG' },
  { id: 'ground-gundam-mg', name: { en: 'RX-79[G] Gundam Ground Type', jp: 'RX-79[G] 陸戦型ガンダム', zh: '陆战型高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'MG' },
  { id: 'ez8-hg', name: { en: 'RX-79[G]Ez-8 Gundam Ez8', jp: 'RX-79[G]Ez-8 ガンダムEz8', zh: 'Ez8 高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'HG' },
  { id: 'ez8-mg', name: { en: 'RX-79[G]Ez-8 Gundam Ez8', jp: 'RX-79[G]Ez-8 ガンダムEz8', zh: 'Ez8 高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'MG' },

  // --- 0083 星尘的回忆 ---
  { id: 'gp01-hg', name: { en: 'RX-78GP01 Gundam GP01', jp: 'RX-78GP01 ガンダムGP01', zh: '高达GP01' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp01-rg', name: { en: 'RX-78GP01 Gundam GP01', jp: 'RX-78GP01 ガンダムGP01', zh: '高达GP01' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'RG' },
  { id: 'gp01-mg', name: { en: 'RX-78GP01 Gundam GP01', jp: 'RX-78GP01 ガンダムGP01', zh: '高达GP01' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },
  { id: 'gp01fb-hg', name: { en: 'RX-78GP01Fb Gundam GP01Fb', jp: 'RX-78GP01Fb ガンダムGP01Fb', zh: '高达GP01Fb' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp01fb-rg', name: { en: 'RX-78GP01Fb Gundam GP01Fb', jp: 'RX-78GP01Fb ガンダムGP01Fb', zh: '高达GP01Fb' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'RG' },
  { id: 'gp01fb-mg', name: { en: 'RX-78GP01Fb Gundam GP01Fb', jp: 'RX-78GP01Fb ガンダムGP01Fb', zh: '高达GP01Fb' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },
  { id: 'gp02-hg', name: { en: 'RX-78GP02A Gundam GP02A', jp: 'RX-78GP02A ガンダムGP02A', zh: '高达GP02A' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp02-mg', name: { en: 'RX-78GP02A Gundam GP02A', jp: 'RX-78GP02A ガンダムGP02A', zh: '高达GP02A' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },
  { id: 'gp03s-hg', name: { en: 'RX-78GP03S Gundam GP03S', jp: 'RX-78GP03S ガンダムGP03S', zh: '高达GP03S' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp03s-mg', name: { en: 'RX-78GP03S Gundam GP03S', jp: 'RX-78GP03S ガンダムGP03S', zh: '高达GP03S' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },

  // --- Z高达 ---
  { id: 'zeta-hg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'zeta-rg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RG' },
  { id: 'zeta-mg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'zeta-pg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'PG' },
  { id: 'mk2-aeug-hg', name: { en: 'RX-178 Gundam Mk-II (AEUG)', jp: 'RX-178 ガンダムMk-II(エゥーゴ)', zh: '高达Mk-II (奥古)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'mk2-aeug-rg', name: { en: 'RX-178 Gundam Mk-II (AEUG)', jp: 'RX-178 ガンダムMk-II(エゥーゴ)', zh: '高达Mk-II (奥古)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RG' },
  { id: 'mk2-aeug-mg', name: { en: 'RX-178 Gundam Mk-II (AEUG)', jp: 'RX-178 ガンダムMk-II(エゥーゴ)', zh: '高达Mk-II (奥古)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'mk2-titans-hg', name: { en: 'RX-178 Gundam Mk-II (Titans)', jp: 'RX-178 ガンダムMk-II(ティターンズ)', zh: '高达Mk-II (提坦斯)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'mk2-titans-rg', name: { en: 'RX-178 Gundam Mk-II (Titans)', jp: 'RX-178 ガンダムMk-II(ティターンズ)', zh: '高达Mk-II (提坦斯)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RG' },
  { id: 'mk2-titans-mg', name: { en: 'RX-178 Gundam Mk-II (Titans)', jp: 'RX-178 ガンダムMk-II(ティターンズ)', zh: '高达Mk-II (提坦斯)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'hyaku-shiki-hg', name: { en: 'MSN-00100 Hyaku Shiki', jp: 'MSN-00100 百式', zh: '百式' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'hyaku-shiki-mg', name: { en: 'MSN-00100 Hyaku Shiki', jp: 'MSN-00100 百式', zh: '百式' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'qubeley-hg', name: { en: 'AMX-004 Qubeley', jp: 'AMX-004 キュベレイ', zh: '卡碧尼' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'qubeley-mg', name: { en: 'AMX-004 Qubeley', jp: 'AMX-004 キュベレイ', zh: '卡碧尼' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'the-o-hg', name: { en: 'PMX-003 The-O', jp: 'PMX-003 ジ・O', zh: '铁奥' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },

  // --- ZZ高达 ---
  { id: 'zz-hg', name: { en: 'MSZ-010 ZZ Gundam', jp: 'MSZ-010 ΖΖガンダム', zh: 'ZZ高达' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'zz-mg', name: { en: 'MSZ-010 ZZ Gundam', jp: 'MSZ-010 ΖΖガンダム', zh: 'ZZ高达' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'MG' },
  { id: 'qubeley-mk2-hg', name: { en: 'AMX-004-2 Qubeley Mk-II', jp: 'AMX-004-2 キュベレイMk-II', zh: '卡碧尼Mk-II' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'qubeley-mk2-mg', name: { en: 'AMX-004-2 Qubeley Mk-II', jp: 'AMX-004-2 キュベレイMk-II', zh: '卡碧尼Mk-II' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'MG' },

  // --- 逆袭的夏亚 ---
  { id: 'nu-hg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'nu-rg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'RG' },
  { id: 'nu-mg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'nu-pg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'PG' },
  { id: 'sazabi-hg', name: { en: 'MSN-04 Sazabi', jp: 'MSN-04 サザビー', zh: '沙扎比' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'sazabi-rg', name: { en: 'MSN-04 Sazabi', jp: 'MSN-04 サザビー', zh: '沙扎比' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'RG' },
  { id: 'sazabi-mg', name: { en: 'MSN-04 Sazabi', jp: 'MSN-04 サザビー', zh: '沙扎比' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'hi-nu-hg', name: { en: 'RX-93-v2 Hi-Nu Gundam', jp: 'RX-93-ν2 Hi-νガンダム', zh: '海牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'hi-nu-rg', name: { en: 'RX-93-v2 Hi-Nu Gundam', jp: 'RX-93-ν2 Hi-νガンダム', zh: '海牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'RG' },
  { id: 'hi-nu-mg', name: { en: 'RX-93-v2 Hi-Nu Gundam', jp: 'RX-93-ν2 Hi-νガンダム', zh: '海牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },

  // --- 高达UC ---
  { id: 'unicorn-hg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'unicorn-rg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'unicorn-mg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'unicorn-mgex', name: { en: 'RX-0 Unicorn Gundam (MGEX)', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达 (MGEX)' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MGEX' },
  { id: 'unicorn-pg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'PG' },
  { id: 'unicorn-fa-hg', name: { en: 'RX-0 Full Armor Unicorn Gundam', jp: 'RX-0 フルアーマー・ユニコーンガンダム', zh: '全装甲独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'unicorn-fa-mg', name: { en: 'RX-0 Full Armor Unicorn Gundam', jp: 'RX-0 フルアーマー・ユニコーンガンダム', zh: '全装甲独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'banshee-hg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ', zh: '独角兽高达二号机 报丧女妖' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'banshee-rg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ', zh: '独角兽高达二号机 报丧女妖' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'banshee-mg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ', zh: '独角兽高达二号机 报丧女妖' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'phenex-hg', name: { en: 'RX-0 Unicorn Gundam 03 Phenex', jp: 'RX-0 ユニコーンガンダム3号機 フェネクス', zh: '独角兽高达三号机 菲尼克斯' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'phenex-rg', name: { en: 'RX-0 Unicorn Gundam 03 Phenex', jp: 'RX-0 ユニコーンガンダム3号機 フェネクス', zh: '独角兽高达三号机 菲尼克斯' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'phenex-mg', name: { en: 'RX-0 Unicorn Gundam 03 Phenex', jp: 'RX-0 ユニコーンガンダム3号機 フェネクス', zh: '独角兽高达三号机 菲尼克斯' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'phenex-pg', name: { en: 'RX-0 Unicorn Gundam 03 Phenex', jp: 'RX-0 ユニコーンガンダム3号機 フェネクス', zh: '独角兽高达三号机 菲尼克斯' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'PG' },
  { id: 'sinanju-hg', name: { en: 'MSN-06S Sinanju', jp: 'MSN-06S シナンジュ', zh: '新安洲' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'sinanju-rg', name: { en: 'MSN-06S Sinanju', jp: 'MSN-06S シナンジュ', zh: '新安洲' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'sinanju-mg', name: { en: 'MSN-06S Sinanju', jp: 'MSN-06S シナンジュ', zh: '新安洲' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },

  // --- 高达NT / 闪光的哈萨维 ---
  { id: 'narrative-hg', name: { en: 'RX-9/C Narrative Gundam C-Packs', jp: 'RX-9/C ナラティブガンダム C装備', zh: '叙事高达 C装备' }, series: { en: 'Gundam NT', jp: '機動戦士ガンダムNT', zh: '机动战士高达NT' }, grade: 'HG' },
  { id: 'penelope-hg', name: { en: 'RX-104FF Penelope', jp: 'RX-104FF ペーネロペー', zh: '潘娜洛普' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },
  { id: 'xi-hg', name: { en: 'RX-105 Xi Gundam', jp: 'RX-105 Ξガンダム', zh: 'Ξ高达' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },

  // --- 高达前哨战 ---
  { id: 's-gundam-hg', name: { en: 'MSA-0011 S Gundam', jp: 'MSA-0011 Sガンダム', zh: 'S高达' }, series: { en: 'Gundam Sentinel', jp: 'ガンダム・センチネル', zh: '高达前哨战' }, grade: 'HG' },
  { id: 'ex-s-hg', name: { en: 'MSA-0011[Ext] Ex-S Gundam', jp: 'MSA-0011[Ext] Ex-Sガンダム', zh: 'Ex-S高达' }, series: { en: 'Gundam Sentinel', jp: 'ガンダム・センチネル', zh: '高达前哨战' }, grade: 'HG' },
  { id: 'ex-s-mg', name: { en: 'MSA-0011[Ext] Ex-S Gundam', jp: 'MSA-0011[Ext] Ex-Sガンダム', zh: 'Ex-S高达' }, series: { en: 'Gundam Sentinel', jp: 'ガンダム・センチネル', zh: '高达前哨战' }, grade: 'MG' },

  // --- 暮光轴心 ---
  { id: 'tristan-hg', name: { en: 'RX-78AN-01 Gundam AN-01 Tristan', jp: 'RX-78AN-01 ガンダムAN-01 トリスタン', zh: '高达AN-01 崔斯坦' }, series: { en: 'Twilight AXIS', jp: '機動戦士ガンダム Twilight AXIS', zh: '暮光轴心' }, grade: 'HG' },

  // ==================== 非UC系列 ====================
  // --- 高达SEED / DESTINY / FREEDOM ---
  { id: 'strike-hg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'strike-rg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'strike-mg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'strike-pg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'PG' },
  { id: 'freedom-hg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'freedom-rg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'freedom-mg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'freedom-pg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'PG' },
  { id: 'justice-hg', name: { en: 'ZGMF-X09A Justice Gundam', jp: 'ZGMF-X09A ジャスティスガンダム', zh: '正义高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'justice-rg', name: { en: 'ZGMF-X09A Justice Gundam', jp: 'ZGMF-X09A ジャスティスガンダム', zh: '正义高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'justice-mg', name: { en: 'ZGMF-X09A Justice Gundam', jp: 'ZGMF-X09A ジャスティスガンダム', zh: '正义高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'destiny-hg', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'destiny-rg', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'destiny-mg', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MG' },
  { id: 'strike-freedom-hg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'strike-freedom-rg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'strike-freedom-mg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MG' },
  { id: 'strike-freedom-mgex', name: { en: 'ZGMF-X20A Strike Freedom Gundam (MGEX)', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达 (MGEX)' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MGEX' },
  { id: 'strike-freedom-pg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'PG' },
  { id: 'infinite-justice-hg', name: { en: 'ZGMF-X19A Infinite Justice Gundam', jp: 'ZGMF-X19A インフィニットジャスティスガンダム', zh: '无限正义高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'infinite-justice-rg', name: { en: 'ZGMF-X19A Infinite Justice Gundam', jp: 'ZGMF-X19A インフィニットジャスティスガンダム', zh: '无限正义高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'infinite-justice-mg', name: { en: 'ZGMF-X19A Infinite Justice Gundam', jp: 'ZGMF-X19A インフィニットジャスティスガンダム', zh: '无限正义高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MG' },
  { id: 'rising-freedom-hg', name: { en: 'STTS-909 Rising Freedom Gundam', jp: 'STTS-909 ライジングフリーダムガンダム', zh: '飞升自由高达' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'immortal-justice-hg', name: { en: 'STTS-808 Immortal Justice Gundam', jp: 'STTS-808 イモータルジャスティスガンダム', zh: '不朽正义高达' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'mighty-strike-freedom-hg', name: { en: 'ZGMF-X20A Mighty Strike Freedom Gundam', jp: 'ZGMF-X20A マイティーストライクフリーダムガンダム', zh: '非凡强袭自由高达' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },

  // --- 高达00 ---
  { id: 'exia-hg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'exia-rg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: 'exia-mg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'exia-pg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'PG' },
  { id: '00raiser-hg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: '00raiser-rg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: '00raiser-mg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: '00raiser-pg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'PG' },
  { id: 'qant-hg', name: { en: 'GNT-0000 00 Qan[T]', jp: 'GNT-0000 ダブルオークアンタ', zh: '量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'qant-rg', name: { en: 'GNT-0000 00 Qan[T]', jp: 'GNT-0000 ダブルオークアンタ', zh: '量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: 'qant-mg', name: { en: 'GNT-0000 00 Qan[T]', jp: 'GNT-0000 ダブルオークアンタ', zh: '量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'dynames-hg', name: { en: 'GN-002 Gundam Dynames', jp: 'GN-002 ガンダムデュナメス', zh: '力天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'dynames-mg', name: { en: 'GN-002 Gundam Dynames', jp: 'GN-002 ガンダムデュナメス', zh: '力天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'kyrios-hg', name: { en: 'GN-003 Gundam Kyrios', jp: 'GN-003 ガンダムキュリオス', zh: '主天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'kyrios-mg', name: { en: 'GN-003 Gundam Kyrios', jp: 'GN-003 ガンダムキュリオス', zh: '主天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'virtue-hg', name: { en: 'GN-005 Gundam Virtue', jp: 'GN-005 ガンダムヴァーチェ', zh: '德天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'virtue-mg', name: { en: 'GN-005 Gundam Virtue', jp: 'GN-005 ガンダムヴァーチェ', zh: '德天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },

  // --- 铁血的奥尔芬斯 ---
  { id: 'barbatos-hg', name: { en: 'ASW-G-08 Gundam Barbatos', jp: 'ASW-G-08 ガンダム・バルバトス', zh: '高达巴巴托斯' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-mg', name: { en: 'ASW-G-08 Gundam Barbatos', jp: 'ASW-G-08 ガンダム・バルバトス', zh: '高达巴巴托斯' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'MG' },
  { id: 'barbatos-mgsd', name: { en: 'ASW-G-08 Gundam Barbatos (MGSD)', jp: 'ASW-G-08 ガンダム・バルバトス', zh: '高达巴巴托斯 (MGSD)' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'MGSD' },
  { id: 'barbatos-lupus-hg', name: { en: 'ASW-G-08 Gundam Barbatos Lupus', jp: 'ASW-G-08 ガンダム・バルバトスルプス', zh: '高达巴巴托斯 狼王' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'kimaris-hg', name: { en: 'ASW-G-66 Gundam Kimaris', jp: 'ASW-G-66 ガンダム・キマリス', zh: '高达锡蒙利' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'kimaris-vidar-hg', name: { en: 'ASW-G-66 Gundam Kimaris Vidar', jp: 'ASW-G-66 ガンダム・キマリスヴィダール', zh: '高达锡蒙利维达尔' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'gusion-hg', name: { en: 'ASW-G-11 Gundam Gusion', jp: 'ASW-G-11 ガンダム・グシオン', zh: '高达古辛' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'gusion-rebake-hg', name: { en: 'ASW-G-11 Gundam Gusion Rebake', jp: 'ASW-G-11 ガンダム・グシオンリベイク', zh: '高达古辛重锻型' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'flauros-hg', name: { en: 'ASW-G-64 Gundam Flauros', jp: 'ASW-G-64 ガンダム・フラウロス', zh: '高达佛劳洛斯' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },

  // --- 水星的魔女 ---
  { id: 'aerial-hg', name: { en: 'XVX-016 Gundam Aerial', jp: 'XVX-016 ガンダム・エアリアル', zh: '风灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'aerial-fm', name: { en: 'XVX-016 Gundam Aerial', jp: 'XVX-016 ガンダム・エアリアル', zh: '风灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'FM' },
  { id: 'aerial-rebuild-hg', name: { en: 'XVX-016 Gundam Aerial Rebuild', jp: 'XVX-016 ガンダム・エアリアル(改修型)', zh: '风灵高达 改修型' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'calibarn-hg', name: { en: 'X-EX01 Gundam Calibarn', jp: 'X-EX01 ガンダムキャリバーン', zh: '异灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'schwarzette-hg', name: { en: 'X-EX01 Gundam Schwarzette', jp: 'X-EX01 ガンダムシュバルゼッテ', zh: '战骑高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'darilbalde-hg', name: { en: 'MD-0032G Darilbalde', jp: 'MD-0032G ダリルバルデ', zh: '达里尔巴尔德' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'pharact-hg', name: { en: 'FP/A-77 Gundam Pharact', jp: 'FP/A-77 ガンダムファラクト', zh: '铁骑高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },

  // --- V高达 / G高达 / W高达 / X高达 / Turn A ---
  { id: 'victory-hg', name: { en: 'LM312V04 Victory Gundam', jp: 'LM312V04 ヴィクトリーガンダム', zh: 'V高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'HG' },
  { id: 'victory-mg', name: { en: 'LM312V04 Victory Gundam', jp: 'LM312V04 ヴィクトリーガンダム', zh: 'V高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'MG' },
  { id: 'v2-hg', name: { en: 'LM314V21 V2 Gundam', jp: 'LM314V21 V2ガンダム', zh: 'V2高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'HG' },
  { id: 'v2-mg', name: { en: 'LM314V21 V2 Gundam', jp: 'LM314V21 V2ガンダム', zh: 'V2高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'MG' },
  { id: 'god-hg', name: { en: 'GF13-017NJII God Gundam', jp: 'GF13-017NJII ゴッドガンダム', zh: '神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'god-rg', name: { en: 'GF13-017NJII God Gundam', jp: 'GF13-017NJII ゴッドガンダム', zh: '神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'RG' },
  { id: 'god-mg', name: { en: 'GF13-017NJII God Gundam', jp: 'GF13-017NJII ゴッドガンダム', zh: '神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'MG' },
  { id: 'shining-hg', name: { en: 'GF13-017NJ Shining Gundam', jp: 'GF13-017NJ シャイニングガンダム', zh: '闪光高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'shining-mg', name: { en: 'GF13-017NJ Shining Gundam', jp: 'GF13-017NJ シャイニングガンダム', zh: '闪光高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'MG' },
  { id: 'wing-zero-hg', name: { en: 'XXXG-00W0 Wing Gundam Zero EW', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼零式高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'wing-zero-rg', name: { en: 'XXXG-00W0 Wing Gundam Zero EW', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼零式高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'RG' },
  { id: 'wing-zero-mg', name: { en: 'XXXG-00W0 Wing Gundam Zero EW', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼零式高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'wing-zero-mgsd', name: { en: 'XXXG-00W0 Wing Gundam Zero EW (MGSD)', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼零式高达 EW (MGSD)' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MGSD' },
  { id: 'deathscythe-hg', name: { en: 'XXXG-01D Gundam Deathscythe Hell EW', jp: 'XXXG-01D ガンダムデスサイズヘルEW', zh: '地狱死神高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'deathscythe-mg', name: { en: 'XXXG-01D Gundam Deathscythe Hell EW', jp: 'XXXG-01D ガンダムデスサイズヘルEW', zh: '地狱死神高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'heavyarms-hg', name: { en: 'XXXG-01H Gundam Heavyarms EW', jp: 'XXXG-01H ガンダムヘビーアームズEW', zh: '重装高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'heavyarms-mg', name: { en: 'XXXG-01H Gundam Heavyarms EW', jp: 'XXXG-01H ガンダムヘビーアームズEW', zh: '重装高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'double-x-hg', name: { en: 'GX-9901-DX Gundam Double X', jp: 'GX-9901-DX ガンダムダブルエックス', zh: '高达DX' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'HG' },
  { id: 'double-x-mg', name: { en: 'GX-9901-DX Gundam Double X', jp: 'GX-9901-DX ガンダムダブルエックス', zh: '高达DX' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'MG' },
  { id: 'turn-a-hg', name: { en: 'System-∀99 ∀ Gundam', jp: 'System-∀99 ∀ガンダム', zh: '倒A高达' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'HG' },
  { id: 'turn-a-mg', name: { en: 'System-∀99 ∀ Gundam', jp: 'System-∀99 ∀ガンダム', zh: '倒A高达' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'MG' },
  { id: 'turn-x-hg', name: { en: 'Concept-X 6-1-2 Turn X', jp: 'Concept-X 6-1-2 ターンX', zh: '倒X' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'HG' },
  { id: 'turn-x-mg', name: { en: 'Concept-X 6-1-2 Turn X', jp: 'Concept-X 6-1-2 ターンX', zh: '倒X' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'MG' },

  // --- 最新作品 GQuuuuuuX ---
  { id: 'gquuuuuux-hg', name: { en: 'GQuuuuuuX', jp: 'GQuuuuuuX', zh: 'GQuuuuuuX' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-red-hg', name: { en: 'Red Gundam', jp: '赤いガンダム', zh: '红色高达' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-police-zaku-hg', name: { en: 'Police Zaku', jp: '軍警ザク', zh: '军警扎古' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-gelgoog-sugai-hg', name: { en: 'Gelgoog Sugai Custom (GQ)', jp: 'ゲルググ スガイ機(GQ)', zh: '勇士 菅井机 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-gelgoog-bokata-hg', name: { en: 'Gelgoog Bokata Custom (GQ)', jp: 'ゲルググ ボカタ機(GQ)', zh: '勇士 波可塔机 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-gyan-hakuji-hg', name: { en: 'Gyan (Hakuji Equipment)', jp: 'ギャン(ハクジ装備)', zh: '强人 (白瓷装备)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-gfred-hg', name: { en: 'GFreD', jp: 'GFreD', zh: 'GFreD' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-rick-dom-gaia-hg', name: { en: 'Rick Dom Gaia Custom / Ortega Custom (GQ)', jp: 'リック・ドム ガイア機/オルテガ機(GQ)', zh: '里克·大魔 盖亚机/奥尔迪加机 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-zaku-hg', name: { en: 'Zaku (GQ)', jp: 'ザク(GQ)', zh: '扎古 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-char-zaku-hg', name: { en: 'Char\'s Zaku (GQ)', jp: 'シャア専用ザク(GQ)', zh: '夏亚专用扎古 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-white-gundam-hg', name: { en: 'White Gundam', jp: '白いガンダム', zh: '白色高达' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-rick-dom-sharia-hg', name: { en: 'Rick Dom Sharia Custom (GQ)', jp: 'リック・ドム シャリア機(GQ)', zh: '里克·大魔 沙利亚机 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
];

const REMOTE_URL = 'https://raw.githubusercontent.com/stevenla/gunpla-db/master/src/lib/data/products.json';

// ---- 数据标准化 ----
function localizeRemoteItem(raw: any): GunplaItem {
  const enName = raw.nameEn || raw.name || raw.nameJp || 'Unknown';
  const jpName = raw.nameJp || raw.name || 'Unknown';
  const enSeries = raw.series || 'Unknown';
  const jpSeries = raw.series || 'Unknown';
  const zhName = ZH_MAP[enName]?.name || enName;
  const zhSeries = ZH_MAP[enSeries]?.series || enSeries;

  let grade = raw.brand || 'HG';
  if (grade === 'HGUC') grade = 'HG';

  return {
    id: raw.id || `${enName}-${grade}`,
    name: { en: enName, jp: jpName, zh: zhName },
    series: { en: enSeries, jp: jpSeries, zh: zhSeries },
    grade: grade,
  };
}

export class GunplaSearch {
  private static fuse: Fuse<GunplaItem> | null = null;
  private static data: GunplaItem[] = CORE_DB;
  private static lastFetch = 0;
  private static CACHE_TTL = 1000 * 60 * 60 * 12; // 12小时

  private static buildIndex(list: GunplaItem[]) {
    this.fuse = new Fuse(list, {
      keys: ['name.en', 'name.jp', 'name.zh', 'series.en', 'series.jp', 'series.zh', 'grade'],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  static async init(): Promise<void> {
    const now = Date.now();
    if (this.data.length > CORE_DB.length && now - this.lastFetch < this.CACHE_TTL) return;

    const merged = new Map<string, GunplaItem>();
    
    // 1. 优先放入本地核心库
    CORE_DB.forEach(item => merged.set(item.id, item));

    // 2. 加入超时控制，防止网络请求卡住UI
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const res = await fetch(REMOTE_URL, { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw: any = await res.json();
      if (!Array.isArray(raw)) throw new Error('数据格式非数组');

      raw.forEach((item: any) => {
        const localized = localizeRemoteItem(item);
        if (!merged.has(localized.id)) {
          merged.set(localized.id, localized);
        }
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn('远程数据请求超时，使用本地核心库。');
      } else {
        console.warn('远程数据加载失败，使用本地核心库。', err);
      }
    } finally {
      clearTimeout(timeoutId);
    }

    this.data = Array.from(merged.values());
    this.lastFetch = now;
    this.buildIndex(this.data);
  }

  static search(query: string): GunplaItem[] {
    if (!query || query.trim().length < 2) return [];
    if (!this.fuse) this.buildIndex(this.data);

    const rawResults = this.fuse!.search(query.trim()).map(r => r.item);

    // ---- 多级排序：系列优先级 → 机体名称 → 规格 ----
    const seriesPriority = [
      'Mobile Suit Gundam',
      'Mobile Suit Gundam: The Origin',
      'The 08th MS Team',
      '0080: War in the Pocket',
      '0083: Stardust Memory',
      'Zeta Gundam',
      'Gundam ZZ',
      "Char's Counterattack",
      'Gundam Unicorn',
      'Gundam NT',
      "Hathaway's Flash",
      'Gundam Sentinel',
      'Twilight AXIS',
      'Thunderbolt',
      'Gundam SEED',
      'Gundam SEED Destiny',
      'Gundam SEED Freedom',
      'Gundam 00',
      'Iron-Blooded Orphans',
      'The Witch from Mercury',
      'Victory Gundam',
      'G Gundam',
      'Gundam Wing',
      'After War Gundam X',
      'Turn A Gundam',
      'GQuuuuuuX',
    ];

    const gradeOrder = ['EG', 'HG', 'RG', 'MG', 'MGEX', 'MGSD', 'FM', 'PG'];

    return rawResults.sort((a, b) => {
      // 1. 系列优先级
      const idxSeriesA = seriesPriority.indexOf(a.series.en);
      const idxSeriesB = seriesPriority.indexOf(b.series.en);
      if (idxSeriesA !== idxSeriesB) {
        return (idxSeriesA === -1 ? 999 : idxSeriesA) - (idxSeriesB === -1 ? 999 : idxSeriesB);
      }

      // 2. 机体英文名称（确保同一机体的不同规格相邻）
      const nameCompare = a.name.en.localeCompare(b.name.en);
      if (nameCompare !== 0) return nameCompare;

      // 3. 规格优先级
      const idxGradeA = gradeOrder.indexOf(a.grade.toUpperCase());
      const idxGradeB = gradeOrder.indexOf(b.grade.toUpperCase());
      return (idxGradeA === -1 ? 999 : idxGradeA) - (idxGradeB === -1 ? 999 : idxGradeB);
    });
  }
}