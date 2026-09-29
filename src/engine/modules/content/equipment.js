/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { registerItemType } from "../loot/items.js";
export function initializeItemCatalog(itemGenerator, itemSprites) {
  var catalog = itemGenerator;
  catalog.itemSprites = itemSprites;
  catalog.itemTypesById = {};
  catalog.itemTypesBySlot = {};
  var sword = {
      baseName: "剑",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["20"]
    },
    axe = {
      baseName: "斧",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["21"]
    },
    hammer = {
      baseName: "锤",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["21"]
    },
    dagger = {
      baseName: "匕首",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["24", "33"]
    },
    flail = {
      baseName: "连枷",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["22", "20", "21"]
    },
    scepter = {
      baseName: "权杖",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["22", "20"]
    },
    ceremonialStaff = {
      baseName: "节杖",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["32"]
    },
    nunchaku = {
      baseName: "双节棍",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["29"]
    },
    club = {
      baseName: "棍棒",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["26", "27", "28", "31"]
    },
    scythe = {
      baseName: "镰刀",
      isMeleeWeapon: true,
      isProjectile: false,
      isArmor: false,
      isMiscItem: false,
      slotList: ["30"]
    },
    bone = {
      baseName: "骨头",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["201"]
    },
    candle = {
      baseName: "蜡烛",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["203"]
    },
    lantern = {
      baseName: "灯笼",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["203"]
    },
    lamp = {
      baseName: "灯",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["203"]
    },
    coin = {
      baseName: "硬币",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["205"]
    },
    jewel = {
      baseName: "珠宝",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["205"]
    },
    bow = {
      baseName: "弓",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["23"]
    },
    crossbow = {
      baseName: "弩",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["25"]
    },
    arrow = {
      baseName: "箭矢",
      isMeleeWeapon: false,
      isProjectile: true,
      isArmor: false,
      isMiscItem: false,
      projectileAnimationId: 1,
      slotList: ["60"]
    },
    lightning = {
      baseName: "闪电",
      isMeleeWeapon: false,
      isProjectile: true,
      isArmor: false,
      isMiscItem: false,
      projectileAnimationId: 2,
      slotList: ["61"]
    },
    shield = {
      baseName: "护盾",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["40", "41"]
    },
    chainArmor = {
      baseName: "链甲",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["80", "82", "81"]
    },
    plateArmorTwoSlots = {
      baseName: "板甲",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["80", "81"]
    },
    plateArmorThreeSlots = {
      baseName: "板甲",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["80", "82", "81"]
    },
    leatherArmor = {
      baseName: "皮甲",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["84", "83"]
    },
    necklace = {
      baseName: "项链",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: "140 141 142 143 145 144".split(" ")
    },
    ring = {
      baseName: "戒指",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: "160 161 162 163 164 165".split(" ")
    },
    symbol = {
      baseName: "符号",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["200"]
    },
    mushroom = {
      baseName: "蘑菇",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["202", "204"]
    },
    helmet = {
      baseName: "头盔",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["120"]
    },
    crown = {
      baseName: "王冠",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["125"]
    },
    wizardHat = {
      baseName: "巫师帽",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["121", "122", "123", "124"]
    },
    gloves = {
      baseName: "手套",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["100", "101", "102"]
    },
    gauntlets = {
      baseName: "长手套",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["101", "102"]
    },
    robe = {
      baseName: "长袍",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["85", "86", "87", "89", "91"]
    },
    cloak = {
      baseName: "斗篷",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: "85 86 87 88 90 92".split(" ")
    },
    wand = {
      baseName: "魔杖",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: false,
      isMiscItem: true,
      slotList: ["26"]
    },
    boots = {
      baseName: "靴子",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: "181 185 182 183 184 180 186".split(" ")
    },
    belt = {
      baseName: "腰带",
      isMeleeWeapon: false,
      isProjectile: false,
      isArmor: true,
      isMiscItem: false,
      slotList: ["3", "4", "5", "6", "7"]
    };
  registerItemType(catalog, chainArmor, "ArmorChainMailRusty.PNG");
  registerItemType(catalog, chainArmor, "ArmorChainMail.PNG");
  registerItemType(catalog, chainArmor, "ArmorChainMailAugmented.PNG");
  registerItemType(catalog, chainArmor, "ArmorChainMailBar.PNG");
  registerItemType(catalog, chainArmor, "ArmorChainmailGolden.PNG");
  registerItemType(catalog, chainArmor, "ArmorChainmailGreen.PNG");
  registerItemType(catalog, chainArmor, "ArmorChainmailMithril.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorLeatherScaleMail.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorMetalScaleMail.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonGrey.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonDarkGrey.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonWhite.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonBlue.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonBronze.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonGolden.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonGreen.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonLightBlue.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonPurple.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonRed.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonYellow.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonRainbow.PNG");
  registerItemType(catalog, plateArmorThreeSlots, "ArmorScalemailDragonHellfire.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailPartial.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailFull.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailRibbed.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailEnhancedSteel.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailEnhancedBrown.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailEnhancedPurple.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailEnhancedBlue.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailEnhancedGreen.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailEnhancedYellow.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailStuddedGolden.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailStuddedGreen.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailMithril.PNG");
  registerItemType(catalog, plateArmorTwoSlots, "ArmorPlatemailAdamantite.PNG");
  registerItemType(catalog, leatherArmor, "ArmorLeatherSoft.PNG");
  registerItemType(catalog, leatherArmor, "ArmorLeatherHard.PNG");
  registerItemType(catalog, leatherArmor, "ArmorLeatherScaleMail.PNG");
  registerItemType(catalog, leatherArmor, "ArmorLeatherHardStudded.PNG");
  registerItemType(catalog, leatherArmor, "ArmorLeatherSoftStudded.PNG");
  registerItemType(catalog, sword, "Sword01.PNG");
  registerItemType(catalog, sword, "Sword02.PNG");
  registerItemType(catalog, sword, "Sword03.PNG");
  registerItemType(catalog, sword, "Sword04.PNG");
  registerItemType(catalog, sword, "Sword05.PNG");
  registerItemType(catalog, sword, "Sword06.PNG");
  registerItemType(catalog, sword, "Sword07.PNG");
  registerItemType(catalog, sword, "Sword08.PNG");
  registerItemType(catalog, sword, "Sword09.PNG");
  registerItemType(catalog, sword, "Sword10.PNG");
  registerItemType(catalog, sword, "Sword11.PNG");
  registerItemType(catalog, sword, "Sword12.PNG");
  registerItemType(catalog, sword, "Sword13.PNG");
  registerItemType(catalog, sword, "Sword14.PNG");
  registerItemType(catalog, sword, "Sword15.PNG");
  registerItemType(catalog, sword, "Sword16.PNG");
  registerItemType(catalog, sword, "Sword17.PNG");
  registerItemType(catalog, sword, "Sword18.PNG");
  registerItemType(catalog, sword, "Sword19.PNG");
  registerItemType(catalog, sword, "Sword20.PNG");
  registerItemType(catalog, sword, "Sword21.PNG");
  registerItemType(catalog, sword, "Sword22.PNG");
  registerItemType(catalog, sword, "Sword23.PNG");
  registerItemType(catalog, sword, "Sword24.PNG");
  registerItemType(catalog, sword, "Sword25.PNG");
  registerItemType(catalog, sword, "Sword26.PNG");
  registerItemType(catalog, sword, "Sword27.PNG");
  registerItemType(catalog, sword, "Sword28.PNG");
  registerItemType(catalog, sword, "SwordFlaming.PNG");
  registerItemType(catalog, sword, "SwordMagical.PNG");
  registerItemType(catalog, sword, "SwordMedievalMagical.PNG");
  registerItemType(catalog, shield, "ShieldWoodLarge.PNG");
  registerItemType(catalog, shield, "ShieldWoodSmall.PNG");
  registerItemType(catalog, shield, "ShieldWoodenRound.PNG");
  registerItemType(catalog, shield, "ShieldSmallSteel.PNG");
  registerItemType(catalog, shield, "ShieldSteelRoundLarge.PNG");
  registerItemType(catalog, shield, "ShieldTriangular.PNG");
  registerItemType(catalog, shield, "ShieldKiteRed.PNG");
  registerItemType(catalog, shield, "Knight_Shield.PNG");
  registerItemType(catalog, shield, "ShieldCrossed.PNG");
  registerItemType(catalog, shield, "ShieldCrossRed.PNG");
  registerItemType(catalog, shield, "DarkLord_Shield.PNG");
  registerItemType(catalog, shield, "ShieldFourColoredBlueYellow.PNG");
  registerItemType(catalog, shield, "ShieldFourColoredRedYellow.PNG");
  registerItemType(catalog, shield, "ShieldFourColoredSilverYellow.PNG");
  registerItemType(catalog, shield, "ShieldStripeRed.PNG");
  registerItemType(catalog, shield, "ShieldColored1.PNG");
  registerItemType(catalog, shield, "Valors_Shield.PNG");
  registerItemType(catalog, shield, "DefenderShield01.PNG");
  registerItemType(catalog, shield, "ShieldCrestedCrown.PNG");
  registerItemType(catalog, shield, "ShieldCrestedGolden.PNG");
  registerItemType(catalog, shield, "ShieldCrestedLion.PNG");
  registerItemType(catalog, shield, "ShieldCrestedLion2.PNG");
  registerItemType(catalog, shield, "ShieldCrestedSkull.PNG");
  registerItemType(catalog, shield, "ShieldCrestedUnicorn.PNG");
  registerItemType(catalog, shield, "ShieldCrestedUnicorn2.PNG");
  registerItemType(catalog, scepter, "Mace.PNG");
  registerItemType(catalog, scepter, "MaceWood.PNG");
  registerItemType(catalog, scepter, "Mace01.PNG");
  registerItemType(catalog, scepter, "Mace02.PNG");
  registerItemType(catalog, scepter, "Mace03.PNG");
  registerItemType(catalog, scepter, "Mace04.PNG");
  registerItemType(catalog, scepter, "Mace05.PNG");
  registerItemType(catalog, scepter, "Mace06.PNG");
  registerItemType(catalog, scepter, "Mace07.PNG");
  registerItemType(catalog, scepter, "Mace08.PNG");
  registerItemType(catalog, scepter, "MaceWar.PNG");
  registerItemType(catalog, scepter, "MaceGolden.PNG");
  registerItemType(catalog, scepter, "MaceMagic.PNG");
  registerItemType(catalog, flail, "Flail01.PNG");
  registerItemType(catalog, flail, "Flail02.PNG");
  registerItemType(catalog, flail, "Flail03.PNG");
  registerItemType(catalog, flail, "Flail04.PNG");
  registerItemType(catalog, flail, "FlailSteel.PNG");
  registerItemType(catalog, flail, "FlailTwoHanded.PNG");
  registerItemType(catalog, flail, "FlailWood.PNG");
  registerItemType(catalog, flail, "Flail05.PNG");
  registerItemType(catalog, flail, "Flail06.PNG");
  registerItemType(catalog, flail, "Flail07.PNG");
  registerItemType(catalog, flail, "DoubleFlail01.PNG");
  registerItemType(catalog, flail, "DoubleFlail02.PNG");
  registerItemType(catalog, flail, "DoubleFlail03.PNG");
  registerItemType(catalog, axe, "AxeBeaked.PNG");
  registerItemType(catalog, axe, "AxeGlaive.PNG");
  registerItemType(catalog, axe, "Axe01.PNG");
  registerItemType(catalog, axe, "Axe02.PNG");
  registerItemType(catalog, axe, "Axe03.PNG");
  registerItemType(catalog, axe, "Axe04.PNG");
  registerItemType(catalog, axe, "Axe05.PNG");
  registerItemType(catalog, axe, "Axe06.PNG");
  registerItemType(catalog, axe, "Axe07.PNG");
  registerItemType(catalog, axe, "Axe08.PNG");
  registerItemType(catalog, axe, "Axe09.PNG");
  registerItemType(catalog, axe, "Axe10.PNG");
  registerItemType(catalog, axe, "Axe11.PNG");
  registerItemType(catalog, axe, "Axe12.PNG");
  registerItemType(catalog, axe, "Axe13.PNG");
  registerItemType(catalog, axe, "Axe14.PNG");
  registerItemType(catalog, axe, "AxeBattle.PNG");
  registerItemType(catalog, axe, "AxeBroad.PNG");
  registerItemType(catalog, axe, "AxeGolden.PNG");
  registerItemType(catalog, axe, "AxeGreat.PNG");
  registerItemType(catalog, axe, "AxeLochaber.PNG");
  registerItemType(catalog, hammer, "Ahammer1.PNG");
  registerItemType(catalog, hammer, "Hammer01.PNG");
  registerItemType(catalog, hammer, "Hammer02.PNG");
  registerItemType(catalog, hammer, "Hammer03.PNG");
  registerItemType(catalog, hammer, "Hammer04.PNG");
  registerItemType(catalog, hammer, "Hammer05.PNG");
  registerItemType(catalog, hammer, "HammerGiant.PNG");
  registerItemType(catalog, hammer, "HammerGolden.PNG");
  registerItemType(catalog, hammer, "HammerLucerne.PNG");
  registerItemType(catalog, hammer, "HammerWar.PNG");
  registerItemType(catalog, dagger, "Dagger.PNG");
  registerItemType(catalog, dagger, "Dagger01.PNG");
  registerItemType(catalog, dagger, "Dagger02.PNG");
  registerItemType(catalog, dagger, "Dagger03.PNG");
  registerItemType(catalog, dagger, "Dagger04.PNG");
  registerItemType(catalog, dagger, "Dagger05.PNG");
  registerItemType(catalog, dagger, "Dagger06.PNG");
  registerItemType(catalog, dagger, "Dagger07.PNG");
  registerItemType(catalog, dagger, "Dagger08.PNG");
  registerItemType(catalog, dagger, "Dagger09.PNG");
  registerItemType(catalog, dagger, "Dagger10.PNG");
  registerItemType(catalog, dagger, "DaggerGauche.PNG");
  registerItemType(catalog, nunchaku, "Nunchaku.PNG");
  registerItemType(catalog, nunchaku, "NunchakuGolden.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter01.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter02.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter03.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter04.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter05.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter06.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter07.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter08.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter09.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter10.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter11.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter12.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter13.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter14.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter15.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter16.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter17.PNG");
  registerItemType(catalog, ceremonialStaff, "Scepter18.PNG");
  registerItemType(catalog, scythe, "Scythe01.PNG");
  registerItemType(catalog, scythe, "Scythe02.PNG");
  registerItemType(catalog, scythe, "ScytheSteel.PNG");
  registerItemType(catalog, scythe, "ScytheWood.PNG");
  registerItemType(catalog, club, "Staff01.PNG");
  registerItemType(catalog, club, "Staff02.PNG");
  registerItemType(catalog, club, "Staff03.PNG");
  registerItemType(catalog, club, "Staff04.PNG");
  registerItemType(catalog, club, "Staff05.PNG");
  registerItemType(catalog, club, "Staff06.PNG");
  registerItemType(catalog, club, "Staff07.PNG");
  registerItemType(catalog, club, "Staff08.PNG");
  registerItemType(catalog, club, "Staff09.PNG");
  registerItemType(catalog, club, "Staff10.PNG");
  registerItemType(catalog, club, "Staff11.PNG");
  registerItemType(catalog, club, "Staff12.PNG");
  registerItemType(catalog, club, "Staff13.PNG");
  registerItemType(catalog, club, "Staff14.PNG");
  registerItemType(catalog, club, "Staff15.PNG");
  registerItemType(catalog, club, "Staff16.PNG");
  registerItemType(catalog, club, "Staff17.PNG");
  registerItemType(catalog, club, "Staff18.PNG");
  registerItemType(catalog, club, "Staff19.PNG");
  registerItemType(catalog, club, "Staff20.PNG");
  registerItemType(catalog, club, "Staff21.PNG");
  registerItemType(catalog, club, "Staff22.PNG");
  registerItemType(catalog, club, "Staff23.PNG");
  registerItemType(catalog, club, "StaffBronze.PNG");
  registerItemType(catalog, club, "StaffDarkYellow.PNG");
  registerItemType(catalog, club, "StaffGold.PNG");
  registerItemType(catalog, club, "StaffGoldScales.PNG");
  registerItemType(catalog, club, "StaffGoldStriped.PNG");
  registerItemType(catalog, club, "StaffRedStriped.PNG");
  registerItemType(catalog, club, "StaffSilver.PNG");
  registerItemType(catalog, bone, "SkeletonBrokenBone.PNG");
  registerItemType(catalog, bone, "SkeletonDog.PNG");
  registerItemType(catalog, bone, "SkeletonHumanSmall.PNG");
  registerItemType(catalog, bone, "SkeletonRat.PNG");
  registerItemType(catalog, bone, "SkeletonSkull.PNG");
  registerItemType(catalog, candle, "CandleStand1.PNG");
  registerItemType(catalog, candle, "CandleStand2.PNG");
  registerItemType(catalog, lantern, "Lantern.PNG");
  registerItemType(catalog, lantern, "LanternBronze.PNG");
  registerItemType(catalog, {
    baseName: "火炬",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["203"]
  }, "Torch.PNG");
  registerItemType(catalog, lamp, "LightChalice.PNG");
  registerItemType(catalog, lamp, "LightOrb.PNG");
  registerItemType(catalog, lamp, "LightStar.PNG");
  registerItemType(catalog, coin, "CoinsBronze.PNG");
  registerItemType(catalog, coin, "CoinsGold.PNG");
  registerItemType(catalog, coin, "CoinsGoldLarge.PNG");
  registerItemType(catalog, coin, "CoinsGoldMedium.PNG");
  registerItemType(catalog, coin, "CoinsGoldSmall.PNG");
  registerItemType(catalog, coin, "CoinsGreen.PNG");
  registerItemType(catalog, coin, "CoinsSilver.PNG");
  registerItemType(catalog, coin, "CoinsTeal.PNG");
  registerItemType(catalog, jewel, "Jewels.PNG");
  registerItemType(catalog, jewel, "JewelsBlue.PNG");
  registerItemType(catalog, jewel, "JewelsRed.PNG");
  registerItemType(catalog, bow, "BowShort.PNG");
  registerItemType(catalog, bow, "Bow01.PNG");
  registerItemType(catalog, bow, "Bow02.PNG");
  registerItemType(catalog, bow, "Bow03.PNG");
  registerItemType(catalog, bow, "Bow04.PNG");
  registerItemType(catalog, bow, "Bow05.PNG");
  registerItemType(catalog, bow, "Bow06.PNG");
  registerItemType(catalog, bow, "Bow07.PNG");
  registerItemType(catalog, bow, "Bow08.PNG");
  registerItemType(catalog, bow, "Bow09.PNG");
  registerItemType(catalog, bow, "Bow10.PNG");
  registerItemType(catalog, bow, "BowLong.PNG");
  registerItemType(catalog, crossbow, "Xbow01.PNG");
  registerItemType(catalog, crossbow, "Xbow02.PNG");
  registerItemType(catalog, crossbow, "Xbow03.PNG");
  registerItemType(catalog, crossbow, "Xbow04.PNG");
  registerItemType(catalog, crossbow, "Xbow05.PNG");
  registerItemType(catalog, crossbow, "Xbow06.PNG");
  registerItemType(catalog, crossbow, "Crossbow2.PNG");
  registerItemType(catalog, crossbow, "CrossbowHeavy.PNG");
  registerItemType(catalog, crossbow, "CrossbowLight.PNG");
  registerItemType(catalog, arrow, "ArrowWood.PNG");
  registerItemType(catalog, arrow, "ArrowSteel.PNG");
  registerItemType(catalog, arrow, "ArrowGolden.PNG");
  registerItemType(catalog, arrow, "ArrowSilver.PNG");
  registerItemType(catalog, arrow, "ArrowFlaming.PNG");
  registerItemType(catalog, arrow, "ArrowFlaming2.PNG");
  registerItemType(catalog, arrow, "ArrowMagicBlue.PNG");
  registerItemType(catalog, arrow, "ArrowMagicPurple.PNG");
  registerItemType(catalog, arrow, "ArrowPoisoned1.PNG");
  registerItemType(catalog, arrow, "ArrowPoisoned2.PNG");
  registerItemType(catalog, arrow, "ArrowPoisoned3.PNG");
  registerItemType(catalog, arrow, "ArrowPoisoned4.PNG");
  registerItemType(catalog, lightning, "BoltSteel.PNG");
  registerItemType(catalog, lightning, "BoltSilver.PNG");
  registerItemType(catalog, lightning, "BoltFlaming.PNG");
  registerItemType(catalog, lightning, "BoltFlaming2.PNG");
  registerItemType(catalog, lightning, "BoltGolden.PNG");
  registerItemType(catalog, lightning, "BoltMagicGreen.PNG");
  registerItemType(catalog, lightning, "BoltMagicRed.PNG");
  registerItemType(catalog, lightning, "BoltPoisoned.PNG");
  registerItemType(catalog, lightning, "BoltPoisoned2.PNG");
  registerItemType(catalog, lightning, "BoltPoisoned3.PNG");
  registerItemType(catalog, lightning, "BoltPoisoned4.PNG");
  registerItemType(catalog, lightning, "BoltWood.PNG");
  registerItemType(catalog, {
    baseName: "星星",
    isMeleeWeapon: false,
    isProjectile: true,
    isArmor: false,
    isMiscItem: false,
    projectileAnimationId: 3,
    slotList: ["62"]
  }, "ThrowingStar.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelSilver5.PNG");
  registerItemType(catalog, necklace, "NecklaceSilverJewelGreen.PNG");
  registerItemType(catalog, necklace, "NecklaceSilverJewelOrange.PNG");
  registerItemType(catalog, necklace, "NecklaceBronzeJewelRed.PNG");
  registerItemType(catalog, necklace, "NecklaceGoldJewelBlue.PNG");
  registerItemType(catalog, necklace, "NecklaceGoldJewelGreen.PNG");
  registerItemType(catalog, necklace, "NecklaceGoldJewelSilver.PNG");
  registerItemType(catalog, necklace, "NecklaceGoldJewelSilver2.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelBlue.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelRed.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelRed2.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelRed3.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelSilver.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelSilver2.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelSilver3.PNG");
  registerItemType(catalog, necklace, "NecklaceJewelSilver4.PNG");
  registerItemType(catalog, ring, "RingBronze.PNG");
  registerItemType(catalog, ring, "RingGold.PNG");
  registerItemType(catalog, ring, "RingGoldJeweledBlue.PNG");
  registerItemType(catalog, ring, "RingGoldJeweledRed.PNG");
  registerItemType(catalog, ring, "RingGoldJeweledYellowMagic.PNG");
  registerItemType(catalog, ring, "RingGoldMagic.PNG");
  registerItemType(catalog, ring, "RingJewelBlack.PNG");
  registerItemType(catalog, ring, "RingJewelBlue.PNG");
  registerItemType(catalog, ring, "RingJeweledRed2.PNG");
  registerItemType(catalog, ring, "RingJewelGreen.PNG");
  registerItemType(catalog, ring, "RingJewelOrange.PNG");
  registerItemType(catalog, ring, "RingJewelPurple.PNG");
  registerItemType(catalog, ring, "RingJewelRed.PNG");
  registerItemType(catalog, ring, "RingPlainGrey.PNG");
  registerItemType(catalog, ring, "RingPlainSilver.PNG");
  registerItemType(catalog, ring, "RingPurple.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledBlueMagic.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledGreen.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledGreenMagic.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledMagenta.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledPurple.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledRedMagic.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledSilver.PNG");
  registerItemType(catalog, ring, "RingSilverJeweledSilver2.PNG");
  registerItemType(catalog, symbol, "GlyphGreen.PNG");
  registerItemType(catalog, symbol, "GlyphRed.PNG");
  registerItemType(catalog, symbol, "GlyphYellow.PNG");
  registerItemType(catalog, {
    baseName: "面包",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["204"]
  }, "FoodBread.PNG");
  registerItemType(catalog, {
    baseName: "啤酒",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["204"]
  }, "FoodAle.PNG");
  registerItemType(catalog, {
    baseName: "鸡腿",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["204"]
  }, "FoodDrumstick.PNG");
  registerItemType(catalog, {
    baseName: "火腿",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["204"]
  }, "FoodShank.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomBlack.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomBlue.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomBrown.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomGreen.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomGreen2.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomGrey.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomGrey2.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomOrange.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomPurple.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomRed.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomRed2.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomSilver.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomTan.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomTeal.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomWhite.PNG");
  registerItemType(catalog, mushroom, "FoodMushroomYellow.PNG");
  registerItemType(catalog, helmet, "CapIron.PNG");
  registerItemType(catalog, helmet, "CapLeather.PNG");
  registerItemType(catalog, helmet, "CapLeatherHard.PNG");
  registerItemType(catalog, helmet, "CapMetal.PNG");
  registerItemType(catalog, helmet, "CapSteel.PNG");
  registerItemType(catalog, helmet, "Valors_Helm.PNG");
  registerItemType(catalog, helmet, "Knight_Helm.PNG");
  registerItemType(catalog, helmet, "DarkLord_Helm.PNG");
  registerItemType(catalog, helmet, "GuardHelm01.PNG");
  registerItemType(catalog, helmet, "HelmHorned.PNG");
  registerItemType(catalog, helmet, "CapGolden.PNG");
  registerItemType(catalog, crown, "CrownGolden.PNG");
  registerItemType(catalog, crown, "CrownIron.PNG");
  registerItemType(catalog, crown, "CrownIronJeweled.PNG");
  registerItemType(catalog, crown, "CrownJeweled.PNG");
  registerItemType(catalog, crown, "CrownOfTheMagi.PNG");
  registerItemType(catalog, crown, "CapGolden.PNG");
  registerItemType(catalog, wizardHat, "WizardHat01.PNG");
  registerItemType(catalog, wizardHat, "WizardHat02.PNG");
  registerItemType(catalog, wizardHat, "WizardHat03.PNG");
  registerItemType(catalog, wizardHat, "WizardHat04.PNG");
  registerItemType(catalog, wizardHat, "WizardHat05.PNG");
  registerItemType(catalog, gloves, "GlovesLeatherHard.PNG");
  registerItemType(catalog, gloves, "GlovesLeatherSoft.PNG");
  registerItemType(catalog, gloves, "GlovesSteel.PNG");
  registerItemType(catalog, gloves, "GlovesGolden.PNG");
  registerItemType(catalog, gloves, "GlovesGreen.PNG");
  registerItemType(catalog, gloves, "GlovesSteelBlue.PNG");
  registerItemType(catalog, gauntlets, "Valors_Gauntlets.PNG");
  registerItemType(catalog, gauntlets, "Knight_Gauntlets.PNG");
  registerItemType(catalog, gauntlets, "DarkLord_Gauntlets.PNG");
  registerItemType(catalog, robe, "RobeBlue.PNG");
  registerItemType(catalog, robe, "RobeGreen.PNG");
  registerItemType(catalog, robe, "RobePurple.PNG");
  registerItemType(catalog, robe, "RobeRed.PNG");
  registerItemType(catalog, cloak, "CloakBlue.PNG");
  registerItemType(catalog, cloak, "CloakBrown.PNG");
  registerItemType(catalog, cloak, "CloakDarkGrey.PNG");
  registerItemType(catalog, cloak, "CloakGreen.PNG");
  registerItemType(catalog, cloak, "CloakLightBlue.PNG");
  registerItemType(catalog, cloak, "CloakPurple.PNG");
  registerItemType(catalog, cloak, "CloakRed.PNG");
  registerItemType(catalog, cloak, "CloakSilver.PNG");
  registerItemType(catalog, cloak, "CloakWhite.PNG");
  registerItemType(catalog, wand, "Wand01.PNG");
  registerItemType(catalog, wand, "Wand02.PNG");
  registerItemType(catalog, wand, "Wand03.PNG");
  registerItemType(catalog, wand, "Wand04.PNG");
  registerItemType(catalog, wand, "Wand05.PNG");
  registerItemType(catalog, wand, "Wand06.PNG");
  registerItemType(catalog, wand, "Wand07.PNG");
  registerItemType(catalog, wand, "Wand08.PNG");
  registerItemType(catalog, wand, "Wand09.PNG");
  registerItemType(catalog, wand, "Wand10.PNG");
  registerItemType(catalog, wand, "Wand11.PNG");
  registerItemType(catalog, wand, "Wand12.PNG");
  registerItemType(catalog, wand, "Wand13.PNG");
  registerItemType(catalog, wand, "Wand14.PNG");
  registerItemType(catalog, wand, "Wand15.PNG");
  registerItemType(catalog, wand, "Wand16.PNG");
  registerItemType(catalog, wand, "Wand17.PNG");
  registerItemType(catalog, wand, "Wand18.PNG");
  registerItemType(catalog, wand, "Wand19.PNG");
  registerItemType(catalog, wand, "WandBronzeGold.PNG");
  registerItemType(catalog, wand, "WandBronzeRed.PNG");
  registerItemType(catalog, wand, "WandBronzeSilver.PNG");
  registerItemType(catalog, wand, "WandGold.PNG");
  registerItemType(catalog, wand, "WandSilver.PNG");
  registerItemType(catalog, wand, "WandSilverBronze.PNG");
  registerItemType(catalog, wand, "WandSilverGold.PNG");
  registerItemType(catalog, wand, "WandSilverTeal.PNG");
  registerItemType(catalog, wand, "WandTeal.PNG");
  registerItemType(catalog, boots, "BootsLeatherHard.PNG");
  registerItemType(catalog, boots, "BootsLeatherSoft.PNG");
  registerItemType(catalog, boots, "Warmboots01.PNG");
  registerItemType(catalog, boots, "Warmboots02.PNG");
  registerItemType(catalog, boots, "Warmboots03.PNG");
  registerItemType(catalog, boots, "Warmboots04.PNG");
  registerItemType(catalog, boots, "Warmboots05.PNG");
  registerItemType(catalog, boots, "NewBoots01.PNG");
  registerItemType(catalog, boots, "NewBoots02.PNG");
  registerItemType(catalog, boots, "NewBoots03.PNG");
  registerItemType(catalog, boots, "NewBoots04.PNG");
  registerItemType(catalog, boots, "NewBoots05.PNG");
  registerItemType(catalog, boots, "NewBoots06.PNG");
  registerItemType(catalog, boots, "BootsGreen.PNG");
  registerItemType(catalog, boots, "BootsMetal.PNG");
  registerItemType(catalog, boots, "Knight_Boots.PNG");
  registerItemType(catalog, boots, "DarkLord_Boots.PNG");
  registerItemType(catalog, boots, "BootsGolden.PNG");
  registerItemType(catalog, boots, "Valors_Boots.PNG");
  registerItemType(catalog, belt, "Belt1.PNG");
  registerItemType(catalog, belt, "DarkLord_Belt.PNG");
  registerItemType(catalog, belt, "Belt2.PNG");
  registerItemType(catalog, belt, "Belt3.PNG");
  registerItemType(catalog, belt, "Belt4.PNG");
  registerItemType(catalog, belt, "Valors_Belt.PNG");
  registerItemType(catalog, belt, "Knight_Belt.PNG");
  registerItemType(catalog, {
    baseName: "虚拟伤害",
    isMeleeWeapon: false,
    isProjectile: true,
    isArmor: false,
    isMiscItem: false,
    slotList: ["230"]
  }, "Spear.PNG");
  registerItemType(catalog, {
    baseName: "虚拟护甲",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["231"]
  }, "Spear.PNG");
  registerItemType(catalog, {
    baseName: "虚拟攻击等级",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["232"]
  }, "Spear.PNG");
  registerItemType(catalog, {
    baseName: "虚拟防御等级",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["233"]
  }, "Spear.PNG");
  registerItemType(catalog, {
    baseName: "虚拟最大生命",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["234"]
  }, "Spear.PNG");
  registerItemType(catalog, {
    baseName: "虚拟最大法力",
    isMeleeWeapon: false,
    isProjectile: false,
    isArmor: false,
    isMiscItem: true,
    slotList: ["235"]
  }, "Spear.PNG");
}
export function initializeContentEquipment() {}
