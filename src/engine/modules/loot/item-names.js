/** 按稀有度生成装备名称。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { randomInt } from "../core/math.js";
export var ITEM_NAME_PREFIX, ITEM_NAME_SUFFIX, ITEM_NAME_TITLE, ITEM_NAME_PREFIX_SUFFIX, ITEM_NAME_PREFIX_TITLE;
export function CommonItemNames() {
  this.prefixAdjectives = "合意的;充足的;愉快的;适当的;权利的;平均的;忍受的;青铜的;基础的;常规的;普通的;合金的;平凡的;习惯的;正派的;减少的;日常的;精巧的;公平的;良好的;一般的;园艺的;中间的;未完的;钢铁的;可以的;平凡的;温和的;谦虚的;普通的;美好的;平凡的;尚可的;维持的;愉快的;清楚的;古雅的;可敬的;平庸的;规则的;有关的;卓越的;必须的;合理的;日常的;满意的;库存的;简单的;规范的;相配的;适当的;足够的;标准的;耐用的;可以的;变色的;典型的;普通的;平凡的;有益的;惯例的;达标的;兰花的;值得的".split(";");
  this.suffixNouns = "合格 适当 正派 熟悉 瑕疵 常态 重视 整齐 日常 适合 朴素 适用 有效".split(" ");
  this.titlePool = ["平均", "民众", "普通", "人民"];
}
export function HistoricItemNames() {
  this.prefixAdjectives = "受膏的 全能的 天使的 天上的 神圣的 神化的 飘渺的 尊贵的 禁止的 美好的 史诗的 无双的 奇迹的 完美的 不朽的 高贵的 赞美的 凶残的 神奇的 拔群的 正义的 庄严地 圣洁的 透明的 卓越的 超脱的 怪异的 无情的 邪恶的 贞洁的 非常的".split(" ");
  this.suffixNouns = "敬畏 末日 灭绝 灾难 毁坏 屠杀 信仰 自由 财富 虚幻 浩劫 天堂 不朽 拯救 星尘 复仇 英勇".split(" ");
  this.titlePool = "岁月;远古;天启;鲁莽;全能;有福;神选;灾难;忘却;禁止;神明;女神;屠杀;迷雾;月色;月光;苍月;纯净;正义;天空;太阳;星辰;神道;暗影;星光;无畏;无惧;无双;贤惠;冷风".split(";");
}
export function RareItemNames() {
  this.prefixAdjectives = "可怕的;惊人的;诧异的;美丽的;神佑的;经典的;优雅的;精致的;奢侈的;非凡的;卓越的;完美的;凶猛的;可怕的;金典的;光荣的;高级的;出名的;高档的;可爱的;豪华的;神秘的;高贵的;华丽的;珍贵的;完善的;最初的;额外的;卓越的;精粹的;稀有的;单一的;生命的;显著地;轰动的;至高的;无上的;精彩的".split(";");
  this.suffixNouns = "惊愕;恐惧;爆炸;轻松;附击;附伤;火焰;霜冻;烈焰;残暴;迷恋;噩梦;荣耀;魔力;炫目;伟大;幸福;冰块;玩笑;惩罚;纯洁;希望;完美;恐怖;折磨;奇迹;惊叹".split(";");
  this.titlePool = "深渊 黎明 大地 畏惧 无谓 遗忘 强硬 勇敢 衰弱 英勇".split(" ");
}
export function UncommonItemNames() {
  this.prefixAdjectives = "可敬的;平衡的;合金的;选择的;很好的;合意的;特色的;精巧的;幻想的;稳固的;一流的;超流的;残忍的;强大的;良好的;英勇的;坚硬的;沉重的;英俊的;诚实的;敏锐的;品牌的;非凡的;抛光的;领袖的;可贵的;素质的;文雅的;卓越的;皇家的;光泽的;金属的;严厉的;选择的;特殊的;结实的;炫耀的;坚定的;优胜的;锐利的;雅致的;顶尖的;罕见的;健康的".split(";");
  this.suffixNouns = "冒险 勇敢 胆量 信任 决心 破坏 恐惧 惊骇 霜冻 友谊 预兆 沉闷 强烈 公正 敏锐 复仇 坚持 毅力 平静 预言 刺骨 疼痛 欢笑 勇气 恶意 明星 精神 胜利 暴力 伤害".split(" ");
  this.titlePool = "大胆 英勇 起泡 勇敢 大胆 注定 华丽 无畏 黑暗 沉醉 公正 大量 虐待 侵略 徒劳 征服 自愿".split(" ");
}
export function AncientItemNames() {
  this.prefixAdjectives = "惊骇的;非典的;灿烂的;定制的;狡猾的;聪明的;勇敢的;大胆的;特色的;独家的;天才的;史诗的;手工的;无双的;孤独的;残忍的;奇迹的;独特的;绝伦的;正义的;聪慧的;特殊的;奇异的;邪恶的;勇敢的;徒劳的".split(";");
  this.suffixAdjectives = "绝对 诧异 勇敢 独裁 非凡 先天 惊人 陶醉 失真 巨大 神秘 完美 卓越 精粹 超级 合计 奇迹 神话 独步 无敌 无尽 超常 空前 无比 无双 危难 超脱".split(" ");
  this.suffixNouns = "看法 冒险 勇气 信任 冷静 毁灭 荒废 效能 凶猛 荣誉 魅力 伟大 紧张 权利 完美 坚持 毅力 品质 柔滑 风格 精神 胜利 暴力 奇迹".split(" ");
  this.titlePool = ["专家"];
}
export function ItemNameGenerator() {
  this.commonNames = new CommonItemNames();
  this.uncommonNames = new UncommonItemNames();
  this.rareNames = new RareItemNames();
  this.historicNames = new HistoricItemNames();
  this.ancientNames = new AncientItemNames();
}
export function formatItemName(a, b) {
  switch (b.pickNameFormat()) {
    case 0:
      return a;
    case ITEM_NAME_PREFIX:
      return b.randomPrefix() + "" + a;
    case ITEM_NAME_SUFFIX:
      return b.randomSuffix() + "之" + a;
    case ITEM_NAME_TITLE:
      return b.randomTitle() + "之" + a;
    case ITEM_NAME_PREFIX_SUFFIX:
      return b.randomSuffix() + "之" + b.randomPrefix() + a;
    case ITEM_NAME_PREFIX_TITLE:
      return b.randomTitle() + "之" + b.randomPrefix() + a;
    default:
      return a;
  }
}
export function initializeLootItemNames() {
  CommonItemNames.prototype.pickNameFormat = function () {
    var a = Math.random();
    return 0.3 > a ? ITEM_NAME_PREFIX : 0.6 > a ? 0.5 > Math.random() ? ITEM_NAME_SUFFIX : ITEM_NAME_TITLE : 0.5 > Math.random() ? ITEM_NAME_PREFIX_SUFFIX : ITEM_NAME_PREFIX_TITLE;
  };
  CommonItemNames.prototype.randomPrefix = function () {
    return this.prefixAdjectives[randomInt(this.prefixAdjectives.length)];
  };
  CommonItemNames.prototype.randomSuffix = function () {
    return this.suffixNouns[randomInt(this.suffixNouns.length)];
  };
  CommonItemNames.prototype.randomTitle = function () {
    return this.titlePool[randomInt(this.titlePool.length)];
  };
  HistoricItemNames.prototype.pickNameFormat = function () {
    var a = Math.random();
    return 0.25 > a ? ITEM_NAME_PREFIX : 0.5 > a ? 0.5 > Math.random() ? ITEM_NAME_SUFFIX : ITEM_NAME_TITLE : 0.5 > Math.random() ? ITEM_NAME_PREFIX_SUFFIX : ITEM_NAME_PREFIX_TITLE;
  };
  HistoricItemNames.prototype.randomPrefix = function () {
    return this.prefixAdjectives[randomInt(this.prefixAdjectives.length)];
  };
  HistoricItemNames.prototype.randomSuffix = function () {
    return this.suffixNouns[randomInt(this.suffixNouns.length)];
  };
  HistoricItemNames.prototype.randomTitle = function () {
    return this.titlePool[randomInt(this.titlePool.length)];
  };
  RareItemNames.prototype.pickNameFormat = function () {
    var a = Math.random();
    return 0.25 > a ? ITEM_NAME_PREFIX : 0.5 > a ? 0.5 > Math.random() ? ITEM_NAME_SUFFIX : ITEM_NAME_TITLE : 0.5 > Math.random() ? ITEM_NAME_PREFIX_SUFFIX : ITEM_NAME_PREFIX_TITLE;
  };
  RareItemNames.prototype.randomPrefix = function () {
    return this.prefixAdjectives[randomInt(this.prefixAdjectives.length)];
  };
  RareItemNames.prototype.randomSuffix = function () {
    return this.suffixNouns[randomInt(this.suffixNouns.length)];
  };
  RareItemNames.prototype.randomTitle = function () {
    return this.titlePool[randomInt(this.titlePool.length)];
  };
  UncommonItemNames.prototype.pickNameFormat = function () {
    var a = Math.random();
    return 0.3 > a ? ITEM_NAME_PREFIX : 0.5 > a ? 0.5 > Math.random() ? ITEM_NAME_SUFFIX : ITEM_NAME_TITLE : 0.5 > Math.random() ? ITEM_NAME_PREFIX_SUFFIX : ITEM_NAME_PREFIX_TITLE;
  };
  UncommonItemNames.prototype.randomPrefix = function () {
    return this.prefixAdjectives[randomInt(this.prefixAdjectives.length)];
  };
  UncommonItemNames.prototype.randomSuffix = function () {
    return this.suffixNouns[randomInt(this.suffixNouns.length)];
  };
  UncommonItemNames.prototype.randomTitle = function () {
    return this.titlePool[randomInt(this.titlePool.length)];
  };
  AncientItemNames.prototype.pickNameFormat = function () {
    return ITEM_NAME_PREFIX_SUFFIX;
  };
  AncientItemNames.prototype.randomPrefix = function () {
    return this.prefixAdjectives[randomInt(this.prefixAdjectives.length)];
  };
  AncientItemNames.prototype.randomSuffix = function () {
    return this.suffixAdjectives[randomInt(this.suffixAdjectives.length)] + "" + this.suffixNouns[randomInt(this.suffixNouns.length)];
  };
  AncientItemNames.prototype.randomTitle = function () {
    return this.titlePool[randomInt(this.titlePool.length)];
  };
  ITEM_NAME_PREFIX = 1;
  ITEM_NAME_SUFFIX = 2;
  ITEM_NAME_TITLE = 3;
  ITEM_NAME_PREFIX_SUFFIX = 4;
  ITEM_NAME_PREFIX_TITLE = 5;
}
