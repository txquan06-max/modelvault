import Fuse from 'fuse.js';

export interface GunplaItem {
  id: string;
  name: { en: string; jp: string; zh: string };
  series: { en: string; jp: string; zh: string };
  grade: string;
}

// ==================== 核心热门机体库 (纯本地版) ====================
export const CORE_DB: GunplaItem[] = [
  // ========================================================
  // ==================== 宇宙世纪 (UC) ====================
  // ========================================================

  // --- 机动战士高达 (0079) / MSV / THE ORIGIN / 雷霆宙域 ---
  { id: 'rx-78-2-eg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'EG' },
  { id: 'rx-78-2-hg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'rx-78-2-mg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'rx-78-2-mgex', name: { en: 'RX-78-2 Gundam (MGEX)', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达 (MGEX)' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MGEX' },
  { id: 'rx-78-2-pg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'PG' },
  { id: 'rx-78-2-rg', name: { en: 'RX-78-2 Gundam', jp: 'RX-78-2 ガンダム', zh: 'RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'gundam-the-origin-hg', name: { en: 'RX-78-02 Gundam (The Origin)', jp: 'RX-78-02 ガンダム (THE ORIGIN)', zh: 'RX-78-02 高达 (ORIGIN版)' }, series: { en: 'Mobile Suit Gundam: The Origin', jp: '機動戦士ガンダム THE ORIGIN', zh: '机动战士高达 THE ORIGIN' }, grade: 'HG' },
  { id: 'zaku-char-hg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zaku-char-mg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'zaku-char-pg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'PG' },
  { id: 'zaku-char-rg', name: { en: 'MS-06S Zaku II Char Custom', jp: 'MS-06S シャア専用ザクII', zh: '夏亚专用扎古II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'zaku-ii-origin-hg', name: { en: 'MS-06F Zaku II (The Origin)', jp: 'MS-06F ザクII (THE ORIGIN)', zh: '扎古II (ORIGIN版)' }, series: { en: 'Mobile Suit Gundam: The Origin', jp: '機動戦士ガンダム THE ORIGIN', zh: '机动战士高达 THE ORIGIN' }, grade: 'HG' },
  { id: 'gouf-hg', name: { en: 'MS-07B Gouf', jp: 'MS-07B グフ', zh: '老虎' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'dom-hg', name: { en: 'MS-09 Dom', jp: 'MS-09 ドム', zh: '大魔' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'dom-rg', name: { en: 'MS-09 Dom', jp: 'MS-09 ドム', zh: '大魔' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'rick-dom-hg', name: { en: 'MS-09R Rick Dom', jp: 'MS-09R リック・ドム', zh: '里克·大魔' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gelgoog-hg', name: { en: 'MS-14A Gelgoog', jp: 'MS-14A ゲルググ', zh: '勇士' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gelgoog-char-hg', name: { en: 'MS-14S Gelgoog Char Custom', jp: 'MS-14S シャア専用ゲルググ', zh: '夏亚专用勇士' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gelgoog-char-mg', name: { en: 'MS-14S Gelgoog Char Custom', jp: 'MS-14S シャア専用ゲルググ', zh: '夏亚专用勇士' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'zgok-hg', name: { en: 'MSM-07 Z\'Gok', jp: 'MSM-07 ズゴック', zh: '魔蟹' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zgok-mg', name: { en: 'MSM-07 Z\'Gok', jp: 'MSM-07 ズゴック', zh: '魔蟹' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'MG' },
  { id: 'acguy-hg', name: { en: 'MSM-04 Acguy', jp: 'MSM-04 アッガイ', zh: '龟霸' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gogg-hg', name: { en: 'MSM-03 Gogg', jp: 'MSM-03 ゴッグ', zh: '战蟹' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zeong-hg', name: { en: 'MSN-02 Zeong', jp: 'MSN-02 ジオング', zh: '吉翁号' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'zeong-rg', name: { en: 'MSN-02 Zeong', jp: 'MSN-02 ジオング', zh: '吉翁号' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'gyan-hg', name: { en: 'YMS-15 Gyan', jp: 'YMS-15 ギャン', zh: '强人' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'guncannon-hg', name: { en: 'RX-77-2 Guncannon', jp: 'RX-77-2 ガンキャノン', zh: '钢加农' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'guncannon-rg', name: { en: 'RX-77-2 Guncannon', jp: 'RX-77-2 ガンキャノン', zh: '钢加农' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'guntank-hg', name: { en: 'RX-75-4 Guntank', jp: 'RX-75-4 ガンタンク', zh: '钢坦克' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gm-hg', name: { en: 'RGM-79 GM', jp: 'RGM-79 ジム', zh: '吉姆' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gm-command-space-hg', name: { en: 'RGM-79GS GM Command Space', jp: 'RGM-79GS ジム・コマンド(宇宙戦仕様)', zh: '吉姆指挥官型 (宇宙战)' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gm-sniper-2-hg', name: { en: 'RGM-79SP GM Sniper II', jp: 'RGM-79SP ジム・スナイパーII', zh: '吉姆狙击型II' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gm-spartan-hg', name: { en: 'RGM-79SP GM Spartan', jp: 'RGM-79SP ジム・スパルタン', zh: '吉姆斯巴达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'ball-hg', name: { en: 'RB-79 Ball', jp: 'RB-79 ボール', zh: '铁球' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'HG' },
  { id: 'gundam-thunderbolt-hg', name: { en: 'RX-78AL Atlas Gundam', jp: 'RX-78AL アトラスガンダム', zh: '擎天神高达' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'HG' },
  { id: 'full-armor-gundam-thunderbolt-hg', name: { en: 'Full Armor Gundam (Thunderbolt Ver.)', jp: 'フルアーマー・ガンダム (サンダーボルト版)', zh: '全装甲高达 (雷霆宙域版)' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'HG' },
  { id: 'psycho-zaku-hg', name: { en: 'High Mobility Type Zaku "Psycho Zaku"', jp: '高機動型ザク "サイコ・ザク"', zh: '高机动型扎古 "脑波传导型扎古"' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'HG' },
  { id: 'gundam-thunderbolt-last-session-mg', name: { en: 'Full Armor Gundam (Thunderbolt Ver.) Last Session', jp: 'フルアーマー・ガンダム (サンダーボルト版) Last Session', zh: '全装甲高达 (雷霆宙域版) 最终决战样式' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'MG' },
  { id: 'psycho-zaku-last-session-mg', name: { en: 'High Mobility Type Zaku "Psycho Zaku" Last Session', jp: '高機動型ザク "サイコ・ザク" Last Session', zh: '高机动型扎古“脑波传导型扎古”最终决战样式' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'MG' },

  // --- 机动战士高达 第08MS小队 ---
  { id: 'ground-gundam-hg', name: { en: 'RX-79[G] Gundam Ground Type', jp: 'RX-79[G] 陸戦型ガンダム', zh: '陆战型高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'HG' },
  { id: 'ground-gundam-mg', name: { en: 'RX-79[G] Gundam Ground Type', jp: 'RX-79[G] 陸戦型ガンダム', zh: '陆战型高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'MG' },
  { id: 'ez8-hg', name: { en: 'RX-79[G]Ez-8 Gundam Ez8', jp: 'RX-79[G]Ez-8 ガンダムEz8', zh: 'Ez8 高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'HG' },
  { id: 'ez8-mg', name: { en: 'RX-79[G]Ez-8 Gundam Ez8', jp: 'RX-79[G]Ez-8 ガンダムEz8', zh: 'Ez8 高达' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'MG' },
  { id: 'gouf-custom-hg', name: { en: 'MS-07B-3 Gouf Custom', jp: 'MS-07B-3 グフカスタム', zh: '老虎特装型' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'HG' },

  // --- 机动战士高达 0080 口袋里的战争 ---
  { id: 'alex-hg', name: { en: 'RX-78NT-1 Gundam Alex', jp: 'RX-78NT-1 ガンダムアレックス', zh: '高达NT-1 阿雷克斯' }, series: { en: '0080: War in the Pocket', jp: '機動戦士ガンダム0080', zh: '机动战士高达0080 口袋里的战争' }, grade: 'HG' },
  { id: 'kampfer-hg', name: { en: 'MS-18E Kämpfer', jp: 'MS-18E ケンプファー', zh: '京宝梵' }, series: { en: '0080: War in the Pocket', jp: '機動戦士ガンダム0080', zh: '机动战士高达0080 口袋里的战争' }, grade: 'HG' },
  { id: 'kampfer-mg', name: { en: 'MS-18E Kämpfer', jp: 'MS-18E ケンプファー', zh: '京宝梵' }, series: { en: '0080: War in the Pocket', jp: '機動戦士ガンダム0080', zh: '机动战士高达0080 口袋里的战争' }, grade: 'MG' },

  // --- 机动战士高达0083 星尘的回忆 ---
  { id: 'gp01-hg', name: { en: 'RX-78GP01 Gundam GP01', jp: 'RX-78GP01 ガンダムGP01', zh: '高达GP01' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp01-rg', name: { en: 'RX-78GP01 Gundam GP01', jp: 'RX-78GP01 ガンダムGP01', zh: '高达GP01' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'RG' },
  { id: 'gp01-mg', name: { en: 'RX-78GP01 Gundam GP01', jp: 'RX-78GP01 ガンダムGP01', zh: '高达GP01' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },
  { id: 'gp01fb-hg', name: { en: 'RX-78GP01Fb Gundam GP01Fb', jp: 'RX-78GP01Fb ガンダムGP01Fb', zh: '高达GP01Fb' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp01fb-rg', name: { en: 'RX-78GP01Fb Gundam GP01Fb', jp: 'RX-78GP01Fb ガンダムGP01Fb', zh: '高达GP01Fb' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'RG' },
  { id: 'gp02-hg', name: { en: 'RX-78GP02A Gundam GP02A', jp: 'RX-78GP02A ガンダムGP02A', zh: '高达GP02A' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp02a-mg', name: { en: 'RX-78GP02A Gundam GP02A', jp: 'RX-78GP02A ガンダムGP02A', zh: '高达GP02A' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },
  { id: 'gp03s-hg', name: { en: 'RX-78GP03S Gundam GP03S', jp: 'RX-78GP03S ガンダムGP03S', zh: '高达GP03S' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'gp03s-mg', name: { en: 'RX-78GP03S Gundam GP03S', jp: 'RX-78GP03S ガンダムGP03S', zh: '高达GP03S' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'MG' },
  { id: 'gerbera-tetra-hg', name: { en: 'AGX-04 Gerbera Tetra', jp: 'AGX-04 ガーベラ・テトラ', zh: '红色角马' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },

  // --- 机动战士Z高达 ---
  { id: 'zeta-hg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'zeta-rg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RG' },
  { id: 'zeta-mg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'zeta-pg', name: { en: 'MSZ-006 Zeta Gundam', jp: 'MSZ-006 Ζガンダム', zh: 'Z高达' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'PG' },
  { id: 'zeta-gundam-unit3-red-snake-mg', name: { en: 'MSZ-006 Zeta Gundam Unit 3 (Red Snake)', jp: 'MSZ-006 Ζガンダム3号機 (レッドスネーク)', zh: 'Z高达3号机 (红蛇)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'mk2-aeug-hg', name: { en: 'RX-178 Gundam Mk-II (AEUG)', jp: 'RX-178 ガンダムMk-II(エゥーゴ)', zh: '高达Mk-II (奥古)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'mk2-aeug-rg', name: { en: 'RX-178 Gundam Mk-II (AEUG)', jp: 'RX-178 ガンダムMk-II(エゥーゴ)', zh: '高达Mk-II (奥古)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RG' },
  { id: 'mk2-aeug-mg', name: { en: 'RX-178 Gundam Mk-II (AEUG)', jp: 'RX-178 ガンダムMk-II(エゥーゴ)', zh: '高达Mk-II (奥古)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'mk2-titans-hg', name: { en: 'RX-178 Gundam Mk-II (Titans)', jp: 'RX-178 ガンダムMk-II(ティターンズ)', zh: '高达Mk-II (提坦斯)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'mk2-titans-rg', name: { en: 'RX-178 Gundam Mk-II (Titans)', jp: 'RX-178 ガンダムMk-II(ティターンズ)', zh: '高达Mk-II (提坦斯)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RG' },
  { id: 'mk2-titans-mg', name: { en: 'RX-178 Gundam Mk-II (Titans)', jp: 'RX-178 ガンダムMk-II(ティターンズ)', zh: '高达Mk-II (提坦斯)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'hyaku-shiki-hg', name: { en: 'MSN-00100 Hyaku Shiki', jp: 'MSN-00100 百式', zh: '百式' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'hyaku-shiki-mg', name: { en: 'MSN-00100 Hyaku Shiki', jp: 'MSN-00100 百式', zh: '百式' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'MG' },
  { id: 'qubeley-hg', name: { en: 'AMX-004 Qubeley', jp: 'AMX-004 キュベレイ', zh: '卡碧尼' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'the-o-hg', name: { en: 'PMX-003 The-O', jp: 'PMX-003 ジ・O', zh: '铁奥' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'rick-dias-hg', name: { en: 'RMS-099 Rick Dias', jp: 'RMS-099 リック・ディアス', zh: '里克·迪亚斯' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'rick-dias-quattro-hg', name: { en: 'RMS-099 Rick Dias (Quattro Custom)', jp: 'RMS-099 リック・ディアス (クワトロ・バジーナカラー)', zh: '里克·迪亚斯 (库瓦托罗专用机)' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'marasai-hg', name: { en: 'RMS-108 Marasai', jp: 'RMS-108 マラサイ', zh: '玛拉赛' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'hambrabi-hg', name: { en: 'RX-139 Hambrabi', jp: 'RX-139 ハンブラビ', zh: '汉布拉比' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'baund-doc-hg', name: { en: 'NRX-055 Baund Doc', jp: 'NRX-055 バウンド・ドック', zh: '猎犬' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },

  // --- 机动战士高达ZZ ---
  { id: 'zz-hg', name: { en: 'MSZ-010 ZZ Gundam', jp: 'MSZ-010 ΖΖガンダム', zh: 'ZZ高达' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'zz-mg', name: { en: 'MSZ-010 ZZ Gundam', jp: 'MSZ-010 ΖΖガンダム', zh: 'ZZ高达' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'MG' },
  { id: 'qubeley-mk2-hg', name: { en: 'AMX-004-2 Qubeley Mk-II', jp: 'AMX-004-2 キュベレイMk-II', zh: '卡碧尼Mk-II' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'bawoo-hg', name: { en: 'AMX-107 Bawoo', jp: 'AMX-107 バウ', zh: '龙飞' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'dreissen-hg', name: { en: 'AMX-009 Dreissen', jp: 'AMX-009 ドライセン', zh: '德莱森' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'gaza-d-hg', name: { en: 'AMX-006 Gaza D', jp: 'AMX-006 ガザD', zh: '加撒D' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },

  // --- 逆袭的夏亚 ---
  { id: 'nu-hg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'nu-rg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'RG' },
  { id: 'nu-mg', name: { en: 'RX-93 v Gundam (Nu Gundam)', jp: 'RX-93 νガンダム', zh: '牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'nu-mg-ka', name: { en: 'RX-93 v Gundam (Ver.Ka)', jp: 'RX-93 νガンダム Ver.Ka', zh: '牛高达 (卡版)' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'nu-gundam-hws-hg', name: { en: 'RX-93 v Gundam HWS', jp: 'RX-93 νガンダム HWS', zh: '牛高达 HWS' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'nu-gundam-hws-rg', name: { en: 'RX-93 v Gundam HWS', jp: 'RX-93 νガンダム HWS', zh: '牛高达 HWS' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'RG' },
  { id: 'nu-gundam-hws-mg', name: { en: 'RX-93 v Gundam HWS', jp: 'RX-93 νガンダム HWS', zh: '牛高达 HWS' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'hi-nu-hg', name: { en: 'RX-93-v2 Hi-Nu Gundam', jp: 'RX-93-ν2 Hi-νガンダム', zh: '海牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'hi-nu-rg', name: { en: 'RX-93-v2 Hi-Nu Gundam', jp: 'RX-93-ν2 Hi-νガンダム', zh: '海牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'RG' },
  { id: 'hi-nu-mg', name: { en: 'RX-93-v2 Hi-Nu Gundam', jp: 'RX-93-ν2 Hi-νガンダム', zh: '海牛高达' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'hi-nu-mg-ka', name: { en: 'RX-93-v2 Hi-Nu Gundam (Ver.Ka)', jp: 'RX-93-ν2 Hi-νガンダム Ver.Ka', zh: '海牛高达 (卡版)' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'sazabi-hg', name: { en: 'MSN-04 Sazabi', jp: 'MSN-04 サザビー', zh: '沙扎比' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'sazabi-mg', name: { en: 'MSN-04 Sazabi', jp: 'MSN-04 サザビー', zh: '沙扎比' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'sazabi-ver-ka-mg', name: { en: 'MSN-04 Sazabi (Ver.Ka)', jp: 'MSN-04 サザビー Ver.Ka', zh: '沙扎比 (卡版)' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'jegan-hg', name: { en: 'RGM-89 Jegan', jp: 'RGM-89 ジェガン', zh: '杰刚' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'gearadoga-hg', name: { en: 'AMS-119 Geara Doga', jp: 'AMS-119 ギラ・ドーガ', zh: '基拉·德卡' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },
  { id: 'jagd-doga-hg', name: { en: 'MSN-03 Jagd Doga', jp: 'MSN-03 ヤクト・ドーガ', zh: '乍得·多加' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'HG' },

  // --- 机动战士高达UC ---
  { id: 'unicorn-hg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'unicorn-rg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'unicorn-mg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'unicorn-mgex', name: { en: 'RX-0 Unicorn Gundam (MGEX)', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达 (MGEX)' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MGEX' },
  { id: 'unicorn-pg', name: { en: 'RX-0 Unicorn Gundam', jp: 'RX-0 ユニコーンガンダム', zh: '独角兽高达' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'PG' },
  { id: 'banshee-hg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ', zh: '报丧女妖' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'banshee-rg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ', zh: '报丧女妖' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'banshee-norn-hg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee Norn', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ・ノルン', zh: '报丧女妖·命运女神' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'banshee-norn-rg', name: { en: 'RX-0 Unicorn Gundam 02 Banshee Norn', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ・ノルン', zh: '报丧女妖·命运女神' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'phenex-narrative-hg', name: { en: 'RX-0 Unicorn Gundam 03 Phenex (Narrative Ver.)', jp: 'RX-0 ユニコーンガンダム3号機 フェネクス (ナラティブVer.)', zh: '菲尼克斯 (叙事版)' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'phenex-narrative-rg', name: { en: 'RX-0 Unicorn Gundam 03 Phenex (Narrative Ver.)', jp: 'RX-0 ユニコーンガンダム3号機 フェネクス (ナラティブVer.)', zh: '菲尼克斯 (叙事版)' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'sinanju-hg', name: { en: 'MSN-06S Sinanju', jp: 'MSN-06S シナンジュ', zh: '新安洲' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'sinanju-rg', name: { en: 'MSN-06S Sinanju', jp: 'MSN-06S シナンジュ', zh: '新安洲' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'RG' },
  { id: 'sinanju-mg', name: { en: 'MSN-06S Sinanju', jp: 'MSN-06S シナンジュ', zh: '新安洲' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'sinanju-stein-hg', name: { en: 'MSN-06S Sinanju Stein', jp: 'MSN-06S シナンジュ・スタイン', zh: '新安洲·原石' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'jesta-hg', name: { en: 'RGM-96X Jesta', jp: 'RGM-96X ジェスタ', zh: '杰斯塔' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'jesta-cannon-hg', name: { en: 'RGM-96X Jesta Cannon', jp: 'RGM-96X ジェスタ・キャノン', zh: '杰斯塔加农' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'stark-jegan-hg', name: { en: 'RGM-89S Stark Jegan', jp: 'RGM-89S スタークジェガン', zh: '强袭杰刚' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'gearazulu-hg', name: { en: 'AMS-129 Geara Zulu', jp: 'AMS-129 ギラ・ズール', zh: '基拉·祖鲁' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'kshatriya-hg', name: { en: 'NZ-666 Kshatriya', jp: 'NZ-666 クシャトリヤ', zh: '刹帝利' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'delta-plus-hg', name: { en: 'MSN-001A1 Delta Plus', jp: 'MSN-001A1 デルタプラス', zh: '德尔塔Plus' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'rezel-hg', name: { en: 'RGZ-95 ReZEL', jp: 'RGZ-95 リゼル', zh: '里歇尔' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },

  // --- 闪光的哈萨维 ---
  { id: 'xi-hg', name: { en: 'RX-105 Xi Gundam', jp: 'RX-105 Ξガンダム', zh: 'Ξ高达' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },
  { id: 'penelope-hg', name: { en: 'RX-104FF Penelope', jp: 'RX-104FF ペーネロペー', zh: '潘娜洛普' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },
  { id: 'messer-hg', name: { en: 'Me02R-F01 Messer Type-F01', jp: 'Me02R-F01 メッサーF01型', zh: '梅萨 F01型' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },

  // --- 高达前哨战 / Advance of Zeta / 暮光轴心 ---
  { id: 'ex-s-gundam-task-force-alpha-mg', name: { en: 'MSA-0011[Ext] Ex-S Gundam (Task Force α Ver.)', jp: 'MSA-0011[Ext] Ex-Sガンダム (任務部隊α Ver.)', zh: 'Ex-S高达 (阿尔法小队配色)' }, series: { en: 'Gundam Sentinel', jp: 'ガンダム・センチネル', zh: '高达前哨战' }, grade: 'MG' },
  { id: 's-gundam-booster-mg', name: { en: 'MSA-0011 S Gundam (Booster Unit Type)', jp: 'MSA-0011 Sガンダム (ブースター装備型)', zh: 'S高达 (推进器装备型)' }, series: { en: 'Gundam Sentinel', jp: 'ガンダム・センチネル', zh: '高达前哨战' }, grade: 'MG' },
  { id: 'gundam-tr1-hazel-owsla-mg', name: { en: 'RX-121-2A Gundam TR-1 [Advanced Hazel]', jp: 'RX-121-2A ガンダムTR-1 [アドバンスド・ヘイズル]', zh: '高达TR-1 [进阶型海兹尔]' }, series: { en: 'Advance of Zeta', jp: 'Advance of Zeta', zh: 'Advance of Zeta (AOZ)' }, grade: 'MG' },
  { id: 'tristan-hg', name: { en: 'RX-78AN-01 Gundam AN-01 Tristan', jp: 'RX-78AN-01 ガンダムAN-01 トリスタン', zh: '高达AN-01 崔斯坦' }, series: { en: 'Twilight AXIS', jp: '機動戦士ガンダム Twilight AXIS', zh: '暮光轴心' }, grade: 'HG' },

  // ========================================================
  // ==================== 非宇宙世纪 (Non-UC) ====================
  // ========================================================

  // --- 机动战士高达SEED / DESTINY / FREEDOM ---
  { id: 'strike-hg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'strike-rg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'strike-mg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'strike-pg', name: { en: 'GAT-X105 Strike Gundam', jp: 'GAT-X105 ストライクガンダム', zh: '强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'PG' },
  { id: 'aile-strike-hg', name: { en: 'GAT-X105 Aile Strike Gundam', jp: 'GAT-X105 エールストライクガンダム', zh: '空战型强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'aile-strike-rg', name: { en: 'GAT-X105 Aile Strike Gundam', jp: 'GAT-X105 エールストライクガンダム', zh: '空战型强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'aile-strike-mg', name: { en: 'GAT-X105 Aile Strike Gundam', jp: 'GAT-X105 エールストライクガンダム', zh: '空战型强袭高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'duel-gundam-hg', name: { en: 'GAT-X102 Duel Gundam', jp: 'GAT-X102 デュエルガンダム', zh: '决斗高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'busters-gundam-hg', name: { en: 'GAT-X103 Buster Gundam', jp: 'GAT-X103 バスターガンダム', zh: '暴风高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'blitz-gundam-hg', name: { en: 'GAT-X207 Blitz Gundam', jp: 'GAT-X207 ブリッツガンダム', zh: '迅雷高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'aegis-gundam-hg', name: { en: 'GAT-X303 Aegis Gundam', jp: 'GAT-X303 イージスガンダム', zh: '神盾高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'freedom-hg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'freedom-rg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'freedom-mg', name: { en: 'ZGMF-X10A Freedom Gundam', jp: 'ZGMF-X10A フリーダムガンダム', zh: '自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'freedom-gundam-ver2-mg', name: { en: 'ZGMF-X10A Freedom Gundam Ver.2.0', jp: 'ZGMF-X10A フリーダムガンダム Ver.2.0', zh: '自由高达 Ver.2.0' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'justice-hg', name: { en: 'ZGMF-X09A Justice Gundam', jp: 'ZGMF-X09A ジャスティスガンダム', zh: '正义高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'HG' },
  { id: 'justice-rg', name: { en: 'ZGMF-X09A Justice Gundam', jp: 'ZGMF-X09A ジャスティスガンダム', zh: '正义高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'justice-gundam-mg', name: { en: 'ZGMF-X09A Justice Gundam', jp: 'ZGMF-X09A ジャスティスガンダム', zh: '正义高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MG' },
  { id: 'calamity-gundam-fm', name: { en: 'GAT-X131 Calamity Gundam', jp: 'GAT-X131 カラミティガンダム', zh: '灾厄高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'FM' },
  { id: 'raider-gundam-fm', name: { en: 'GAT-X370 Raider Gundam', jp: 'GAT-X370 レイダーガンダム', zh: '掠夺高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'FM' },
  { id: 'forbidden-gundam-fm', name: { en: 'GAT-X252 Forbidden Gundam', jp: 'GAT-X252 フォビドゥンガンダム', zh: '禁断高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'FM' },
  { id: 'strike-freedom-hg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'strike-freedom-rg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'strike-freedom-mg', name: { en: 'ZGMF-X20A Strike Freedom Gundam', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MG' },
  { id: 'strike-freedom-mgex', name: { en: 'ZGMF-X20A Strike Freedom Gundam (MGEX)', jp: 'ZGMF-X20A ストライクフリーダムガンダム', zh: '强袭自由高达 (MGEX)' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MGEX' },
  { id: 'infinite-justice-hg', name: { en: 'ZGMF-X19A Infinite Justice Gundam', jp: 'ZGMF-X19A インフィニットジャスティスガンダム', zh: '无限正义高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'infinite-justice-mg', name: { en: 'ZGMF-X19A Infinite Justice Gundam', jp: 'ZGMF-X19A インフィニットジャスティスガンダム', zh: '无限正义高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MG' },
  { id: 'force-impulse-hg', name: { en: 'ZGMF-X56S/α Force Impulse Gundam', jp: 'ZGMF-X56S/α フォースインパルスガンダム', zh: '空战型脉冲高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'force-impulse-rg', name: { en: 'ZGMF-X56S/α Force Impulse Gundam', jp: 'ZGMF-X56S/α フォースインパルスガンダム', zh: '空战型脉冲高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'destiny-gundam-hg', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'destiny-gundam-rg', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'destiny-gundam-mg', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MG' },
  { id: 'legend-gundam-hg', name: { en: 'ZGMF-X666S Legend Gundam', jp: 'ZGMF-X666S レジェンドガンダム', zh: '传说高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'rising-freedom-hg', name: { en: 'STTS-909 Rising Freedom Gundam', jp: 'STTS-909 ライジングフリーダムガンダム', zh: '飞升自由高达' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'immortal-justice-hg', name: { en: 'STTS-808 Immortal Justice Gundam', jp: 'STTS-808 イモータルジャスティスガンダム', zh: '不朽正义高达' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'mighty-strike-freedom-hg', name: { en: 'ZGMF-X20A Mighty Strike Freedom Gundam', jp: 'ZGMF-X20A マイティーストライクフリーダムガンダム', zh: '非凡强袭自由高达' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'black-knight-squad-hg', name: { en: 'Black Knight Squad Shi-ve.A', jp: 'ブラックナイトスコード シヴァ', zh: '黑骑士小队 破坏' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'gyan-strom-hg', name: { en: 'Gyan Strom', jp: 'ギャンシュトローム', zh: '强人奔流' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'destiny-gundam-s2-final-hg', name: { en: 'ZGMF-X42S Destiny Gundam (S2 Final Battle Ver.)', jp: 'ZGMF-X42S デスティニーガンダム (S2最終決戦仕様)', zh: '命运高达 (S2 最终决战式样)' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'akatsuki-oowashi-gb', name: { en: 'ORB-01 Akatsuki Gundam (Oowashi Pack)', jp: 'ORB-01 アカツキガンダム (オオワシ装備)', zh: '拂晓高达 (大鹫装备)' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'zgok-seed-freedom-clear-gb', name: { en: 'MSM-07 Z\'Gok (SEED Freedom Ver.) [Clear Color]', jp: 'MSM-07 ズゴック (SEED FREEDOM Ver.) [クリアカラー]', zh: '魔蟹 (SEED FREEDOM Ver.) [透明配色]' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },

  // --- 机动战士高达00 ---
  { id: 'exia-hg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'exia-rg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: 'exia-mg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'exia-pg', name: { en: 'GN-001 Gundam Exia', jp: 'GN-001 ガンダムエクシア', zh: '能天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'PG' },
  { id: 'exia-repair-2-hg', name: { en: 'GN-001REII Gundam Exia Repair II', jp: 'GN-001REII ガンダムエクシアリペアII', zh: '能天使高达 修复型II' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'exia-r4-rg', name: { en: 'GN-001REIV Gundam Exia Repair IV', jp: 'GN-001REIV ガンダムエクシアリペアIV', zh: '能天使高达 修复型IV' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: '00raiser-hg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: '00raiser-rg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: '00raiser-mg', name: { en: 'GN-0000+GNR-010 00 Raiser', jp: 'GN-0000+GNR-010 ダブルオーライザー', zh: '00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'qant-hg', name: { en: 'GNT-0000 00 Qan[T]', jp: 'GNT-0000 ダブルオークアンタ', zh: '量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'qant-rg', name: { en: 'GNT-0000 00 Qan[T]', jp: 'GNT-0000 ダブルオークアンタ', zh: '量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: 'qant-mg', name: { en: 'GNT-0000 00 Qan[T]', jp: 'GNT-0000 ダブルオークアンタ', zh: '量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'dynames-hg', name: { en: 'GN-002 Gundam Dynames', jp: 'GN-002 ガンダムデュナメス', zh: '力天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'dynames-mg', name: { en: 'GN-002 Gundam Dynames', jp: 'GN-002 ガンダムデュナメス', zh: '力天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'kyrios-hg', name: { en: 'GN-003 Gundam Kyrios', jp: 'GN-003 ガンダムキュリオス', zh: '主天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'kyrios-mg', name: { en: 'GN-003 Gundam Kyrios', jp: 'GN-003 ガンダムキュリオス', zh: '主天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'gundam-kyrios-transam-gb', name: { en: 'GN-003 Gundam Kyrios (Trans-Am Mode)', jp: 'GN-003 ガンダムキュリオス (トランザムモード)', zh: '主天使高达 (Trans-Am模式)' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'virtue-hg', name: { en: 'GN-005 Gundam Virtue', jp: 'GN-005 ガンダムヴァーチェ', zh: '德天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'seravee-gundam-hg', name: { en: 'GN-008 Seravee Gundam', jp: 'GN-008 セラヴィーガンダム', zh: '炽天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'cherudim-gundam-hg', name: { en: 'GN-006 Cherudim Gundam', jp: 'GN-006 ケルディムガンダム', zh: '智天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'arios-gundam-hg', name: { en: 'GN-007 Arios Gundam', jp: 'GN-007 アリオスガンダム', zh: '堕天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'harute-hg', name: { en: 'GN-011 Gundam Harute', jp: 'GN-011 ガンダムハルート', zh: '妖天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },

  // --- 铁血的奥尔芬斯 (重点补全巴巴托斯系列) ---
  { id: 'barbatos-form1-hg', name: { en: 'ASW-G-08 Gundam Barbatos [Form 1]', jp: 'ASW-G-08 ガンダム・バルバトス [第1形態]', zh: '高达巴巴托斯 [第1形态]' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-form2-hg', name: { en: 'ASW-G-08 Gundam Barbatos [Form 2]', jp: 'ASW-G-08 ガンダム・バルバトス [第2形態]', zh: '高达巴巴托斯 [第2形态]' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-form3-hg', name: { en: 'ASW-G-08 Gundam Barbatos [Form 3]', jp: 'ASW-G-08 ガンダム・バルバトス [第3形態]', zh: '高达巴巴托斯 [第3形态]' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-form4-hg', name: { en: 'ASW-G-08 Gundam Barbatos [Form 4]', jp: 'ASW-G-08 ガンダム・バルバトス [第4形態]', zh: '高达巴巴托斯 [第4形态]' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-form5-hg', name: { en: 'ASW-G-08 Gundam Barbatos [Form 5]', jp: 'ASW-G-08 ガンダム・バルバトス [第5形態]', zh: '高达巴巴托斯 [第5形态]' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-form6-hg', name: { en: 'ASW-G-08 Gundam Barbatos [Form 6]', jp: 'ASW-G-08 ガンダム・バルバトス [第6形態]', zh: '高达巴巴托斯 [第6形态]' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-mg', name: { en: 'ASW-G-08 Gundam Barbatos', jp: 'ASW-G-08 ガンダム・バルバトス', zh: '高达巴巴托斯' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'MG' },
  { id: 'barbatos-mgsd', name: { en: 'Gundam Barbatos (MGSD)', jp: 'ASW-G-08 ガンダム・バルバトス', zh: '高达巴巴托斯 (MGSD)' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'MGSD' },
  { id: 'barbatos-lupus-hg', name: { en: 'ASW-G-08 Gundam Barbatos Lupus', jp: 'ASW-G-08 ガンダム・バルバトスルプス', zh: '高达巴巴托斯 天狼座' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-lupus-mg', name: { en: 'ASW-G-08 Gundam Barbatos Lupus', jp: 'ASW-G-08 ガンダム・バルバトスルプス', zh: '高达巴巴托斯 天狼座' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'MG' },
  { id: 'barbatos-lupus-rex-hg', name: { en: 'ASW-G-08 Gundam Barbatos Lupus Rex', jp: 'ASW-G-08 ガンダム・バルバトスルプスレクス', zh: '高达巴巴托斯 天狼座帝王形态 (狼王)' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'barbatos-lupus-rex-fm', name: { en: 'ASW-G-08 Gundam Barbatos Lupus Rex', jp: 'ASW-G-08 ガンダム・バルバトスルプスレクス', zh: '高达巴巴托斯 天狼座帝王形态 (狼王)' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'FM' },
  { id: 'bael-hg', name: { en: 'ASW-G-01 Gundam Bael', jp: 'ASW-G-01 ガンダム・バエル', zh: '高达巴耶力' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'kimaris-hg', name: { en: 'ASW-G-66 Gundam Kimaris', jp: 'ASW-G-66 ガンダム・キマリス', zh: '高达锡蒙利' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'kimaris-vidar-hg', name: { en: 'ASW-G-66 Gundam Kimaris Vidar', jp: 'ASW-G-66 ガンダム・キマリスヴィダール', zh: '高达锡蒙利维达尔' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'kimaris-vidar-mg', name: { en: 'ASW-G-66 Gundam Kimaris Vidar', jp: 'ASW-G-66 ガンダム・キマリスヴィダール', zh: '高达锡蒙利维达尔' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'MG' },
  { id: 'gusion-rebake-hg', name: { en: 'ASW-G-11 Gundam Gusion Rebake', jp: 'ASW-G-11 ガンダム・グシオンリベイク', zh: '高达古辛重锻型' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'flauros-hg', name: { en: 'ASW-G-64 Gundam Flauros', jp: 'ASW-G-64 ガンダム・フラウロス', zh: '高达佛劳洛斯' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'graze-hg', name: { en: 'EB-06 Graze', jp: 'EB-06 グレイズ', zh: '格雷兹' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'graze-kai-hg', name: { en: 'EB-06/tc Graze Kai', jp: 'EB-06/tc グレイズ改', zh: '格雷兹改' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'schwalbe-graze-hg', name: { en: 'EB-05S Schwalbe Graze', jp: 'EB-05S シュヴァルベグレイズ', zh: '燕式格雷兹' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hyakuren-hg', name: { en: 'STH-05 Hyakuren', jp: 'STH-05 百錬', zh: '百炼' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'man-rodi-hg', name: { en: 'UGY-R41 Man Rodi', jp: 'UGY-R41 マン・ロディ', zh: '曼·罗迪' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'graze-ein-fm', name: { en: 'EB-AX2 Graze Ein', jp: 'EB-AX2 グレイズ・アイン', zh: '格雷兹·艾因' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'FM' },

  // --- 水星的魔女 ---
  { id: 'aerial-hg', name: { en: 'Gundam Aerial', jp: 'XVX-016 ガンダム・エアリアル', zh: '风灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'aerial-fm', name: { en: 'Gundam Aerial', jp: 'XVX-016 ガンダム・エアリアル', zh: '风灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'FM' },
  { id: 'aerial-rebuild-hg', name: { en: 'Gundam Aerial Rebuild', jp: 'XVX-016 ガンダム・エアリアル(改修型)', zh: '风灵高达 改修型' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'aerial-clear-gb', name: { en: 'XVX-016 Gundam Aerial [Clear Color]', jp: 'XVX-016 ガンダム・エアリアル [クリアカラー]', zh: '风灵高达 [透明配色]' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'FM' },
  { id: 'calibarn-hg', name: { en: 'X-EX01 Gundam Calibarn', jp: 'X-EX01 ガンダムキャリバーン', zh: '异灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'schwarzette-hg', name: { en: 'X-EX01 Gundam Schwarzette', jp: 'X-EX01 ガンダムシュバルゼッテ', zh: '战骑高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'pharact-hg', name: { en: 'FP/A-77 Gundam Pharact', jp: 'FP/A-77 ガンダムファラクト', zh: '铁骑高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'lfrith-hg', name: { en: 'XVX-016 Gundam Lfrith', jp: 'XVX-016 ガンダム・ルブリス', zh: '魔灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'lfrith-ur-hg', name: { en: 'XVX-016 Gundam Lfrith Ur', jp: 'XVX-016 ガンダム・ルブリス・ウル', zh: '魔灵高达 乌尔' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'lfrith-thorn-hg', name: { en: 'XVX-016 Gundam Lfrith Thorn', jp: 'XVX-016 ガンダム・ルブリス・ゾーン', zh: '魔灵高达 索恩' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'darilbalde-hg', name: { en: 'MD-0032G Darilbalde', jp: 'MD-0032G ダリルバルデ', zh: '达里尔巴尔德' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'dilanza-hg', name: { en: 'CEK-040 Beguir-Beu', jp: 'CEK-040 ベギルベウ', zh: '贝吉·贝尔' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'michaelis-hg', name: { en: 'CFK-029 Michaelis', jp: 'CFK-029 ミカエリス', zh: '米卡埃利斯' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },

  // --- 新机动战记高达W ---
  { id: 'wing-gundam-hg', name: { en: 'XXXG-01W Wing Gundam', jp: 'XXXG-01W ウイングガンダム', zh: '飞翼高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'wing-gundam-zero-hg', name: { en: 'XXXG-00W0 Wing Gundam Zero', jp: 'XXXG-00W0 ウイングガンダムゼロ', zh: '飞翼高达零式' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'wing-gundam-zero-ew-hg', name: { en: 'XXXG-00W0 Wing Gundam Zero EW', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼高达零式 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'wing-gundam-zero-ew-rg', name: { en: 'XXXG-00W0 Wing Gundam Zero EW', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼高达零式 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'RG' },
  { id: 'wing-gundam-zero-ew-mg', name: { en: 'XXXG-00W0 Wing Gundam Zero EW', jp: 'XXXG-00W0 ウイングガンダムゼロEW', zh: '飞翼高达零式 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'wing-zero-ew-clear-gb', name: { en: 'XXXG-00W0 Wing Gundam Zero EW [Clear Color]', jp: 'XXXG-00W0 ウイングガンダムゼロEW [クリアカラー]', zh: '飞翼零式高达 EW [透明配色]' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MGSD' },
  { id: 'deathscythe-hell-ew-hg', name: { en: 'XXXG-01D Gundam Deathscythe Hell EW', jp: 'XXXG-01D ガンダムデスサイズヘルEW', zh: '地狱死神高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'heavyarms-ew-hg', name: { en: 'XXXG-01H Gundam Heavyarms EW', jp: 'XXXG-01H ガンダムヘビーアームズEW', zh: '重装高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'heavyarms-custom-ew-mg', name: { en: 'XXXG-01H2 Gundam Heavyarms Custom EW', jp: 'XXXG-01H2 ガンダムヘビーアームズ改EW', zh: '重装高达改 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'altron-gundam-hg', name: { en: 'XXXG-01S2 Altron Gundam', jp: 'XXXG-01S2 アルトロンガンダム', zh: '双头龙高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'shenlong-gundam-hg', name: { en: 'XXXG-01S Shenlong Gundam', jp: 'XXXG-01S シェンロンガンダム', zh: '神龙高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'sandrock-gundam-hg', name: { en: 'XXXG-01SR Gundam Sandrock', jp: 'XXXG-01SR ガンダムサンドロック', zh: '沙漠高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'tallgeese-ii-hg', name: { en: 'OZ-00MS2 Tallgeese II', jp: 'OZ-00MS2 トールギスII', zh: '多鲁基斯II' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },

  // --- 机动武斗传G高达 ---
  { id: 'shining-gundam-hg', name: { en: 'GF13-017NJ Shining Gundam', jp: 'GF13-017NJ シャイニングガンダム', zh: '闪光高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'shining-gundam-rg', name: { en: 'GF13-017NJ Shining Gundam', jp: 'GF13-017NJ シャイニングガンダム', zh: '闪光高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'RG' },
  { id: 'god-gundam-hg', name: { en: 'GF13-017NJII God Gundam', jp: 'GF13-017NJII ゴッドガンダム', zh: '神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'god-gundam-rg', name: { en: 'GF13-017NJII God Gundam', jp: 'GF13-017NJII ゴッドガンダム', zh: '神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'RG' },
  { id: 'master-gundam-hg', name: { en: 'GF13-001NHII Master Gundam', jp: 'GF13-001NHII マスターガンダム', zh: '尊者高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'nobell-gundam-hg', name: { en: 'GF13-050NSW Nobel Gundam', jp: 'GF13-050NSW ノーベルガンダム', zh: '诺贝尔高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },

  // --- 机动新世纪高达X ---
  { id: 'gundam-x-hg', name: { en: 'GX-9900 Gundam X', jp: 'GX-9900 ガンダムX', zh: '高达X' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'HG' },
  { id: 'gundam-double-x-hg', name: { en: 'GX-9901-DX Gundam Double X', jp: 'GX-9901-DX ガンダムダブルエックス', zh: '高达DX' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'HG' },
  { id: 'gundam-airmaster-hg', name: { en: 'GW-9800 Gundam Airmaster', jp: 'GW-9800 ガンダムエアマスター', zh: '高达空中霸王' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'HG' },
  { id: 'gundam-leopard-hg', name: { en: 'GT-9600 Gundam Leopard', jp: 'GT-9600 ガンダムレオパルド', zh: '高达豹式' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'HG' },
  { id: 'gundam-virsago-hg', name: { en: 'NRX-0013 Gundam Virsago', jp: 'NRX-0013 ガンダムヴァサーゴ', zh: '高达维萨戈' }, series: { en: 'After War Gundam X', jp: '機動新世紀ガンダムX', zh: '机动新世纪高达X' }, grade: 'HG' },

  // --- 逆A高达 ---
  { id: 'turn-a-gundam-hg', name: { en: 'System-∀99 ∀ Gundam', jp: 'System-∀99 ∀ガンダム', zh: '倒A高达' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'HG' },
  { id: 'turn-a-gundam-mg', name: { en: 'System-∀99 ∀ Gundam', jp: 'System-∀99 ∀ガンダム', zh: '倒A高达' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'MG' },
  { id: 'turn-a-nano-mg', name: { en: 'System-∀99 ∀ Gundam [Nano Coating Image]', jp: 'System-∀99 ∀ガンダム [ナノ塗装イメージ]', zh: '倒A高达 [纳米涂装形象]' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'MG' },
  { id: 'turn-x-hg', name: { en: 'Concept-X 6-1-2 Turn X', jp: 'Concept-X 6-1-2 ターンX', zh: '倒X' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'HG' },
  { id: 'turn-x-mg', name: { en: 'Concept-X 6-1-2 Turn X', jp: 'Concept-X 6-1-2 ターンX', zh: '倒X' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'MG' },

  // --- 机动战士V高达 ---
  { id: 'victory-gundam-hg', name: { en: 'LM312V04 Victory Gundam', jp: 'LM312V04 ヴィクトリーガンダム', zh: 'V高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'HG' },
  { id: 'v2-gundam-hg', name: { en: 'LM314V21 V2 Gundam', jp: 'LM314V21 V2ガンダム', zh: 'V2高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'HG' },
  { id: 'v2-assault-buster-hg', name: { en: 'LM314V23/24 V2 Assault Buster Gundam', jp: 'LM314V23/24 V2アサルトバスターガンダム', zh: 'V2突击重击高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'HG' },
  { id: 'v2-gundam-mg', name: { en: 'LM314V21 V2 Gundam', jp: 'LM314V21 V2ガンダム', zh: 'V2高达' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'MG' },
  { id: 'v2-assault-buster-ka-titanium-gb', name: { en: 'LM314V23/24 V2 Assault Buster Gundam Ver.Ka [Titanium Finish]', jp: 'LM314V23/24 V2アサルトバスターガンダム Ver.Ka [チタニウムフィニッシュ]', zh: 'V2突击重击高达 Ver.Ka [钛合金涂装版]' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'MG' },

  // --- GQuuuuuuX ---
  { id: 'gquuuuuux-hg', name: { en: 'GQuuuuuuX', jp: 'GQuuuuuuX', zh: 'GQuuuuuuX' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-red-gundam-hg', name: { en: 'Red Gundam', jp: '赤いガンダム', zh: '红色高达' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-police-zaku-hg', name: { en: 'Police Zaku', jp: '軍警ザク', zh: '军警扎古' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-char-zaku-hg', name: { en: "Char's Zaku (GQ)", jp: 'シャア専用ザク(GQ)', zh: '夏亚专用扎古 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-gfred-hg', name: { en: 'GFreD', jp: 'GFreD', zh: '基弗列德' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-white-gundam-hg', name: { en: 'White Gundam', jp: '白いガンダム', zh: '白色高达' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'gquuuuuux-endymion-hg', name: { en: 'GQuuuuuuX (Endymion Unit Awakening)', jp: 'GQuuuuuuX (エンディミオン・ユニット覚醒時)', zh: 'GQuuuuuuX (恩底弥翁单元觉醒时)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },

  // --- 创战 / 创形 ---
  { id: 'hyaku-shiki-crash-mg', name: { en: 'MSN-00100 Hyaku Shiki Crash', jp: 'MSN-00100 百式壊', zh: '百式坏' }, series: { en: 'Gundam Build Divers', jp: 'ガンダムビルドダイバーズ', zh: '高达创形者' }, grade: 'MG' },
  { id: 'gundam-astray-turn-red-mg', name: { en: 'MBF-02VV Gundam Astray Turn Red', jp: 'MBF-02VV ガンダムアストレイ ターンレッド', zh: '异端高达 红龙' }, series: { en: 'Gundam SEED Destiny ASTRAY R', jp: '機動戦士ガンダムSEED DESTINY ASTRAY R', zh: '高达SEED Destiny ASTRAY R' }, grade: 'MG' },

  // ========================================================
  // ==================== 补充：PB限定 & 特殊规格 ====================
  // ========================================================
  { id: 'rg-pb-strike-rouge', name: { en: 'RG Strike Rouge + HG I.W.S.P.', jp: 'RG ストライクルージュ + HG I.W.S.P.', zh: 'RG 嫣红强袭 + HG I.W.S.P.' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'RG' },
  { id: 'mg-pb-marasai-unicorn', name: { en: 'MG Marasai (Unicorn Color Ver.)', jp: 'MG マラサイ (ユニコーンカラーVer.)', zh: 'MG 玛拉赛 (独角兽配色)' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'hguc-pb-aqua-hambrabi', name: { en: 'HGUC Aqua-Hambrabi II (A.O.Z. RE-BOOT Ver.)', jp: 'HGUC アクア・ハンブラビII (A.O.Z. RE-BOOT Ver.)', zh: 'HGUC 水中汉布拉比II (AOZ RE-BOOT版)' }, series: { en: 'Advance of Zeta', jp: 'Advance of Zeta', zh: 'Advance of Zeta (AOZ)' }, grade: 'HG' },
  { id: 'hgce-pb-gyan-strom-hilda', name: { en: 'HGCE Gyan Strom (Hilda Haken Custom)', jp: 'HGCE ギャンシュトローム (ヒルダ・ハーケン専用機)', zh: 'HGCE 强人奔流 (希尔达专用机)' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'HG' },
  { id: 'mg-pb-gundam-dynames-transam', name: { en: 'MG Gundam Dynames (TRANS-AM Mode)', jp: 'MG ガンダムデュナメス (トランザムモード)', zh: 'MG 力天使高达 (Trans-Am模式)' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'MG' },
  { id: 'rg-pb-blast-impulse-spec2', name: { en: 'RG Blast Impulse Gundam Spec II', jp: 'RG ブラストインパルスガンダム Spec II', zh: 'RG 轰击型脉冲高达 Spec II' }, series: { en: 'Gundam SEED Freedom', jp: 'ガンダムSEED FREEDOM', zh: '高达SEED FREEDOM' }, grade: 'RG' },
  { id: 'mg-pb-shin-musha', name: { en: 'MG Shin Musha Gundam (Sengoku no Jin Black Robe Large Armor)', jp: 'MG 真武者頑駄無 (戦国の陣 黒衣大鎧)', zh: 'MG 真武者高达 (战国之阵 黑衣大铠)' }, series: { en: 'SD Sengokuden', jp: 'SD戦国伝', zh: 'SD战国传' }, grade: 'MG' },
  { id: 'mg-pb-astray-noir', name: { en: 'MG Gundam Astray Noir', jp: 'MG ガンダムアストレイ ノワール', zh: 'MG 异端高达 黑色机' }, series: { en: 'Gundam SEED Destiny ASTRAY', jp: '機動戦士ガンダムSEED DESTINY ASTRAY', zh: '高达SEED Destiny ASTRAY' }, grade: 'MG' },

  // --- 近期通贩新品 & 再版精选 (2024-2026) ---
  { id: 'hg-gundam-zagan', name: { en: 'HG Gundam Zagan', jp: 'HG ガンダムザガン', zh: 'HG 高达扎冈' }, series: { en: 'Gundam Build Metaverse', jp: 'ガンダムビルドメタバース', zh: '高达创战元宇宙' }, grade: 'HG' },
  { id: 'hg-alis-aris', name: { en: 'HG Alis Aris', jp: 'HG アリズス', zh: 'HG 阿利宙斯' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },
  { id: 'hg-messer-m01-gauman', name: { en: 'HG Messer M01 Type (Gauman Custom)', jp: 'HG メッサーM01型 (ガウマン専用機)', zh: 'HG 梅萨M01型 (加乌曼专用机)' }, series: { en: "Hathaway's Flash", jp: '閃光のハサウェイ', zh: '闪光的哈萨维' }, grade: 'HG' },
  { id: 'mg-turn-a-2026', name: { en: 'MG Turn A Gundam', jp: 'MG ∀ガンダム', zh: 'MG 倒A高达' }, series: { en: 'Turn A Gundam', jp: '∀ガンダム', zh: '逆A高达' }, grade: 'MG' },
  { id: 'hg-gquuuuuux-char-zaku-gq', name: { en: "HG Char's Zaku (GQ)", jp: 'HG シャア専用ザク(GQ)', zh: 'HG 夏亚专用扎古 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'hg-rick-dom-gaia-ortega-gq', name: { en: 'HG Rick Dom (Gaia/Ortega Custom) (GQ)', jp: 'HG リック・ドム ガイア機/オルテガ機 (GQ)', zh: 'HG 里克·大魔 盖亚机/奥尔迪加机 (GQ)' }, series: { en: 'GQuuuuuuX', jp: '機動戦士Gundam GQuuuuuuX', zh: '机动战士Gundam GQuuuuuuX' }, grade: 'HG' },
  { id: 'mg-wing-gundam-ver-ka', name: { en: 'MG Wing Gundam Ver.Ka', jp: 'MG ウイングガンダム Ver.Ka', zh: 'MG 飞翼高达 Ver.Ka' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'mg-unicorn-ver-ka', name: { en: 'MG Unicorn Gundam Ver.Ka', jp: 'MG ユニコーンガンダム Ver.Ka', zh: 'MG 独角兽高达 Ver.Ka' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'mg-sinanju-ver-ka', name: { en: 'MG Sinanju Ver.Ka', jp: 'MG シナンジュ Ver.Ka', zh: 'MG 新安洲 Ver.Ka' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'mg-v-dash-ver-ka', name: { en: 'MG V-Dash Gundam Ver.Ka', jp: 'MG Vダッシュガンダム Ver.Ka', zh: 'MG V高达突进型 Ver.Ka' }, series: { en: 'Victory Gundam', jp: '機動戦士Vガンダム', zh: '机动战士V高达' }, grade: 'MG' },
  { id: 'mg-full-armor-unicorn-ver-ka', name: { en: 'MG Full Armor Unicorn Gundam Ver.Ka', jp: 'MG フルアーマーユニコーンガンダム Ver.Ka', zh: 'MG 全装甲型独角兽高达 Ver.Ka' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'mg-sinanju-stein-ver-ka', name: { en: 'MG Sinanju Stein Ver.Ka', jp: 'MG シナンジュ・スタイン Ver.Ka', zh: 'MG 新安洲原石型 Ver.Ka' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MG' },
  { id: 'mg-sazabi-ver-ka', name: { en: 'MG Sazabi Ver.Ka', jp: 'MG サザビー Ver.Ka', zh: 'MG 沙扎比 Ver.Ka' }, series: { en: "Char's Counterattack", jp: '逆襲のシャア', zh: '逆袭的夏亚' }, grade: 'MG' },
  { id: 'mg-full-armor-gundam-ver-ka-thunderbolt', name: { en: 'MG Full Armor Gundam Ver.Ka (Thunderbolt Ver.)', jp: 'MG フルアーマー・ガンダム Ver.Ka (サンダーボルト版)', zh: 'MG 全装甲高达 Ver.Ka (雷霆宙域版)' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'MG' },
  { id: 'mg-psycho-zaku-ver-ka-thunderbolt', name: { en: 'MG High Mobility Type Zaku "Psycho Zaku" Ver.Ka (Thunderbolt Ver.)', jp: 'MG 高機動型ザク "サイコ・ザク" Ver.Ka (サンダーボルト版)', zh: 'MG 高机动型扎古“脑波传导型扎古” Ver.Ka (雷霆宙域版)' }, series: { en: 'Thunderbolt', jp: '機動戦士ガンダム サンダーボルト', zh: '雷霆宙域' }, grade: 'MG' },
  { id: 'mg-zz-ver-ka', name: { en: 'MG ZZ Gundam Ver.Ka', jp: 'MG ダブルゼータガンダム Ver.Ka', zh: 'MG ZZ高达 Ver.Ka' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'MG' },
  { id: 'mg-wing-zero-ew-ver-ka', name: { en: 'MG Wing Gundam Zero EW Ver.Ka', jp: 'MG ウイングガンダムゼロEW Ver.Ka', zh: 'MG 飞翼高达零式 EW Ver.Ka' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'mg-narrative-c-ver-ka', name: { en: 'MG Narrative Gundam C-Packs Ver.Ka', jp: 'MG ナラティブガンダム C装備 Ver.Ka', zh: 'MG 叙事高达 C装备 Ver.Ka' }, series: { en: 'Gundam Narrative', jp: '機動戦士ガンダムNT', zh: '机动战士高达NT' }, grade: 'MG' },
  { id: 'mg-gouf-custom', name: { en: 'MG MS-07B3 Gouf Custom', jp: 'MG MS-07B3 グフカスタム', zh: 'MG 老虎特装型' }, series: { en: 'The 08th MS Team', jp: '機動戦士ガンダム第08MS小隊', zh: '机动战士高达 第08MS小队' }, grade: 'MG' },
  { id: 'mgsd-freedom', name: { en: 'MGSD Freedom Gundam', jp: 'MGSD フリーダムガンダム', zh: 'MGSD 自由高达' }, series: { en: 'Gundam SEED', jp: '機動戦士ガンダムSEED', zh: '高达SEED' }, grade: 'MGSD' },
  { id: 'mgsd-wing-zero-ew', name: { en: 'MGSD Wing Gundam Zero EW', jp: 'MGSD ウイングガンダムゼロ EW', zh: 'MGSD 飞翼高达零式 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MGSD' },
  { id: 'mgsd-aerial', name: { en: 'MGSD Gundam Aerial', jp: 'MGSD ガンダムエアリアル', zh: 'MGSD 风灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'MGSD' },
  { id: 'mgsd-destiny', name: { en: 'MGSD Destiny Gundam', jp: 'MGSD デスティニーガンダム', zh: 'MGSD 命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'MGSD' },
  { id: 'mgsd-kshatriya', name: { en: 'MGSD Kshatriya', jp: 'MGSD クシャトリヤ', zh: 'MGSD 刹帝利' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'MGSD' },
  { id: 'pg-strike-freedom', name: { en: 'PG Strike Freedom Gundam', jp: 'PG ストライクフリーダムガンダム', zh: 'PG 强袭自由高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'PG' },
  { id: 'pg-unleashed-rx-78-2', name: { en: 'PG UNLEASHED RX-78-2 Gundam', jp: 'PG UNLEASHED RX-78-2 ガンダム', zh: 'PG UNLEASHED RX-78-2 高达' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'PG' },
  { id: 'rg-zeong', name: { en: 'RG Zeong', jp: 'RG ジオング', zh: 'RG 吉翁号' }, series: { en: 'Mobile Suit Gundam', jp: '機動戦士ガンダム', zh: '机动战士高达' }, grade: 'RG' },
  { id: 'rg-epyon', name: { en: 'RG Gundam Epyon', jp: 'RG ガンダムエピオン', zh: 'RG 艾比安高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'RG' },
  { id: 'rg-god-gundam', name: { en: 'RG God Gundam', jp: 'RG ゴッドガンダム', zh: 'RG 神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'RG' },
  { id: 'hg-god-gundam', name: { en: 'HGFC God Gundam', jp: 'HGFC ゴッドガンダム', zh: 'HGFC 神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hg-shining-gundam', name: { en: 'HGFC Shining Gundam', jp: 'HGFC シャイニングガンダム', zh: 'HGFC 闪光高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hg-master-gundam', name: { en: 'HGFC Master Gundam', jp: 'HGFC マスターガンダム', zh: 'HGFC 尊者高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hg-nobell-gundam', name: { en: 'HGFC Nobel Gundam', jp: 'HGFC ノーベルガンダム', zh: 'HGFC 诺贝尔高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hg-altron-gundam', name: { en: 'HGAC Altron Gundam', jp: 'HGAC アルトロンガンダム', zh: 'HGAC 双头龙高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hg-sandrock-gundam', name: { en: 'HGAC Sandrock Gundam', jp: 'HGAC サンドロックガンダム', zh: 'HGAC 沙漠高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hg-heavyarms-gundam', name: { en: 'HGAC Heavyarms Gundam', jp: 'HGAC ヘビーアームズガンダム', zh: 'HGAC 重装高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hg-deathscythe-gundam', name: { en: 'HGAC Deathscythe Gundam', jp: 'HGAC デスサイズガンダム', zh: 'HGAC 死神高达' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hg-wing-gundam-zero', name: { en: 'HGAC Wing Gundam Zero', jp: 'HGAC ウイングガンダムゼロ', zh: 'HGAC 飞翼高达零式' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hg-tallgeese', name: { en: 'HGAC Tallgeese', jp: 'HGAC トールギス', zh: 'HGAC 多鲁基斯' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hg-leo', name: { en: 'HGAC Leo', jp: 'HGAC リーオー', zh: 'HGAC 里奥' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'mg-epyon', name: { en: 'MG Gundam Epyon EW', jp: 'MG ガンダムエピオン EW', zh: 'MG 艾比安高达 EW' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'MG' },
  { id: 'mg-god-gundam', name: { en: 'MG God Gundam', jp: 'MG ゴッドガンダム', zh: 'MG 神高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'MG' },
  { id: 'mg-shining-gundam', name: { en: 'MG Shining Gundam', jp: 'MG シャイニングガンダム', zh: 'MG 闪光高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'MG' },
  { id: 'mg-master-gundam', name: { en: 'MG Master Gundam', jp: 'MG マスターガンダム', zh: 'MG 尊者高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'MG' },

  // ========================================================
  // ==================== 更多补充机体 (扩充至300+) ====================
  // ========================================================
  // UC 补充
  { id: 'hguc-gm-custom', name: { en: 'RGM-79N GM Custom', jp: 'RGM-79N ジム・カスタム', zh: '吉姆特装型' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'hguc-gp04', name: { en: 'RX-78GP04G Gundam GP04G', jp: 'RX-78GP04G ガンダムGP04G', zh: '高达GP04G' }, series: { en: '0083: Stardust Memory', jp: '機動戦士ガンダム0083', zh: '机动战士高达0083 星尘的回忆' }, grade: 'HG' },
  { id: 'hguc-gundam-mk3', name: { en: 'RX-272 Gundam Mk-III', jp: 'RX-272 ガンダムMk-III', zh: '高达Mk-III' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'hguc-baund-doc', name: { en: 'NRX-055 Baund Doc', jp: 'NRX-055 バウンド・ドック', zh: '猎犬' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'hguc-gaza-c', name: { en: 'AMX-003 Gaza C', jp: 'AMX-003 ガザC', zh: '加撒C' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'hguc-galluss-j', name: { en: 'AMX-101 Galluss-J', jp: 'AMX-101 ガルスJ', zh: '加尔斯J' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'hguc-zssa', name: { en: 'AMX-102 Zssa', jp: 'AMX-102 ズサ', zh: '兹萨' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'hguc-r-jarja', name: { en: 'AMX-104 R-Jarja', jp: 'AMX-104 R・ジャジャ', zh: 'R·贾贾' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'hguc-hamma-hamma', name: { en: 'AMX-004-3 Qubeley Mk-III (Hamma Hamma)', jp: 'AMX-004-3 キュベレイMk-III (ハマーン専用機)', zh: '卡碧尼Mk-III (哈曼专用机)' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'HG' },
  { id: 'hguc-unicorn-banshee-norn-destroy', name: { en: 'RX-0 Unicorn Gundam 02 Banshee Norn (Destroy Mode)', jp: 'RX-0 ユニコーンガンダム2号機 バンシィ・ノルン (デストロイモード)', zh: '报丧女妖·命运女神 (毁灭模式)' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'hguc-sinanju-stein', name: { en: 'MSN-06S-2 Sinanju Stein', jp: 'MSN-06S-2 シナンジュ・スタイン', zh: '新安洲·原石' }, series: { en: 'Gundam Narrative', jp: '機動戦士ガンダムNT', zh: '机动战士高达NT' }, grade: 'HG' },
  { id: 'hguc-narrative-a', name: { en: 'RX-9 Narrative Gundam A-Packs', jp: 'RX-9 ナラティブガンダム A装備', zh: '叙事高达 A装备' }, series: { en: 'Gundam Narrative', jp: '機動戦士ガンダムNT', zh: '机动战士高达NT' }, grade: 'HG' },

  // CE 补充 (SEED)
  { id: 'hgce-dagger-l', name: { en: 'GAT-01A1 Dagger L', jp: 'GAT-01A1 ダガーL', zh: '短剑L' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-windam', name: { en: 'GAT-04 Windam', jp: 'GAT-04 ウィンダム', zh: '温达姆' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-gouf-ignited', name: { en: 'ZGMF-2000 Gouf Ignited', jp: 'ZGMF-2000 グフイグナイテッド', zh: '老虎烈焰' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-zaku-warrior', name: { en: 'ZGMF-1000 Zaku Warrior', jp: 'ZGMF-1000 ザクウォーリア', zh: '扎古勇士' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-gouf-ignited-heine', name: { en: 'ZGMF-2000 Gouf Ignited (Heine Westenfluss Custom)', jp: 'ZGMF-2000 グフイグナイテッド (ハイネ・ヴェステンフルス専用機)', zh: '老虎烈焰 (海涅专用机)' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-blaze-zaku-phantom', name: { en: 'ZGMF-1001/M Blaze Zaku Phantom', jp: 'ZGMF-1001/M ブレイズザクファントム', zh: '烈焰型扎古幻影' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-gaia-gundam', name: { en: 'ZGMF-X88S Gaia Gundam', jp: 'ZGMF-X88S ガイアガンダム', zh: '盖亚高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-chaos-gundam', name: { en: 'ZGMF-X24S Chaos Gundam', jp: 'ZGMF-X24S カオスガンダム', zh: '混沌高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-abyss-gundam', name: { en: 'ZGMF-X31S Abyss Gundam', jp: 'ZGMF-X31S アビスガンダム', zh: '深渊高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-saviour-gundam', name: { en: 'ZGMF-X23S Saviour Gundam', jp: 'ZGMF-X23S セイバーガンダム', zh: '救世主高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-infinity-justice', name: { en: 'ZGMF-X19A Infinite Justice Gundam', jp: 'ZGMF-X19A インフィニットジャスティスガンダム', zh: '无限正义高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'hgce-destiny-gundam', name: { en: 'ZGMF-X42S Destiny Gundam', jp: 'ZGMF-X42S デスティニーガンダム', zh: '命运高达' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },

  // AD 补充 (00)
  { id: 'hg00-gundam-throne-eins', name: { en: 'GNW-001 Gundam Throne Eins', jp: 'GNW-001 ガンダムスローネアイン', zh: '座天使高达一型' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-gundam-throne-zwei', name: { en: 'GNW-002 Gundam Throne Zwei', jp: 'GNW-002 ガンダムスローネツヴァイ', zh: '座天使高达二型' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-gundam-throne-drei', name: { en: 'GNW-003 Gundam Throne Drei', jp: 'GNW-003 ガンダムスローネドライ', zh: '座天使高达三型' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-reborns-gundam', name: { en: 'CB-0000G/C Reborns Gundam', jp: 'CB-0000G/C リボーンズガンダム', zh: '再生高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-susanowo', name: { en: 'GN-001REIII Gundam Exia Repair III (Susanowo)', jp: 'GN-001REIII ガンダムエクシアリペアIII (スサノオ)', zh: '能天使高达修复型III (须佐之男)' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-gundam-sadalsuud', name: { en: 'GN-002 Gundam Dynames (Saga Typ)', jp: 'GN-002 ガンダムデュナメス (サーガタイプ)', zh: '力天使高达 (传说型)' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-gundam-zabanya', name: { en: 'GN-010 Gundam Zabanya', jp: 'GN-010 ガンダムサバーニャ', zh: '狱天使高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'hg00-raphael-gundam', name: { en: 'GN-008RE Seravee Gundam II', jp: 'GN-008RE セラヴィーガンダムII', zh: '炽天使高达II' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'HG' },
  { id: 'rg-00-raiser', name: { en: 'RG 00 Raiser', jp: 'RG ダブルオーライザー', zh: 'RG 00强化模组' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },
  { id: 'rg-00-qant', name: { en: 'RG 00 Qan[T]', jp: 'RG ダブルオークアンタ', zh: 'RG 量子型00高达' }, series: { en: 'Gundam 00', jp: '機動戦士ガンダム00', zh: '机动战士高达00' }, grade: 'RG' },

  // PD 补充 (铁血)
  { id: 'hg-ibo-gundam-gusion', name: { en: 'ASW-G-11 Gundam Gusion', jp: 'ASW-G-11 ガンダム・グシオン', zh: '高达古辛' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-flauros', name: { en: 'ASW-G-64 Gundam Flauros', jp: 'ASW-G-64 ガンダム・フラウロス', zh: '高达佛劳洛斯' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-bael', name: { en: 'ASW-G-01 Gundam Bael', jp: 'ASW-G-01 ガンダム・バエル', zh: '高达巴耶力' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-kimaris-trooper', name: { en: 'ASW-G-66 Gundam Kimaris Trooper', jp: 'ASW-G-66 ガンダム・キマリストルーパー', zh: '高达锡蒙利骑兵型' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-kimaris-vidar', name: { en: 'ASW-G-66 Gundam Kimaris Vidar', jp: 'ASW-G-66 ガンダム・キマリスヴィダール', zh: '高达锡蒙利维达尔' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-vual', name: { en: 'ASW-G-47 Gundam Vual', jp: 'ASW-G-47 ガンダム・ウヴァル', zh: '高达乌瓦尔' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-astaroth', name: { en: 'ASW-G-29 Gundam Astaroth', jp: 'ASW-G-29 ガンダム・アスタロト', zh: '高达阿斯塔罗特' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-dantalion', name: { en: 'ASW-G-71 Gundam Dantalion', jp: 'ASW-G-71 ガンダム・ダンタリオン', zh: '高达但丁利昂' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },
  { id: 'hg-ibo-gundam-gremory', name: { en: 'ASW-G-56 Gundam Gremory', jp: 'ASW-G-56 ガンダム・グレモリー', zh: '高达格莫瑞' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'HG' },

  // AS 补充 (水星)
  { id: 'hg-wfm-demi-trainer', name: { en: 'Demi Trainer', jp: 'デミトレーナー', zh: '戴米训练机' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-zowort', name: { en: 'Zowort', jp: 'ゾウォート', zh: '佐沃特' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-heindree', name: { en: 'Heindree', jp: 'ハインドリー', zh: '海因德里' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-dilanza', name: { en: 'Dilanza', jp: 'ディランザ', zh: '迪兰扎' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-beguir-pente', name: { en: 'Beguir-Pente', jp: 'ベギルペンデ', zh: '贝吉·彭德' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-desultor', name: { en: 'Desultor', jp: 'デスルター', zh: '德斯尔塔' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-gundam-lfrith-thorn', name: { en: 'Gundam Lfrith Thorn', jp: 'ガンダム・ルブリス・ゾーン', zh: '魔灵高达 索恩' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },
  { id: 'hg-wfm-gundam-lfrith-ur', name: { en: 'Gundam Lfrith Ur', jp: 'ガンダム・ルブリス・ウル', zh: '魔灵高达 乌尔' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'HG' },

  // AC 补充 (Wing)
  { id: 'hgac-wing-gundam-zero-tv', name: { en: 'HGAC Wing Gundam Zero (TV Ver.)', jp: 'HGAC ウイングガンダムゼロ (TV版)', zh: 'HGAC 飞翼高达零式 (TV版)' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hgac-tallgeese-iii', name: { en: 'HGAC Tallgeese III', jp: 'HGAC トールギスIII', zh: 'HGAC 多鲁基斯III' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'hgac-gundam-heavyarms-custom', name: { en: 'HGAC Gundam Heavyarms Custom', jp: 'HGAC ガンダムヘビーアームズ改', zh: 'HGAC 重装高达改' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },

  // FC 补充 (G)
  { id: 'hgfc-rising-gundam', name: { en: 'HGFC Rising Gundam', jp: 'HGFC ライジングガンダム', zh: 'HGFC 升腾高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hgfc-gundam-maxter', name: { en: 'HGFC Gundam Maxter', jp: 'HGFC ガンダムマックスター', zh: 'HGFC 麦克之星高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hgfc-dragon-gundam', name: { en: 'HGFC Dragon Gundam', jp: 'HGFC ドラゴンガンダム', zh: 'HGFC 龙高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },
  { id: 'hgfc-bolt-gundam', name: { en: 'HGFC Bolt Gundam', jp: 'HGFC ボルトガンダム', zh: 'HGFC 雷霆高达' }, series: { en: 'G Gundam', jp: '機動武闘伝Gガンダム', zh: '机动武斗传G高达' }, grade: 'HG' },

  // 其他系列及PB
  { id: 'hg-pb-gundam-tr-6-woundwort', name: { en: 'HGUC Gundam TR-6 [Woundwort]', jp: 'HGUC ガンダムTR-6 [ウーンドウォート]', zh: 'HGUC 高达TR-6 [伍德渥特]' }, series: { en: 'Advance of Zeta', jp: 'Advance of Zeta', zh: 'Advance of Zeta (AOZ)' }, grade: 'HG' },
  { id: 'hg-pb-gundam-tr-6-hazel-ii', name: { en: 'HGUC Gundam TR-6 [Hazel II]', jp: 'HGUC ガンダムTR-6 [ヘイズルII]', zh: 'HGUC 高达TR-6 [海兹尔II]' }, series: { en: 'Advance of Zeta', jp: 'Advance of Zeta', zh: 'Advance of Zeta (AOZ)' }, grade: 'HG' },
  { id: 'mg-pb-gundam-tr-1-hazel-owsla', name: { en: 'MG Gundam TR-1 [Hazel Owsla]', jp: 'MG ガンダムTR-1 [ヘイズル・アウスラ]', zh: 'MG 高达TR-1 [海兹尔·奥斯拉]' }, series: { en: 'Advance of Zeta', jp: 'Advance of Zeta', zh: 'Advance of Zeta (AOZ)' }, grade: 'MG' },
  { id: 're-100-nightengale', name: { en: 'RE/100 Nightingale', jp: 'RE/100 ナイチンゲール', zh: 'RE/100 夜莺' }, series: { en: "Char's Counterattack: Beltorchika's Children", jp: '機動戦士ガンダム 逆襲のシャア ベルトーチカ・チルドレン', zh: '机动战士高达 逆袭的夏亚 贝托蒂嘉的子嗣' }, grade: 'RE/100' },
  { id: 're-100-dijeh', name: { en: 'RE/100 Dijeh', jp: 'RE/100 ディジェ', zh: 'RE/100 迪杰' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'RE/100' },
  { id: 're-100-bawoo', name: { en: 'RE/100 Bawoo', jp: 'RE/100 バウ', zh: 'RE/100 龙飞' }, series: { en: 'Gundam ZZ', jp: '機動戦士ガンダムΖΖ', zh: '机动战士高达ZZ' }, grade: 'RE/100' },
  { id: 'fm-gundam-barbatos-lupus-rex', name: { en: 'FM Gundam Barbatos Lupus Rex', jp: 'FM ガンダム・バルバトスルプスレクス', zh: 'FM 高达巴巴托斯天狼座帝王形态' }, series: { en: 'Iron-Blooded Orphans', jp: '鉄血のオルフェンズ', zh: '铁血的奥尔芬斯' }, grade: 'FM' },
  { id: 'fm-gundam-aerial', name: { en: 'FM Gundam Aerial', jp: 'FM ガンダム・エアリアル', zh: 'FM 风灵高达' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'FM' },
  { id: 'fm-gundam-aerial-rebuild', name: { en: 'FM Gundam Aerial Rebuild', jp: 'FM ガンダム・エアリアル(改修型)', zh: 'FM 风灵高达 改修型' }, series: { en: 'The Witch from Mercury', jp: '水星の魔女', zh: '水星的魔女' }, grade: 'FM' },

  // PB & 限定补充
  { id: 'pb-hg-gundam-lob', name: { en: 'HGAC PB Gundam L.O. Booster', jp: 'HGAC PB ガンダムL.O.ブースター', zh: 'HGAC PB 高达L.O.推进器' }, series: { en: 'Gundam Wing', jp: '新機動戦記ガンダムW', zh: '新机动战记高达W' }, grade: 'HG' },
  { id: 'pb-hg-zeta-uc0088', name: { en: 'HGUC PB Zeta Gundam [U.C.0088]', jp: 'HGUC PB ゼータガンダム [U.C.0088]', zh: 'HGUC PB Z高达 [U.C.0088]' }, series: { en: 'Zeta Gundam', jp: '機動戦士Ζガンダム', zh: '机动战士Z高达' }, grade: 'HG' },
  { id: 'pb-hg-windam-neo', name: { en: 'HGCE PB Windam (Neo Roanoke Custom)', jp: 'HGCE PB ウィンダム (ネオ・ロアノーク専用機)', zh: 'HGCE PB 温达姆 (尼奥专用机)' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'HG' },
  { id: 'pb-hg-prototype-stark-jegan', name: { en: 'HGUC PB Prototype Stark Jegan', jp: 'HGUC PB プロトスタークジェガン', zh: 'HGUC PB 原型强袭杰刚' }, series: { en: 'Gundam Unicorn', jp: '機動戦士ガンダムUC', zh: '机动战士高达UC' }, grade: 'HG' },
  { id: 'pb-rg-shiranui-akatsuki', name: { en: 'RG PB Shiranui Pack for Akatsuki Gundam', jp: 'RG PB 不知火装備 for アカツキガンダム', zh: 'RG PB 拂晓高达用不知火背包' }, series: { en: 'Gundam SEED Destiny', jp: '機動戦士ガンダムSEED DESTINY', zh: '高达SEED Destiny' }, grade: 'RG' },
  { id: 'pb-mg-stormbringer-pf', name: { en: 'MG PB Gundam Stormbringer P.F.', jp: 'MG PB ガンダムストームブリンガー P.F.', zh: 'MG PB 风暴使者高达 P.F.' }, series: { en: 'Gundam Build Divers', jp: 'ガンダムビルドダイバーズ', zh: '高达创形者' }, grade: 'MG' },
];

// ==================== 检索逻辑 (纯本地) ====================
export class GunplaSearch {
  private static fuse: Fuse<GunplaItem> | null = null;
  private static data: GunplaItem[] = CORE_DB;

  private static buildIndex(list: GunplaItem[]) {
    this.fuse = new Fuse(list, {
      keys: ['name.en', 'name.jp', 'name.zh', 'series.en', 'series.zh', 'grade'],
      threshold: 0.3,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }

  static async init(): Promise<void> {
    if (!this.fuse) {
      this.buildIndex(this.data);
    }
  }

  static search(query: string): GunplaItem[] {
    if (!query || query.trim().length < 2) return [];
    if (!this.fuse) this.buildIndex(this.data);

    const rawResults = this.fuse!.search(query.trim()).map(r => r.item);

    const gradeOrder = ['EG', 'HG', 'RG', 'MG', 'MGEX', 'MGSD', 'RE/100', 'FM', 'PG'];

    return rawResults.sort((a, b) => {
      const nameCompare = a.name.en.localeCompare(b.name.en);
      if (nameCompare !== 0) return nameCompare;

      const idxGradeA = gradeOrder.indexOf(a.grade.toUpperCase());
      const idxGradeB = gradeOrder.indexOf(b.grade.toUpperCase());
      if (idxGradeA !== idxGradeB) {
        return (idxGradeA === -1 ? 999 : idxGradeA) - (idxGradeB === -1 ? 999 : idxGradeB);
      }

      return a.series.en.localeCompare(b.series.en);
    });
  }
}