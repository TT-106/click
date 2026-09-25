/** 法术和状态效果配置。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var blastStunSpell, electricSpellDefinitions, fireSpellDefinitions, poisonCloudSpell, priestSpellDefinitions, fighterSpellDefinitions, rogueSpellDefinitions, barbarianSpellDefinitions, necromancerSpellDefinitions, druidSpellDefinitions, ninjaSpellDefinitions, chickenSpellDefinitions;
export function initializeContentSpells() {
  blastStunSpell = {
    ta: "Blast Stun",
    description: "Briefly Stuns Monsters",
    ca: "Bubbles",
    ya: null,
    X: 14,
    ga: 2,
    td: true,
    Ra: 0,
    La: 15
  };
  electricSpellDefinitions = {
    sB: {
      ta: "休克",
      description: "打击伤害",
      ca: "Gold Sparkles",
      ya: "Gold Sparkles",
      X: null,
      ga: 4,
      Ra: 0,
      La: 13,
      bo: true
    },
    CB: {
      ta: "蛛网",
      description: "用网捕捉敌人",
      ca: "Spider Web",
      ya: "Web",
      X: 1,
      ga: 2,
      td: true,
      Ra: 20,
      La: 20
    },
    XD: {
      ta: "闪电雨",
      description: "电雨带来死亡",
      ca: "Lightning Rain",
      ya: "Orange Star",
      X: null,
      ga: 6,
      Ra: 0,
      La: 30
    },
    br: {
      ta: "连锁闪电",
      description: "伤害多个敌人",
      ca: "Gold Sparkles",
      ya: null,
      X: null,
      ga: 5,
      Ra: 0,
      La: 25
    }
  };
  fireSpellDefinitions = {
    rD: {
      ta: "火环",
      description: "火焰之环",
      ca: "Yellow Fire Ring",
      ya: "Yellow Star",
      X: null,
      ga: 4,
      Ra: 0,
      La: 13,
      bo: true
    },
    Lz: {
      ta: "火雨",
      description: "轰轰烈烈的死亡.",
      ca: "Fire Rain",
      ya: "Yellow Star",
      X: null,
      ga: 6,
      Ra: 0,
      La: 40
    },
    Kz: {
      ta: "火球",
      description: "爆裂火焰",
      ca: "Orange Sparkles",
      ya: "Yellow Star",
      X: null,
      ga: 8,
      Ra: 0,
      La: 35
    },
    TE: {
      ta: "转变怪物",
      description: "怪物攻击怪物",
      ca: "Red Eye Blink",
      ya: "Pink Star",
      X: 4,
      ga: 2,
      td: true,
      Ra: 0,
      La: 20
    }
  };
  poisonCloudSpell = {
    ta: "毒环",
    description: "剧毒的光环",
    ca: "Green Ring",
    ya: "Green Star",
    X: null,
    ga: 4,
    Ra: 10,
    La: 13,
    bo: true
  };
  priestSpellDefinitions = {
    yD: {
      ta: "治疗",
      description: "恢复35%生命",
      ca: "Red Crosses",
      ya: "Red Crosses",
      X: null,
      ga: 1,
      Ra: 35,
      La: 20
    },
    xE: {
      ta: "复活",
      description: "移除昏迷效果",
      ca: "White Crosses",
      ya: "White Crosses",
      X: null,
      ga: 16,
      Ra: 1,
      td: true,
      La: 20
    },
    Zz: {
      ta: "提高护甲",
      description: "10%队伍护甲",
      ca: "Shields",
      ya: null,
      X: 5,
      ga: 3,
      Ra: 10,
      td: true,
      La: 700
    },
    FD: {
      ta: "提高伤害",
      description: "10%队伍伤害",
      ca: "Arm Flex",
      ya: null,
      X: 6,
      ga: 3,
      Ra: 10,
      td: true,
      La: 700
    },
    ED: {
      ta: "提高攻击等级",
      description: "10%队伍攻击等级",
      ca: "Eagle",
      ya: null,
      X: 7,
      ga: 3,
      Ra: 10,
      td: true,
      La: 700
    },
    $z: {
      ta: "提高防御等级",
      description: "10%队伍防御等级",
      ca: "Armor",
      ya: null,
      X: 8,
      ga: 3,
      Ra: 10,
      td: true,
      La: 700
    }
  };
  fighterSpellDefinitions = {
    ME: {
      ta: "嘲讽",
      description: "吸引怪物攻击战士",
      ca: "Target",
      ya: null,
      X: 10,
      ga: 2,
      td: true,
      Ra: 50,
      La: 30
    }
  };
  rogueSpellDefinitions = {
    IB: {
      ta: "潜行",
      description: "潜行背刺",
      ca: "Color Spiral",
      ya: null,
      X: 11,
      ga: 2,
      td: true,
      Ra: 100,
      La: 30
    },
    ID: {
      ta: "立即搜索",
      description: "快速搜索",
      ca: "Gold Sparkles",
      ya: null,
      X: null,
      ga: 14,
      td: true,
      Ra: 0,
      La: 10
    },
    wu: {
      ta: "发现财宝箱",
      description: "自动搜索",
      ca: "Blue Sparkles",
      ya: null,
      X: null,
      ga: 15,
      td: true,
      Ra: 0,
      La: 10
    }
  };
  barbarianSpellDefinitions = {
    rE: {
      ta: "愤怒",
      description: "极大地提高伤害",
      ca: "Totems",
      ya: null,
      X: 12,
      ga: 2,
      td: true,
      Ra: 100,
      La: 40
    },
    wB: {
      ta: "重锤",
      description: "溅射伤害+击退",
      ca: "Red Sparkles",
      ya: null,
      X: null,
      ga: 8,
      Ra: 0,
      La: 25
    }
  };
  necromancerSpellDefinitions = {
    CD: {
      ta: "痛苦",
      description: "对怪物无情",
      ca: "Skull Cross",
      ya: "Skull Cross",
      X: null,
      ga: 4,
      Ra: 0,
      La: 13,
      bo: true
    },
    xD: {
      ta: "绿色死亡",
      description: "弹跳死亡",
      ca: "Green Skull",
      ya: "Green Skull",
      X: null,
      ga: 13,
      Ra: 0,
      La: 20
    },
    OB: {
      ta: "骷髅军队",
      description: "骷髅复活!",
      ca: "Red Damage",
      ya: "Green Projectile",
      X: null,
      ga: 11,
      Ra: 1,
      La: 25
    },
    NB: {
      ta: "幽灵骷髅",
      description: "法师同伴",
      ca: "Red Damage",
      ya: null,
      X: null,
      ga: 9,
      Ra: 1,
      La: 25
    }
  };
  druidSpellDefinitions = {
    PB: {
      ta: "狼群",
      description: "召唤狼群",
      ca: "Red Damage",
      ya: null,
      X: null,
      ga: 10,
      Ra: 1,
      La: 25,
      bo: true
    },
    LB: {
      ta: "狗狗守卫",
      description: "犬科伙伴",
      ca: "Red Damage",
      ya: null,
      X: null,
      ga: 9,
      Ra: 1,
      La: 25
    },
    cE: {
      ta: "小型治疗术",
      description: "回复25%生命",
      ca: "Red Crosses",
      ya: "Red Crosses",
      X: null,
      ga: 1,
      Ra: 25,
      La: 25
    },
    DE: {
      ta: "睡眠",
      description: "怪物陷入睡眠",
      ca: "Sleep",
      ya: "Pink Star",
      X: 0,
      ga: 2,
      td: true,
      Ra: 0,
      La: 20
    }
  };
  ninjaSpellDefinitions = {
    Hx: {
      ta: "快速打击",
      description: "怪物迅速死亡",
      ca: "White Damage",
      ya: "Grey Bullet",
      X: null,
      ga: 12,
      td: false,
      Ra: 100,
      La: 30
    }
  };
  chickenSpellDefinitions = {
    KB: {
      ta: "召唤鸡群",
      description: "鸡王标配法术",
      ca: "Red Damage",
      ya: null,
      X: null,
      ga: 17,
      Ra: 1,
      La: 25,
      bo: true
    },
    MB: {
      ta: "小鸡守卫",
      description: "小鸡伙伴",
      ca: "Red Damage",
      ya: null,
      X: null,
      ga: 9,
      Ra: 1,
      La: 25
    }
  };
}
