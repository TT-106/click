/** 法术和状态效果配置。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var blastStunSpell, electricSpellDefinitions, fireSpellDefinitions, poisonCloudSpell, priestSpellDefinitions, fighterSpellDefinitions, rogueSpellDefinitions, barbarianSpellDefinitions, necromancerSpellDefinitions, druidSpellDefinitions, ninjaSpellDefinitions, chickenSpellDefinitions;
export function initializeContentSpells() {
  blastStunSpell = {
    name: "Blast Stun",
    description: "Briefly Stuns Monsters",
    impactEffectName: "Bubbles",
    projectileEffectName: null,
    statusEffectTypeId: 14,
    spellCategoryId: 2,
    applyEffectOnImpact: true,
    potencyPercent: 0,
    cooldownTurns: 15
  };
  electricSpellDefinitions = {
    sB: {
      name: "休克",
      description: "打击伤害",
      impactEffectName: "Gold Sparkles",
      projectileEffectName: "Gold Sparkles",
      statusEffectTypeId: null,
      spellCategoryId: 4,
      potencyPercent: 0,
      cooldownTurns: 13,
      bo: true
    },
    CB: {
      name: "蛛网",
      description: "用网捕捉敌人",
      impactEffectName: "Spider Web",
      projectileEffectName: "Web",
      statusEffectTypeId: 1,
      spellCategoryId: 2,
      applyEffectOnImpact: true,
      potencyPercent: 20,
      cooldownTurns: 20
    },
    XD: {
      name: "闪电雨",
      description: "电雨带来死亡",
      impactEffectName: "Lightning Rain",
      projectileEffectName: "Orange Star",
      statusEffectTypeId: null,
      spellCategoryId: 6,
      potencyPercent: 0,
      cooldownTurns: 30
    },
    br: {
      name: "连锁闪电",
      description: "伤害多个敌人",
      impactEffectName: "Gold Sparkles",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 5,
      potencyPercent: 0,
      cooldownTurns: 25
    }
  };
  fireSpellDefinitions = {
    rD: {
      name: "火环",
      description: "火焰之环",
      impactEffectName: "Yellow Fire Ring",
      projectileEffectName: "Yellow Star",
      statusEffectTypeId: null,
      spellCategoryId: 4,
      potencyPercent: 0,
      cooldownTurns: 13,
      bo: true
    },
    Lz: {
      name: "火雨",
      description: "轰轰烈烈的死亡.",
      impactEffectName: "Fire Rain",
      projectileEffectName: "Yellow Star",
      statusEffectTypeId: null,
      spellCategoryId: 6,
      potencyPercent: 0,
      cooldownTurns: 40
    },
    Kz: {
      name: "火球",
      description: "爆裂火焰",
      impactEffectName: "Orange Sparkles",
      projectileEffectName: "Yellow Star",
      statusEffectTypeId: null,
      spellCategoryId: 8,
      potencyPercent: 0,
      cooldownTurns: 35
    },
    TE: {
      name: "转变怪物",
      description: "怪物攻击怪物",
      impactEffectName: "Red Eye Blink",
      projectileEffectName: "Pink Star",
      statusEffectTypeId: 4,
      spellCategoryId: 2,
      applyEffectOnImpact: true,
      potencyPercent: 0,
      cooldownTurns: 20
    }
  };
  poisonCloudSpell = {
    name: "毒环",
    description: "剧毒的光环",
    impactEffectName: "Green Ring",
    projectileEffectName: "Green Star",
    statusEffectTypeId: null,
    spellCategoryId: 4,
    potencyPercent: 10,
    cooldownTurns: 13,
    bo: true
  };
  priestSpellDefinitions = {
    yD: {
      name: "治疗",
      description: "恢复35%生命",
      impactEffectName: "Red Crosses",
      projectileEffectName: "Red Crosses",
      statusEffectTypeId: null,
      spellCategoryId: 1,
      potencyPercent: 35,
      cooldownTurns: 20
    },
    xE: {
      name: "复活",
      description: "移除昏迷效果",
      impactEffectName: "White Crosses",
      projectileEffectName: "White Crosses",
      statusEffectTypeId: null,
      spellCategoryId: 16,
      potencyPercent: 1,
      applyEffectOnImpact: true,
      cooldownTurns: 20
    },
    Zz: {
      name: "提高护甲",
      description: "10%队伍护甲",
      impactEffectName: "Shields",
      projectileEffectName: null,
      statusEffectTypeId: 5,
      spellCategoryId: 3,
      potencyPercent: 10,
      applyEffectOnImpact: true,
      cooldownTurns: 700
    },
    FD: {
      name: "提高伤害",
      description: "10%队伍伤害",
      impactEffectName: "Arm Flex",
      projectileEffectName: null,
      statusEffectTypeId: 6,
      spellCategoryId: 3,
      potencyPercent: 10,
      applyEffectOnImpact: true,
      cooldownTurns: 700
    },
    ED: {
      name: "提高攻击等级",
      description: "10%队伍攻击等级",
      impactEffectName: "Eagle",
      projectileEffectName: null,
      statusEffectTypeId: 7,
      spellCategoryId: 3,
      potencyPercent: 10,
      applyEffectOnImpact: true,
      cooldownTurns: 700
    },
    $z: {
      name: "提高防御等级",
      description: "10%队伍防御等级",
      impactEffectName: "Armor",
      projectileEffectName: null,
      statusEffectTypeId: 8,
      spellCategoryId: 3,
      potencyPercent: 10,
      applyEffectOnImpact: true,
      cooldownTurns: 700
    }
  };
  fighterSpellDefinitions = {
    ME: {
      name: "嘲讽",
      description: "吸引怪物攻击战士",
      impactEffectName: "Target",
      projectileEffectName: null,
      statusEffectTypeId: 10,
      spellCategoryId: 2,
      applyEffectOnImpact: true,
      potencyPercent: 50,
      cooldownTurns: 30
    }
  };
  rogueSpellDefinitions = {
    IB: {
      name: "潜行",
      description: "潜行背刺",
      impactEffectName: "Color Spiral",
      projectileEffectName: null,
      statusEffectTypeId: 11,
      spellCategoryId: 2,
      applyEffectOnImpact: true,
      potencyPercent: 100,
      cooldownTurns: 30
    },
    ID: {
      name: "立即搜索",
      description: "快速搜索",
      impactEffectName: "Gold Sparkles",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 14,
      applyEffectOnImpact: true,
      potencyPercent: 0,
      cooldownTurns: 10
    },
    wu: {
      name: "发现财宝箱",
      description: "自动搜索",
      impactEffectName: "Blue Sparkles",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 15,
      applyEffectOnImpact: true,
      potencyPercent: 0,
      cooldownTurns: 10
    }
  };
  barbarianSpellDefinitions = {
    rE: {
      name: "愤怒",
      description: "极大地提高伤害",
      impactEffectName: "Totems",
      projectileEffectName: null,
      statusEffectTypeId: 12,
      spellCategoryId: 2,
      applyEffectOnImpact: true,
      potencyPercent: 100,
      cooldownTurns: 40
    },
    wB: {
      name: "重锤",
      description: "溅射伤害+击退",
      impactEffectName: "Red Sparkles",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 8,
      potencyPercent: 0,
      cooldownTurns: 25
    }
  };
  necromancerSpellDefinitions = {
    CD: {
      name: "痛苦",
      description: "对怪物无情",
      impactEffectName: "Skull Cross",
      projectileEffectName: "Skull Cross",
      statusEffectTypeId: null,
      spellCategoryId: 4,
      potencyPercent: 0,
      cooldownTurns: 13,
      bo: true
    },
    xD: {
      name: "绿色死亡",
      description: "弹跳死亡",
      impactEffectName: "Green Skull",
      projectileEffectName: "Green Skull",
      statusEffectTypeId: null,
      spellCategoryId: 13,
      potencyPercent: 0,
      cooldownTurns: 20
    },
    OB: {
      name: "骷髅军队",
      description: "骷髅复活!",
      impactEffectName: "Red Damage",
      projectileEffectName: "Green Projectile",
      statusEffectTypeId: null,
      spellCategoryId: 11,
      potencyPercent: 1,
      cooldownTurns: 25
    },
    NB: {
      name: "幽灵骷髅",
      description: "法师同伴",
      impactEffectName: "Red Damage",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 9,
      potencyPercent: 1,
      cooldownTurns: 25
    }
  };
  druidSpellDefinitions = {
    PB: {
      name: "狼群",
      description: "召唤狼群",
      impactEffectName: "Red Damage",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 10,
      potencyPercent: 1,
      cooldownTurns: 25,
      bo: true
    },
    LB: {
      name: "狗狗守卫",
      description: "犬科伙伴",
      impactEffectName: "Red Damage",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 9,
      potencyPercent: 1,
      cooldownTurns: 25
    },
    cE: {
      name: "小型治疗术",
      description: "回复25%生命",
      impactEffectName: "Red Crosses",
      projectileEffectName: "Red Crosses",
      statusEffectTypeId: null,
      spellCategoryId: 1,
      potencyPercent: 25,
      cooldownTurns: 25
    },
    DE: {
      name: "睡眠",
      description: "怪物陷入睡眠",
      impactEffectName: "Sleep",
      projectileEffectName: "Pink Star",
      statusEffectTypeId: 0,
      spellCategoryId: 2,
      applyEffectOnImpact: true,
      potencyPercent: 0,
      cooldownTurns: 20
    }
  };
  ninjaSpellDefinitions = {
    Hx: {
      name: "快速打击",
      description: "怪物迅速死亡",
      impactEffectName: "White Damage",
      projectileEffectName: "Grey Bullet",
      statusEffectTypeId: null,
      spellCategoryId: 12,
      applyEffectOnImpact: false,
      potencyPercent: 100,
      cooldownTurns: 30
    }
  };
  chickenSpellDefinitions = {
    KB: {
      name: "召唤鸡群",
      description: "鸡王标配法术",
      impactEffectName: "Red Damage",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 17,
      potencyPercent: 1,
      cooldownTurns: 25,
      bo: true
    },
    MB: {
      name: "小鸡守卫",
      description: "小鸡伙伴",
      impactEffectName: "Red Damage",
      projectileEffectName: null,
      statusEffectTypeId: null,
      spellCategoryId: 9,
      potencyPercent: 1,
      cooldownTurns: 25
    }
  };
}
