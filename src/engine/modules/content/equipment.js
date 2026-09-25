/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { game } from "../runtime/game.js";
import { registerItemType } from "../loot/items.js";
export function initializeItemCatalog() {
  var b = game.itemGenerator;
  b.os = {};
  b.ps = {};
  var c = {
      fa: "剑",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["20"]
    },
    d = {
      fa: "斧",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["21"]
    },
    f = {
      fa: "锤",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["21"]
    },
    g = {
      fa: "匕首",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["24", "33"]
    },
    h = {
      fa: "连枷",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["22", "20", "21"]
    },
    l = {
      fa: "权杖",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["22", "20"]
    },
    n = {
      fa: "节杖",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["32"]
    },
    p = {
      fa: "双节棍",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["29"]
    },
    s = {
      fa: "棍棒",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["26", "27", "28", "31"]
    },
    u = {
      fa: "镰刀",
      na: true,
      oa: false,
      ma: false,
      la: false,
      Z: ["30"]
    },
    y = {
      fa: "骨头",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["201"]
    },
    A = {
      fa: "蜡烛",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["203"]
    },
    C = {
      fa: "灯笼",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["203"]
    },
    v = {
      fa: "灯",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["203"]
    },
    D = {
      fa: "硬币",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["205"]
    },
    N = {
      fa: "珠宝",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["205"]
    },
    I = {
      fa: "弓",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["23"]
    },
    x = {
      fa: "弩",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["25"]
    },
    z = {
      fa: "箭矢",
      na: false,
      oa: true,
      ma: false,
      la: false,
      Xn: 1,
      Z: ["60"]
    },
    O = {
      fa: "闪电",
      na: false,
      oa: true,
      ma: false,
      la: false,
      Xn: 2,
      Z: ["61"]
    },
    J = {
      fa: "护盾",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["40", "41"]
    },
    la = {
      fa: "链甲",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["80", "82", "81"]
    },
    Q = {
      fa: "板甲",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["80", "81"]
    },
    V = {
      fa: "板甲",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["80", "82", "81"]
    },
    na = {
      fa: "皮甲",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["84", "83"]
    },
    K = {
      fa: "项链",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: "140 141 142 143 145 144".split(" ")
    },
    H = {
      fa: "戒指",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: "160 161 162 163 164 165".split(" ")
    },
    S = {
      fa: "符号",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["200"]
    },
    da = {
      fa: "蘑菇",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["202", "204"]
    },
    W = {
      fa: "头盔",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["120"]
    },
    ia = {
      fa: "王冠",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["125"]
    },
    ea = {
      fa: "巫师帽",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["121", "122", "123", "124"]
    },
    va = {
      fa: "手套",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["100", "101", "102"]
    },
    yb = {
      fa: "长手套",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["101", "102"]
    },
    Fb = {
      fa: "长袍",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["85", "86", "87", "89", "91"]
    },
    pa = {
      fa: "斗篷",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: "85 86 87 88 90 92".split(" ")
    },
    T = {
      fa: "魔杖",
      na: false,
      oa: false,
      ma: false,
      la: true,
      Z: ["26"]
    },
    X = {
      fa: "靴子",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: "181 185 182 183 184 180 186".split(" ")
    },
    Ca = {
      fa: "腰带",
      na: false,
      oa: false,
      ma: true,
      la: false,
      Z: ["3", "4", "5", "6", "7"]
    };
  registerItemType(b, la, "ArmorChainMailRusty.PNG");
  registerItemType(b, la, "ArmorChainMail.PNG");
  registerItemType(b, la, "ArmorChainMailAugmented.PNG");
  registerItemType(b, la, "ArmorChainMailBar.PNG");
  registerItemType(b, la, "ArmorChainmailGolden.PNG");
  registerItemType(b, la, "ArmorChainmailGreen.PNG");
  registerItemType(b, la, "ArmorChainmailMithril.PNG");
  registerItemType(b, V, "ArmorLeatherScaleMail.PNG");
  registerItemType(b, V, "ArmorMetalScaleMail.PNG");
  registerItemType(b, V, "ArmorScalemailDragonGrey.PNG");
  registerItemType(b, V, "ArmorScalemailDragonDarkGrey.PNG");
  registerItemType(b, V, "ArmorScalemailDragonWhite.PNG");
  registerItemType(b, V, "ArmorScalemailDragonBlue.PNG");
  registerItemType(b, V, "ArmorScalemailDragonBronze.PNG");
  registerItemType(b, V, "ArmorScalemailDragonGolden.PNG");
  registerItemType(b, V, "ArmorScalemailDragonGreen.PNG");
  registerItemType(b, V, "ArmorScalemailDragonLightBlue.PNG");
  registerItemType(b, V, "ArmorScalemailDragonPurple.PNG");
  registerItemType(b, V, "ArmorScalemailDragonRed.PNG");
  registerItemType(b, V, "ArmorScalemailDragonYellow.PNG");
  registerItemType(b, V, "ArmorScalemailDragonRainbow.PNG");
  registerItemType(b, V, "ArmorScalemailDragonHellfire.PNG");
  registerItemType(b, Q, "ArmorPlatemailPartial.PNG");
  registerItemType(b, Q, "ArmorPlatemailFull.PNG");
  registerItemType(b, Q, "ArmorPlatemailRibbed.PNG");
  registerItemType(b, Q, "ArmorPlatemailEnhancedSteel.PNG");
  registerItemType(b, Q, "ArmorPlatemailEnhancedBrown.PNG");
  registerItemType(b, Q, "ArmorPlatemailEnhancedPurple.PNG");
  registerItemType(b, Q, "ArmorPlatemailEnhancedBlue.PNG");
  registerItemType(b, Q, "ArmorPlatemailEnhancedGreen.PNG");
  registerItemType(b, Q, "ArmorPlatemailEnhancedYellow.PNG");
  registerItemType(b, Q, "ArmorPlatemailStuddedGolden.PNG");
  registerItemType(b, Q, "ArmorPlatemailStuddedGreen.PNG");
  registerItemType(b, Q, "ArmorPlatemailMithril.PNG");
  registerItemType(b, Q, "ArmorPlatemailAdamantite.PNG");
  registerItemType(b, na, "ArmorLeatherSoft.PNG");
  registerItemType(b, na, "ArmorLeatherHard.PNG");
  registerItemType(b, na, "ArmorLeatherScaleMail.PNG");
  registerItemType(b, na, "ArmorLeatherHardStudded.PNG");
  registerItemType(b, na, "ArmorLeatherSoftStudded.PNG");
  registerItemType(b, c, "Sword01.PNG");
  registerItemType(b, c, "Sword02.PNG");
  registerItemType(b, c, "Sword03.PNG");
  registerItemType(b, c, "Sword04.PNG");
  registerItemType(b, c, "Sword05.PNG");
  registerItemType(b, c, "Sword06.PNG");
  registerItemType(b, c, "Sword07.PNG");
  registerItemType(b, c, "Sword08.PNG");
  registerItemType(b, c, "Sword09.PNG");
  registerItemType(b, c, "Sword10.PNG");
  registerItemType(b, c, "Sword11.PNG");
  registerItemType(b, c, "Sword12.PNG");
  registerItemType(b, c, "Sword13.PNG");
  registerItemType(b, c, "Sword14.PNG");
  registerItemType(b, c, "Sword15.PNG");
  registerItemType(b, c, "Sword16.PNG");
  registerItemType(b, c, "Sword17.PNG");
  registerItemType(b, c, "Sword18.PNG");
  registerItemType(b, c, "Sword19.PNG");
  registerItemType(b, c, "Sword20.PNG");
  registerItemType(b, c, "Sword21.PNG");
  registerItemType(b, c, "Sword22.PNG");
  registerItemType(b, c, "Sword23.PNG");
  registerItemType(b, c, "Sword24.PNG");
  registerItemType(b, c, "Sword25.PNG");
  registerItemType(b, c, "Sword26.PNG");
  registerItemType(b, c, "Sword27.PNG");
  registerItemType(b, c, "Sword28.PNG");
  registerItemType(b, c, "SwordFlaming.PNG");
  registerItemType(b, c, "SwordMagical.PNG");
  registerItemType(b, c, "SwordMedievalMagical.PNG");
  registerItemType(b, J, "ShieldWoodLarge.PNG");
  registerItemType(b, J, "ShieldWoodSmall.PNG");
  registerItemType(b, J, "ShieldWoodenRound.PNG");
  registerItemType(b, J, "ShieldSmallSteel.PNG");
  registerItemType(b, J, "ShieldSteelRoundLarge.PNG");
  registerItemType(b, J, "ShieldTriangular.PNG");
  registerItemType(b, J, "ShieldKiteRed.PNG");
  registerItemType(b, J, "Knight_Shield.PNG");
  registerItemType(b, J, "ShieldCrossed.PNG");
  registerItemType(b, J, "ShieldCrossRed.PNG");
  registerItemType(b, J, "DarkLord_Shield.PNG");
  registerItemType(b, J, "ShieldFourColoredBlueYellow.PNG");
  registerItemType(b, J, "ShieldFourColoredRedYellow.PNG");
  registerItemType(b, J, "ShieldFourColoredSilverYellow.PNG");
  registerItemType(b, J, "ShieldStripeRed.PNG");
  registerItemType(b, J, "ShieldColored1.PNG");
  registerItemType(b, J, "Valors_Shield.PNG");
  registerItemType(b, J, "DefenderShield01.PNG");
  registerItemType(b, J, "ShieldCrestedCrown.PNG");
  registerItemType(b, J, "ShieldCrestedGolden.PNG");
  registerItemType(b, J, "ShieldCrestedLion.PNG");
  registerItemType(b, J, "ShieldCrestedLion2.PNG");
  registerItemType(b, J, "ShieldCrestedSkull.PNG");
  registerItemType(b, J, "ShieldCrestedUnicorn.PNG");
  registerItemType(b, J, "ShieldCrestedUnicorn2.PNG");
  registerItemType(b, l, "Mace.PNG");
  registerItemType(b, l, "MaceWood.PNG");
  registerItemType(b, l, "Mace01.PNG");
  registerItemType(b, l, "Mace02.PNG");
  registerItemType(b, l, "Mace03.PNG");
  registerItemType(b, l, "Mace04.PNG");
  registerItemType(b, l, "Mace05.PNG");
  registerItemType(b, l, "Mace06.PNG");
  registerItemType(b, l, "Mace07.PNG");
  registerItemType(b, l, "Mace08.PNG");
  registerItemType(b, l, "MaceWar.PNG");
  registerItemType(b, l, "MaceGolden.PNG");
  registerItemType(b, l, "MaceMagic.PNG");
  registerItemType(b, h, "Flail01.PNG");
  registerItemType(b, h, "Flail02.PNG");
  registerItemType(b, h, "Flail03.PNG");
  registerItemType(b, h, "Flail04.PNG");
  registerItemType(b, h, "FlailSteel.PNG");
  registerItemType(b, h, "FlailTwoHanded.PNG");
  registerItemType(b, h, "FlailWood.PNG");
  registerItemType(b, h, "Flail05.PNG");
  registerItemType(b, h, "Flail06.PNG");
  registerItemType(b, h, "Flail07.PNG");
  registerItemType(b, h, "DoubleFlail01.PNG");
  registerItemType(b, h, "DoubleFlail02.PNG");
  registerItemType(b, h, "DoubleFlail03.PNG");
  registerItemType(b, d, "AxeBeaked.PNG");
  registerItemType(b, d, "AxeGlaive.PNG");
  registerItemType(b, d, "Axe01.PNG");
  registerItemType(b, d, "Axe02.PNG");
  registerItemType(b, d, "Axe03.PNG");
  registerItemType(b, d, "Axe04.PNG");
  registerItemType(b, d, "Axe05.PNG");
  registerItemType(b, d, "Axe06.PNG");
  registerItemType(b, d, "Axe07.PNG");
  registerItemType(b, d, "Axe08.PNG");
  registerItemType(b, d, "Axe09.PNG");
  registerItemType(b, d, "Axe10.PNG");
  registerItemType(b, d, "Axe11.PNG");
  registerItemType(b, d, "Axe12.PNG");
  registerItemType(b, d, "Axe13.PNG");
  registerItemType(b, d, "Axe14.PNG");
  registerItemType(b, d, "AxeBattle.PNG");
  registerItemType(b, d, "AxeBroad.PNG");
  registerItemType(b, d, "AxeGolden.PNG");
  registerItemType(b, d, "AxeGreat.PNG");
  registerItemType(b, d, "AxeLochaber.PNG");
  registerItemType(b, f, "Ahammer1.PNG");
  registerItemType(b, f, "Hammer01.PNG");
  registerItemType(b, f, "Hammer02.PNG");
  registerItemType(b, f, "Hammer03.PNG");
  registerItemType(b, f, "Hammer04.PNG");
  registerItemType(b, f, "Hammer05.PNG");
  registerItemType(b, f, "HammerGiant.PNG");
  registerItemType(b, f, "HammerGolden.PNG");
  registerItemType(b, f, "HammerLucerne.PNG");
  registerItemType(b, f, "HammerWar.PNG");
  registerItemType(b, g, "Dagger.PNG");
  registerItemType(b, g, "Dagger01.PNG");
  registerItemType(b, g, "Dagger02.PNG");
  registerItemType(b, g, "Dagger03.PNG");
  registerItemType(b, g, "Dagger04.PNG");
  registerItemType(b, g, "Dagger05.PNG");
  registerItemType(b, g, "Dagger06.PNG");
  registerItemType(b, g, "Dagger07.PNG");
  registerItemType(b, g, "Dagger08.PNG");
  registerItemType(b, g, "Dagger09.PNG");
  registerItemType(b, g, "Dagger10.PNG");
  registerItemType(b, g, "DaggerGauche.PNG");
  registerItemType(b, p, "Nunchaku.PNG");
  registerItemType(b, p, "NunchakuGolden.PNG");
  registerItemType(b, n, "Scepter01.PNG");
  registerItemType(b, n, "Scepter02.PNG");
  registerItemType(b, n, "Scepter03.PNG");
  registerItemType(b, n, "Scepter04.PNG");
  registerItemType(b, n, "Scepter05.PNG");
  registerItemType(b, n, "Scepter06.PNG");
  registerItemType(b, n, "Scepter07.PNG");
  registerItemType(b, n, "Scepter08.PNG");
  registerItemType(b, n, "Scepter09.PNG");
  registerItemType(b, n, "Scepter10.PNG");
  registerItemType(b, n, "Scepter11.PNG");
  registerItemType(b, n, "Scepter12.PNG");
  registerItemType(b, n, "Scepter13.PNG");
  registerItemType(b, n, "Scepter14.PNG");
  registerItemType(b, n, "Scepter15.PNG");
  registerItemType(b, n, "Scepter16.PNG");
  registerItemType(b, n, "Scepter17.PNG");
  registerItemType(b, n, "Scepter18.PNG");
  registerItemType(b, u, "Scythe01.PNG");
  registerItemType(b, u, "Scythe02.PNG");
  registerItemType(b, u, "ScytheSteel.PNG");
  registerItemType(b, u, "ScytheWood.PNG");
  registerItemType(b, s, "Staff01.PNG");
  registerItemType(b, s, "Staff02.PNG");
  registerItemType(b, s, "Staff03.PNG");
  registerItemType(b, s, "Staff04.PNG");
  registerItemType(b, s, "Staff05.PNG");
  registerItemType(b, s, "Staff06.PNG");
  registerItemType(b, s, "Staff07.PNG");
  registerItemType(b, s, "Staff08.PNG");
  registerItemType(b, s, "Staff09.PNG");
  registerItemType(b, s, "Staff10.PNG");
  registerItemType(b, s, "Staff11.PNG");
  registerItemType(b, s, "Staff12.PNG");
  registerItemType(b, s, "Staff13.PNG");
  registerItemType(b, s, "Staff14.PNG");
  registerItemType(b, s, "Staff15.PNG");
  registerItemType(b, s, "Staff16.PNG");
  registerItemType(b, s, "Staff17.PNG");
  registerItemType(b, s, "Staff18.PNG");
  registerItemType(b, s, "Staff19.PNG");
  registerItemType(b, s, "Staff20.PNG");
  registerItemType(b, s, "Staff21.PNG");
  registerItemType(b, s, "Staff22.PNG");
  registerItemType(b, s, "Staff23.PNG");
  registerItemType(b, s, "StaffBronze.PNG");
  registerItemType(b, s, "StaffDarkYellow.PNG");
  registerItemType(b, s, "StaffGold.PNG");
  registerItemType(b, s, "StaffGoldScales.PNG");
  registerItemType(b, s, "StaffGoldStriped.PNG");
  registerItemType(b, s, "StaffRedStriped.PNG");
  registerItemType(b, s, "StaffSilver.PNG");
  registerItemType(b, y, "SkeletonBrokenBone.PNG");
  registerItemType(b, y, "SkeletonDog.PNG");
  registerItemType(b, y, "SkeletonHumanSmall.PNG");
  registerItemType(b, y, "SkeletonRat.PNG");
  registerItemType(b, y, "SkeletonSkull.PNG");
  registerItemType(b, A, "CandleStand1.PNG");
  registerItemType(b, A, "CandleStand2.PNG");
  registerItemType(b, C, "Lantern.PNG");
  registerItemType(b, C, "LanternBronze.PNG");
  registerItemType(b, {
    fa: "火炬",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["203"]
  }, "Torch.PNG");
  registerItemType(b, v, "LightChalice.PNG");
  registerItemType(b, v, "LightOrb.PNG");
  registerItemType(b, v, "LightStar.PNG");
  registerItemType(b, D, "CoinsBronze.PNG");
  registerItemType(b, D, "CoinsGold.PNG");
  registerItemType(b, D, "CoinsGoldLarge.PNG");
  registerItemType(b, D, "CoinsGoldMedium.PNG");
  registerItemType(b, D, "CoinsGoldSmall.PNG");
  registerItemType(b, D, "CoinsGreen.PNG");
  registerItemType(b, D, "CoinsSilver.PNG");
  registerItemType(b, D, "CoinsTeal.PNG");
  registerItemType(b, N, "Jewels.PNG");
  registerItemType(b, N, "JewelsBlue.PNG");
  registerItemType(b, N, "JewelsRed.PNG");
  registerItemType(b, I, "BowShort.PNG");
  registerItemType(b, I, "Bow01.PNG");
  registerItemType(b, I, "Bow02.PNG");
  registerItemType(b, I, "Bow03.PNG");
  registerItemType(b, I, "Bow04.PNG");
  registerItemType(b, I, "Bow05.PNG");
  registerItemType(b, I, "Bow06.PNG");
  registerItemType(b, I, "Bow07.PNG");
  registerItemType(b, I, "Bow08.PNG");
  registerItemType(b, I, "Bow09.PNG");
  registerItemType(b, I, "Bow10.PNG");
  registerItemType(b, I, "BowLong.PNG");
  registerItemType(b, x, "Xbow01.PNG");
  registerItemType(b, x, "Xbow02.PNG");
  registerItemType(b, x, "Xbow03.PNG");
  registerItemType(b, x, "Xbow04.PNG");
  registerItemType(b, x, "Xbow05.PNG");
  registerItemType(b, x, "Xbow06.PNG");
  registerItemType(b, x, "Crossbow2.PNG");
  registerItemType(b, x, "CrossbowHeavy.PNG");
  registerItemType(b, x, "CrossbowLight.PNG");
  registerItemType(b, z, "ArrowWood.PNG");
  registerItemType(b, z, "ArrowSteel.PNG");
  registerItemType(b, z, "ArrowGolden.PNG");
  registerItemType(b, z, "ArrowSilver.PNG");
  registerItemType(b, z, "ArrowFlaming.PNG");
  registerItemType(b, z, "ArrowFlaming2.PNG");
  registerItemType(b, z, "ArrowMagicBlue.PNG");
  registerItemType(b, z, "ArrowMagicPurple.PNG");
  registerItemType(b, z, "ArrowPoisoned1.PNG");
  registerItemType(b, z, "ArrowPoisoned2.PNG");
  registerItemType(b, z, "ArrowPoisoned3.PNG");
  registerItemType(b, z, "ArrowPoisoned4.PNG");
  registerItemType(b, O, "BoltSteel.PNG");
  registerItemType(b, O, "BoltSilver.PNG");
  registerItemType(b, O, "BoltFlaming.PNG");
  registerItemType(b, O, "BoltFlaming2.PNG");
  registerItemType(b, O, "BoltGolden.PNG");
  registerItemType(b, O, "BoltMagicGreen.PNG");
  registerItemType(b, O, "BoltMagicRed.PNG");
  registerItemType(b, O, "BoltPoisoned.PNG");
  registerItemType(b, O, "BoltPoisoned2.PNG");
  registerItemType(b, O, "BoltPoisoned3.PNG");
  registerItemType(b, O, "BoltPoisoned4.PNG");
  registerItemType(b, O, "BoltWood.PNG");
  registerItemType(b, {
    fa: "星星",
    na: false,
    oa: true,
    ma: false,
    la: false,
    Xn: 3,
    Z: ["62"]
  }, "ThrowingStar.PNG");
  registerItemType(b, K, "NecklaceJewelSilver5.PNG");
  registerItemType(b, K, "NecklaceSilverJewelGreen.PNG");
  registerItemType(b, K, "NecklaceSilverJewelOrange.PNG");
  registerItemType(b, K, "NecklaceBronzeJewelRed.PNG");
  registerItemType(b, K, "NecklaceGoldJewelBlue.PNG");
  registerItemType(b, K, "NecklaceGoldJewelGreen.PNG");
  registerItemType(b, K, "NecklaceGoldJewelSilver.PNG");
  registerItemType(b, K, "NecklaceGoldJewelSilver2.PNG");
  registerItemType(b, K, "NecklaceJewelBlue.PNG");
  registerItemType(b, K, "NecklaceJewelRed.PNG");
  registerItemType(b, K, "NecklaceJewelRed2.PNG");
  registerItemType(b, K, "NecklaceJewelRed3.PNG");
  registerItemType(b, K, "NecklaceJewelSilver.PNG");
  registerItemType(b, K, "NecklaceJewelSilver2.PNG");
  registerItemType(b, K, "NecklaceJewelSilver3.PNG");
  registerItemType(b, K, "NecklaceJewelSilver4.PNG");
  registerItemType(b, H, "RingBronze.PNG");
  registerItemType(b, H, "RingGold.PNG");
  registerItemType(b, H, "RingGoldJeweledBlue.PNG");
  registerItemType(b, H, "RingGoldJeweledRed.PNG");
  registerItemType(b, H, "RingGoldJeweledYellowMagic.PNG");
  registerItemType(b, H, "RingGoldMagic.PNG");
  registerItemType(b, H, "RingJewelBlack.PNG");
  registerItemType(b, H, "RingJewelBlue.PNG");
  registerItemType(b, H, "RingJeweledRed2.PNG");
  registerItemType(b, H, "RingJewelGreen.PNG");
  registerItemType(b, H, "RingJewelOrange.PNG");
  registerItemType(b, H, "RingJewelPurple.PNG");
  registerItemType(b, H, "RingJewelRed.PNG");
  registerItemType(b, H, "RingPlainGrey.PNG");
  registerItemType(b, H, "RingPlainSilver.PNG");
  registerItemType(b, H, "RingPurple.PNG");
  registerItemType(b, H, "RingSilverJeweledBlueMagic.PNG");
  registerItemType(b, H, "RingSilverJeweledGreen.PNG");
  registerItemType(b, H, "RingSilverJeweledGreenMagic.PNG");
  registerItemType(b, H, "RingSilverJeweledMagenta.PNG");
  registerItemType(b, H, "RingSilverJeweledPurple.PNG");
  registerItemType(b, H, "RingSilverJeweledRedMagic.PNG");
  registerItemType(b, H, "RingSilverJeweledSilver.PNG");
  registerItemType(b, H, "RingSilverJeweledSilver2.PNG");
  registerItemType(b, S, "GlyphGreen.PNG");
  registerItemType(b, S, "GlyphRed.PNG");
  registerItemType(b, S, "GlyphYellow.PNG");
  registerItemType(b, {
    fa: "面包",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["204"]
  }, "FoodBread.PNG");
  registerItemType(b, {
    fa: "啤酒",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["204"]
  }, "FoodAle.PNG");
  registerItemType(b, {
    fa: "鸡腿",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["204"]
  }, "FoodDrumstick.PNG");
  registerItemType(b, {
    fa: "火腿",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["204"]
  }, "FoodShank.PNG");
  registerItemType(b, da, "FoodMushroomBlack.PNG");
  registerItemType(b, da, "FoodMushroomBlue.PNG");
  registerItemType(b, da, "FoodMushroomBrown.PNG");
  registerItemType(b, da, "FoodMushroomGreen.PNG");
  registerItemType(b, da, "FoodMushroomGreen2.PNG");
  registerItemType(b, da, "FoodMushroomGrey.PNG");
  registerItemType(b, da, "FoodMushroomGrey2.PNG");
  registerItemType(b, da, "FoodMushroomOrange.PNG");
  registerItemType(b, da, "FoodMushroomPurple.PNG");
  registerItemType(b, da, "FoodMushroomRed.PNG");
  registerItemType(b, da, "FoodMushroomRed2.PNG");
  registerItemType(b, da, "FoodMushroomSilver.PNG");
  registerItemType(b, da, "FoodMushroomTan.PNG");
  registerItemType(b, da, "FoodMushroomTeal.PNG");
  registerItemType(b, da, "FoodMushroomWhite.PNG");
  registerItemType(b, da, "FoodMushroomYellow.PNG");
  registerItemType(b, W, "CapIron.PNG");
  registerItemType(b, W, "CapLeather.PNG");
  registerItemType(b, W, "CapLeatherHard.PNG");
  registerItemType(b, W, "CapMetal.PNG");
  registerItemType(b, W, "CapSteel.PNG");
  registerItemType(b, W, "Valors_Helm.PNG");
  registerItemType(b, W, "Knight_Helm.PNG");
  registerItemType(b, W, "DarkLord_Helm.PNG");
  registerItemType(b, W, "GuardHelm01.PNG");
  registerItemType(b, W, "HelmHorned.PNG");
  registerItemType(b, W, "CapGolden.PNG");
  registerItemType(b, ia, "CrownGolden.PNG");
  registerItemType(b, ia, "CrownIron.PNG");
  registerItemType(b, ia, "CrownIronJeweled.PNG");
  registerItemType(b, ia, "CrownJeweled.PNG");
  registerItemType(b, ia, "CrownOfTheMagi.PNG");
  registerItemType(b, ia, "CapGolden.PNG");
  registerItemType(b, ea, "WizardHat01.PNG");
  registerItemType(b, ea, "WizardHat02.PNG");
  registerItemType(b, ea, "WizardHat03.PNG");
  registerItemType(b, ea, "WizardHat04.PNG");
  registerItemType(b, ea, "WizardHat05.PNG");
  registerItemType(b, va, "GlovesLeatherHard.PNG");
  registerItemType(b, va, "GlovesLeatherSoft.PNG");
  registerItemType(b, va, "GlovesSteel.PNG");
  registerItemType(b, va, "GlovesGolden.PNG");
  registerItemType(b, va, "GlovesGreen.PNG");
  registerItemType(b, va, "GlovesSteelBlue.PNG");
  registerItemType(b, yb, "Valors_Gauntlets.PNG");
  registerItemType(b, yb, "Knight_Gauntlets.PNG");
  registerItemType(b, yb, "DarkLord_Gauntlets.PNG");
  registerItemType(b, Fb, "RobeBlue.PNG");
  registerItemType(b, Fb, "RobeGreen.PNG");
  registerItemType(b, Fb, "RobePurple.PNG");
  registerItemType(b, Fb, "RobeRed.PNG");
  registerItemType(b, pa, "CloakBlue.PNG");
  registerItemType(b, pa, "CloakBrown.PNG");
  registerItemType(b, pa, "CloakDarkGrey.PNG");
  registerItemType(b, pa, "CloakGreen.PNG");
  registerItemType(b, pa, "CloakLightBlue.PNG");
  registerItemType(b, pa, "CloakPurple.PNG");
  registerItemType(b, pa, "CloakRed.PNG");
  registerItemType(b, pa, "CloakSilver.PNG");
  registerItemType(b, pa, "CloakWhite.PNG");
  registerItemType(b, T, "Wand01.PNG");
  registerItemType(b, T, "Wand02.PNG");
  registerItemType(b, T, "Wand03.PNG");
  registerItemType(b, T, "Wand04.PNG");
  registerItemType(b, T, "Wand05.PNG");
  registerItemType(b, T, "Wand06.PNG");
  registerItemType(b, T, "Wand07.PNG");
  registerItemType(b, T, "Wand08.PNG");
  registerItemType(b, T, "Wand09.PNG");
  registerItemType(b, T, "Wand10.PNG");
  registerItemType(b, T, "Wand11.PNG");
  registerItemType(b, T, "Wand12.PNG");
  registerItemType(b, T, "Wand13.PNG");
  registerItemType(b, T, "Wand14.PNG");
  registerItemType(b, T, "Wand15.PNG");
  registerItemType(b, T, "Wand16.PNG");
  registerItemType(b, T, "Wand17.PNG");
  registerItemType(b, T, "Wand18.PNG");
  registerItemType(b, T, "Wand19.PNG");
  registerItemType(b, T, "WandBronzeGold.PNG");
  registerItemType(b, T, "WandBronzeRed.PNG");
  registerItemType(b, T, "WandBronzeSilver.PNG");
  registerItemType(b, T, "WandGold.PNG");
  registerItemType(b, T, "WandSilver.PNG");
  registerItemType(b, T, "WandSilverBronze.PNG");
  registerItemType(b, T, "WandSilverGold.PNG");
  registerItemType(b, T, "WandSilverTeal.PNG");
  registerItemType(b, T, "WandTeal.PNG");
  registerItemType(b, X, "BootsLeatherHard.PNG");
  registerItemType(b, X, "BootsLeatherSoft.PNG");
  registerItemType(b, X, "Warmboots01.PNG");
  registerItemType(b, X, "Warmboots02.PNG");
  registerItemType(b, X, "Warmboots03.PNG");
  registerItemType(b, X, "Warmboots04.PNG");
  registerItemType(b, X, "Warmboots05.PNG");
  registerItemType(b, X, "NewBoots01.PNG");
  registerItemType(b, X, "NewBoots02.PNG");
  registerItemType(b, X, "NewBoots03.PNG");
  registerItemType(b, X, "NewBoots04.PNG");
  registerItemType(b, X, "NewBoots05.PNG");
  registerItemType(b, X, "NewBoots06.PNG");
  registerItemType(b, X, "BootsGreen.PNG");
  registerItemType(b, X, "BootsMetal.PNG");
  registerItemType(b, X, "Knight_Boots.PNG");
  registerItemType(b, X, "DarkLord_Boots.PNG");
  registerItemType(b, X, "BootsGolden.PNG");
  registerItemType(b, X, "Valors_Boots.PNG");
  registerItemType(b, Ca, "Belt1.PNG");
  registerItemType(b, Ca, "DarkLord_Belt.PNG");
  registerItemType(b, Ca, "Belt2.PNG");
  registerItemType(b, Ca, "Belt3.PNG");
  registerItemType(b, Ca, "Belt4.PNG");
  registerItemType(b, Ca, "Valors_Belt.PNG");
  registerItemType(b, Ca, "Knight_Belt.PNG");
  registerItemType(b, {
    fa: "虚拟伤害",
    na: false,
    oa: true,
    ma: false,
    la: false,
    Z: ["230"]
  }, "Spear.PNG");
  registerItemType(b, {
    fa: "虚拟护甲",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["231"]
  }, "Spear.PNG");
  registerItemType(b, {
    fa: "虚拟攻击等级",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["232"]
  }, "Spear.PNG");
  registerItemType(b, {
    fa: "虚拟防御等级",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["233"]
  }, "Spear.PNG");
  registerItemType(b, {
    fa: "虚拟最大生命",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["234"]
  }, "Spear.PNG");
  registerItemType(b, {
    fa: "虚拟最大法力",
    na: false,
    oa: false,
    ma: false,
    la: true,
    Z: ["235"]
  }, "Spear.PNG");
}
export function initializeContentEquipment() {}
