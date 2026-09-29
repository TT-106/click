/** 装备模板、数值、稀有度与掉落生成。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { ItemNameGenerator, formatItemName } from "./item-names.js";
import { floorNumber, formatAmount, randomInt, randomizeScaledValue } from "../core/math.js";
export var FIRE_ITEM_EFFECT, ICE_ITEM_EFFECT, POISON_ITEM_EFFECT, SHOCK_ITEM_EFFECT, SONIC_ITEM_EFFECT;
export function ItemDrop(item, x, y, room) {
  this.item = item;
  this.levelPositionX = x;
  this.levelPositionY = y;
  this.room = room;
  this.collected = false;
  this.claimedBy = null;
  this.claimDistance = 0;
}
export function ItemEffect(type, amount, description, name) {
  this.itemEffectType = type;
  this.itemEffectAmount = amount;
  this.itemEffectDescription = description;
  this.itemEffectName = name;
}
export function ItemEffectGenerator() {
  this.effectsByType = [];
  this.effectsByType[FIRE_ITEM_EFFECT] = {
    description: "Fire Damage",
    weaponEffectAnimationName: "Red Damage"
  };
  this.effectsByType[ICE_ITEM_EFFECT] = {
    description: "Ice Damage",
    weaponEffectAnimationName: "White Damage"
  };
  this.effectsByType[POISON_ITEM_EFFECT] = {
    description: "Poison Damage",
    weaponEffectAnimationName: "Green Damage"
  };
  this.effectsByType[SHOCK_ITEM_EFFECT] = {
    description: "Shock Damage",
    weaponEffectAnimationName: "Electric Damage"
  };
  this.effectsByType[SONIC_ITEM_EFFECT] = {
    description: "Sonic Damage",
    weaponEffectAnimationName: "Sonic Damage"
  };
}
export function ItemType(typeId, baseName, slotList, spriteFileName, isMeleeWeapon, isArmor, isMiscItem, isProjectile, projectileAnimationId, itemSprites) {
  this.itemTypeId = typeId;
  this.baseName = baseName;
  this.slotList = slotList;
  this.projectileAnimationId = projectileAnimationId;
  if (!(this.iconSprite = itemSprites.getSprite(spriteFileName))) {
    console.log("error. invalid item sprite: " + spriteFileName);
  }
  // write-only 分类旗标（原 na/ma/la；双端零读者，语义由数据模式推断：近战/护甲/杂项）
  this.isMeleeWeapon = isMeleeWeapon;
  this.isArmor = isArmor;
  this.isMiscItem = isMiscItem;
  this.isProjectileItem = isProjectile;
}
export function Item(itemType, slot, characterClass, itemName, itemLevel, itemRarity, itemGold, itemValue, characteristic, itemEffect) {
  this.itemType = itemType;
  this.slot = slot;
  this.characterClass = characterClass;
  this.itemName = itemName;
  this.itemRarity = itemRarity;
  this.itemLevel = itemLevel;
  this.itemGold = itemGold;
  this.itemValue = itemValue;
  this.characteristic = characteristic;
  this.itemEffect = itemEffect;
  this.inventory = null;
}
export function isBetterItem(candidate, currentItem) {
  return !currentItem || candidate.itemValue > currentItem.itemValue;
}
export function getItemStatLabel(item) {
  switch (item.characteristic) {
    case 2:
      return "护甲";
    case 3:
      return "攻击等级";
    case 4:
      return "防御等级";
    case 5:
      return "最大生命";
    case 6:
      return "最大法力";
    case 1:
      if (item.itemEffect) {
        switch (item.itemEffect.itemEffectType) {
          case FIRE_ITEM_EFFECT:
            return "火焰伤害";
          case ICE_ITEM_EFFECT:
            return "冰霜伤害";
          case POISON_ITEM_EFFECT:
            return "毒药伤害";
          case SHOCK_ITEM_EFFECT:
            return "休克伤害";
          case SONIC_ITEM_EFFECT:
            return "音波伤害";
          default:
            return "伤害";
        }
      } else {
        return "伤害";
      }
    default:
      return "Error";
  }
}
export function getItemRarityLabel(item) {
  switch (item.itemRarity) {
    case 0:
      return "普通";
    case 1:
      return "罕见";
    case 2:
      return "稀有";
    case 3:
      return "历史";
    case 4:
      return "远古";
    default:
      return "BUG FOUND: " + item.getRarity();
  }
}
export function getHighlightedItemName(item) {
  const baseName = item.itemType.baseName;
  const itemName = item.itemName;
  const nameIndex = itemName.indexOf(baseName);
  return -1 === nameIndex ? itemName : itemName.substring(0, nameIndex) + '<span style="color:#FAF;">' + baseName + "</span>" + itemName.substring(nameIndex + baseName.length);
}
export function ItemGenerator(rules) {
  this.rules = rules;
  this.itemNameGenerator = new ItemNameGenerator();
  this.itemEffectGenerator = new ItemEffectGenerator();
  this.itemTypesBySlot = {};
  this.itemTypesById = {};
}
export function generateItem(generator, slot, inventory, itemLevel, rarityId) {
  const rules = generator.rules;
  const availableTypes = generator.itemTypesBySlot[slot];
  if (!availableTypes) {
    console.log("ItemGenerator.getRandomItemType() failed to find item types for slot: " + slot);
  }
  let itemType;
  if (0 === availableTypes.length) {
    console.log("ItemGenerator.getRandomItemType() no item types for slot: " + slot);
    itemType = null;
  } else {
    itemType = availableTypes[randomInt(availableTypes.length)];
  }
  if (!itemType) {
    return null;
  }
  let rarityTier;
  rarityLookup: {
    for (let tierIndex = 0; tierIndex < rules.itemRarityTiers.length; tierIndex++) {
      const tier = rules.itemRarityTiers[tierIndex];
      if (tier.tierId === rarityId) {
        rarityTier = tier;
        break rarityLookup;
      }
    }
    rarityTier = rules.itemRarityTiers[0];
  }
  let itemEffect = null;
  const characteristic = inventory.slotStatTypes[slot];
  const statMultiplier = getClassStatMultiplier(inventory, characteristic) * rarityTier.statMultiplier;
  const itemValue = randomizeScaledValue(itemLevel, rules.itemStatCurve, statMultiplier);
  const itemGold = randomizeScaledValue(itemLevel, rules.itemGoldCurve, statMultiplier) * rules.itemGoldModifier.currentValue;
  if (1 === characteristic && Math.random() < rarityTier.elementalEffectChance) {
    const effectGenerator = generator.itemEffectGenerator;
    const effectRoll = Math.random();
    const effectType = 0.2 > effectRoll ? FIRE_ITEM_EFFECT : 0.4 > effectRoll ? ICE_ITEM_EFFECT : 0.6 > effectRoll ? SHOCK_ITEM_EFFECT : 0.7 > effectRoll ? SONIC_ITEM_EFFECT : POISON_ITEM_EFFECT;
    let effectAmount = floorNumber(Math.max(0.1 * itemValue, 0.4 * itemValue * Math.random()));
    if (1 > effectAmount) {
      effectAmount = 1;
    }
    const effectDefinition = effectGenerator.effectsByType[effectType];
    itemEffect = new ItemEffect(effectType, effectAmount, "+" + formatAmount(effectAmount) + " " + effectDefinition.description, effectDefinition.weaponEffectAnimationName);
  }
  const nameGenerator = generator.itemNameGenerator;
  let nameList;
  switch (rarityId) {
    case 0:
      nameList = nameGenerator.commonNames;
      break;
    case 1:
      nameList = nameGenerator.uncommonNames;
      break;
    case 2:
      nameList = nameGenerator.rareNames;
      break;
    case 3:
      nameList = nameGenerator.historicNames;
      break;
    case 4:
      nameList = nameGenerator.ancientNames;
      break;
    default:
      nameList = nameGenerator.commonNames;
  }
  const itemName = formatItemName(itemType.baseName, nameList);
  const item = new Item(itemType, slot, inventory.characterClass, itemName, itemLevel, rarityId, itemGold, itemValue, characteristic, itemEffect);
  item.inventory = inventory;
  return item;
}
export function getClassStatMultiplier(inventory, characteristic) {
  const multipliers = inventory.classDefinition.statMultipliers;
  if (!multipliers) {
    return 1;
  }
  switch (characteristic) {
    case 2:
      return multipliers.armorMultiplier;
    case 1:
      return multipliers.damageMultiplier;
    case 3:
      return multipliers.attackRatingMultiplier;
    case 4:
      return multipliers.defenceRatingMultiplier;
    case 5:
      return multipliers.maxHealthMultiplier;
    case 6:
      return multipliers.maxSpiritMultiplier;
  }
}
export function randomizeItemLevel(level, higherChanceBonus, rules) {
  if (Math.random() < rules.lowerItemLevelChance) {
    return Math.max(1, level - 1);
  }
  const higherChance = Math.min(1, rules.baseHigherItemChance + higherChanceBonus);
  return Math.random() < higherChance ? level + 1 : level;
}
export function registerItemType(generator, definition, spriteFileName) {
  const hashInput = definition.baseName + spriteFileName;
  let hash = 0;
  if (0 !== hashInput.length) {
    for (let characterIndex = 0; characterIndex < hashInput.length; characterIndex++) {
      const characterCode = hashInput.charCodeAt(characterIndex);
      hash = (hash << 5) - hash + characterCode;
      hash |= 0;
    }
  }
  const typeId = hash + "";
  const slots = definition.slotList;
  const itemType = new ItemType(typeId, definition.baseName, slots, spriteFileName, definition.isMeleeWeapon, definition.isArmor, definition.isMiscItem, definition.isProjectile, definition.projectileAnimationId, generator.itemSprites);
  if (generator.itemTypesById[typeId]) {
    console.log("item type hash collision: " + hashInput);
  }
  generator.itemTypesById[typeId] = itemType;
  for (let slotIndex = 0; slotIndex < (/** @type {any} */ (slots)).length; slotIndex++) {
    const slot = slots[slotIndex];
    let candidates = generator.itemTypesBySlot[slot];
    if (!candidates) {
      candidates = [];
      generator.itemTypesBySlot[slot] = candidates;
    }
    candidates.push(itemType);
  }
}
export function ItemDropRegistry() {
  this.drops = [];
}
export function clearItemDrops(dropRegistry) {
  if (0 < dropRegistry.drops.length) {
    dropRegistry.drops.length = 0;
  }
}
export function spawnItemDrop(dropRegistry, x, y, room, monsterLevel, generator, adventurers) {
  const upgrades = generator.rules.globalUpgradeDefinitions;
  const adventurer = adventurers[randomInt(adventurers.length)];
  const slots = adventurer.slotList;
  const slot = slots[randomInt(slots.length)];
  const rarity = generator.rollRarity((100 - upgrades.itemQualityChance.currentValue) / 100);
  const itemLevel = randomizeItemLevel(monsterLevel, (100 - upgrades.higherLevelItemChance.currentValue) / 100, generator.rules);
  const item = generateItem(generator, slot, adventurer, itemLevel, rarity);
  if (item) {
    dropRegistry.drops.push(new ItemDrop(item, x, y, room));
  }
}
export function removeItemDrop(itemDrop, dropRegistry) {
  const index = dropRegistry.drops.indexOf(itemDrop);
  if (-1 < index) {
    dropRegistry.drops.splice(index, 1);
  }
}
export function initializeLootItems() {
  ItemDrop.prototype.getItem = function () {
    return this.item;
  };
  ItemDrop.prototype.setCollected = function (collected) {
    this.collected = collected;
  };
  ItemDrop.prototype.setClaimedBy = function (character) {
    this.claimedBy = character;
  };
  ItemDrop.prototype.getClaimDistance = function () {
    return this.claimDistance;
  };
  ItemDrop.prototype.setClaimDistance = function (distance) {
    this.claimDistance = distance;
  };
  FIRE_ITEM_EFFECT = 1;
  ICE_ITEM_EFFECT = 2;
  POISON_ITEM_EFFECT = 3;
  SHOCK_ITEM_EFFECT = 4;
  SONIC_ITEM_EFFECT = 5;
  ItemType.prototype.getIconSprite = function () {
    return this.iconSprite;
  };
  ItemType.prototype.getProjectileAnimationId = function () {
    return this.projectileAnimationId;
  };
  ItemType.prototype.isProjectileWeapon = function () {
    return this.isProjectileItem;
  };
  Item.prototype.getIconSprite = function () {
    return this.itemType.getIconSprite();
  };
  Item.prototype.getProjectileAnimationId = function () {
    return this.itemType.getProjectileAnimationId();
  };
  Item.prototype.getRarity = function () {
    return this.itemRarity;
  };
  Item.prototype.isProjectileWeapon = function () {
    return this.itemType.isProjectileWeapon();
  };
  ItemGenerator.prototype.rollRarity = function (chanceScale) {
    const probabilities = this.rules.itemRarityProbabilities;
    let threshold = 0;
    let roll = Math.random() * chanceScale;
    for (let rarityIndex = probabilities.length - 1; 0 <= rarityIndex; rarityIndex--) {
      threshold = probabilities[rarityIndex];
      if (roll < threshold) {
        return rarityIndex;
      }
      roll -= threshold;
    }
    return 0;
  };
  ItemDropRegistry.prototype.releaseClaims = function () {
    for (let dropIndex = 0; dropIndex < this.drops.length; dropIndex++) {
      this.drops[dropIndex].setClaimedBy(null);
      this.drops[dropIndex].setClaimDistance(0);
    }
  };
}
