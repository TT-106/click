/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
// 渲染类由 runtime/game.js 在组合根处提供，素材表只描述动画数据。
export function createAnimationCatalog({ AnimationCatalog, AnimationSheet }) {
  return new AnimationCatalog([new AnimationSheet("spritesheet/SpellFXAnim1.png", 31, [{
    animationName: "Gold Sparkles",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 7,
    lastFrameRow: 0
  }, {
    animationName: "Green Sparkles",
    firstFrameColumn: 0,
    firstFrameRow: 1,
    lastRowFrameCount: 7,
    lastFrameRow: 1
  }, {
    animationName: "Blue Sparkles",
    firstFrameColumn: 0,
    firstFrameRow: 2,
    lastRowFrameCount: 7,
    lastFrameRow: 2
  }, {
    animationName: "Orange Sparkles",
    firstFrameColumn: 0,
    firstFrameRow: 3,
    lastRowFrameCount: 7,
    lastFrameRow: 3
  }, {
    animationName: "Pink Sparkles",
    firstFrameColumn: 0,
    firstFrameRow: 4,
    lastRowFrameCount: 7,
    lastFrameRow: 4
  }, {
    animationName: "Red Sparkles",
    firstFrameColumn: 0,
    firstFrameRow: 5,
    lastRowFrameCount: 7,
    lastFrameRow: 5
  }, {
    animationName: "Green Skull",
    firstFrameColumn: 0,
    firstFrameRow: 6,
    lastRowFrameCount: 7,
    lastFrameRow: 6
  }, {
    animationName: "Yellow Key",
    firstFrameColumn: 0,
    firstFrameRow: 7,
    lastRowFrameCount: 7,
    lastFrameRow: 7
  }, {
    animationName: "Skull Cross",
    firstFrameColumn: 0,
    firstFrameRow: 8,
    lastRowFrameCount: 7,
    lastFrameRow: 8
  }, {
    animationName: "Shields",
    firstFrameColumn: 0,
    firstFrameRow: 9,
    lastRowFrameCount: 7,
    lastFrameRow: 9
  }, {
    animationName: "Red Crosses",
    firstFrameColumn: 0,
    firstFrameRow: 10,
    lastRowFrameCount: 7,
    lastFrameRow: 10
  }, {
    animationName: "Fire Ring",
    firstFrameColumn: 0,
    firstFrameRow: 11,
    lastRowFrameCount: 7,
    lastFrameRow: 11
  }, {
    animationName: "Ice Ring",
    firstFrameColumn: 0,
    firstFrameRow: 12,
    lastRowFrameCount: 7,
    lastFrameRow: 12
  }, {
    animationName: "Green Ring",
    firstFrameColumn: 0,
    firstFrameRow: 13,
    lastRowFrameCount: 7,
    lastFrameRow: 13
  }, {
    animationName: "Pink Ring",
    firstFrameColumn: 0,
    firstFrameRow: 14,
    lastRowFrameCount: 7,
    lastFrameRow: 14
  }, {
    animationName: "Yellow Star",
    firstFrameColumn: 0,
    firstFrameRow: 15,
    lastRowFrameCount: 7,
    lastFrameRow: 15
  }, {
    animationName: "Blue Star",
    firstFrameColumn: 0,
    firstFrameRow: 16,
    lastRowFrameCount: 7,
    lastFrameRow: 16
  }, {
    animationName: "Green Star",
    firstFrameColumn: 0,
    firstFrameRow: 17,
    lastRowFrameCount: 7,
    lastFrameRow: 17
  }, {
    animationName: "White Crosses",
    firstFrameColumn: 0,
    firstFrameRow: 18,
    lastRowFrameCount: 7,
    lastFrameRow: 18
  }, {
    animationName: "Spider Web",
    firstFrameColumn: 0,
    firstFrameRow: 19,
    lastRowFrameCount: 7,
    lastFrameRow: 19
  }, {
    animationName: "Torch",
    firstFrameColumn: 0,
    firstFrameRow: 20,
    lastRowFrameCount: 7,
    lastFrameRow: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim2.png", 31, [{
    animationName: "Frost",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 7,
    lastFrameRow: 1
  }, {
    animationName: "Yellow Star Circle",
    firstFrameColumn: 0,
    firstFrameRow: 2,
    lastRowFrameCount: 6,
    lastFrameRow: 3
  }, {
    animationName: "Circles",
    firstFrameColumn: 0,
    firstFrameRow: 4,
    lastRowFrameCount: 4,
    lastFrameRow: 5
  }, {
    animationName: "Gold Shield Spiral",
    firstFrameColumn: 0,
    firstFrameRow: 6,
    lastRowFrameCount: 7,
    lastFrameRow: 7
  }, {
    animationName: "Green Shield Spiral",
    firstFrameColumn: 0,
    firstFrameRow: 8,
    lastRowFrameCount: 7,
    lastFrameRow: 9
  }, {
    animationName: "Blue Shield Spiral",
    firstFrameColumn: 0,
    firstFrameRow: 10,
    lastRowFrameCount: 7,
    lastFrameRow: 11
  }, {
    animationName: "Pink Shield Spiral",
    firstFrameColumn: 0,
    firstFrameRow: 12,
    lastRowFrameCount: 7,
    lastFrameRow: 13
  }, {
    animationName: "Blue Firework",
    firstFrameColumn: 0,
    firstFrameRow: 14,
    lastRowFrameCount: 7,
    lastFrameRow: 15
  }, {
    animationName: "Red Firework",
    firstFrameColumn: 0,
    firstFrameRow: 16,
    lastRowFrameCount: 7,
    lastFrameRow: 17
  }, {
    animationName: "Bubbles",
    firstFrameColumn: 0,
    firstFrameRow: 18,
    lastRowFrameCount: 2,
    lastFrameRow: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim3.png", 31, [{
    animationName: "Shield",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 7,
    lastFrameRow: 1
  }, {
    animationName: "Color Spiral",
    firstFrameColumn: 0,
    firstFrameRow: 2,
    lastRowFrameCount: 7,
    lastFrameRow: 3
  }, {
    animationName: "Arm Flex",
    firstFrameColumn: 0,
    firstFrameRow: 4,
    lastRowFrameCount: 4,
    lastFrameRow: 5
  }, {
    animationName: "Super Speed",
    firstFrameColumn: 0,
    firstFrameRow: 6,
    lastRowFrameCount: 7,
    lastFrameRow: 7
  }, {
    animationName: "Target",
    firstFrameColumn: 0,
    firstFrameRow: 8,
    lastRowFrameCount: 7,
    lastFrameRow: 9
  }, {
    animationName: "Yellow Shield Spiral",
    firstFrameColumn: 0,
    firstFrameRow: 10,
    lastRowFrameCount: 6,
    lastFrameRow: 11
  }, {
    animationName: "Pink Star Circle",
    firstFrameColumn: 0,
    firstFrameRow: 12,
    lastRowFrameCount: 6,
    lastFrameRow: 13
  }, {
    animationName: "Blue Star Circle",
    firstFrameColumn: 0,
    firstFrameRow: 14,
    lastRowFrameCount: 6,
    lastFrameRow: 15
  }, {
    animationName: "Green Star Circle",
    firstFrameColumn: 0,
    firstFrameRow: 16,
    lastRowFrameCount: 6,
    lastFrameRow: 17
  }, {
    animationName: "Gold Star Circle",
    firstFrameColumn: 0,
    firstFrameRow: 18,
    lastRowFrameCount: 6,
    lastFrameRow: 19
  }, {
    animationName: "Bread",
    firstFrameColumn: 0,
    firstFrameRow: 20,
    lastRowFrameCount: 7,
    lastFrameRow: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim4.png", 31, [{
    animationName: "Yellow Fire Ring",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 7,
    lastFrameRow: 0
  }, {
    animationName: "Totems",
    firstFrameColumn: 0,
    firstFrameRow: 1,
    lastRowFrameCount: 7,
    lastFrameRow: 1
  }, {
    animationName: "Eye Blink",
    firstFrameColumn: 0,
    firstFrameRow: 2,
    lastRowFrameCount: 7,
    lastFrameRow: 2
  }, {
    animationName: "Pink Star",
    firstFrameColumn: 0,
    firstFrameRow: 3,
    lastRowFrameCount: 7,
    lastFrameRow: 3
  }, {
    animationName: "Orange Star",
    firstFrameColumn: 0,
    firstFrameRow: 4,
    lastRowFrameCount: 7,
    lastFrameRow: 4
  }, {
    animationName: "Red Eye Blink",
    firstFrameColumn: 0,
    firstFrameRow: 5,
    lastRowFrameCount: 6,
    lastFrameRow: 6
  }, {
    animationName: "Eagle",
    firstFrameColumn: 0,
    firstFrameRow: 7,
    lastRowFrameCount: 7,
    lastFrameRow: 7
  }, {
    animationName: "Sleep",
    firstFrameColumn: 0,
    firstFrameRow: 8,
    lastRowFrameCount: 6,
    lastFrameRow: 9
  }, {
    animationName: "Armor",
    firstFrameColumn: 0,
    firstFrameRow: 10,
    lastRowFrameCount: 7,
    lastFrameRow: 10
  }, {
    animationName: "Blind Eye Blink",
    firstFrameColumn: 0,
    firstFrameRow: 11,
    lastRowFrameCount: 7,
    lastFrameRow: 11
  }, {
    animationName: "Fire Rain",
    firstFrameColumn: 0,
    firstFrameRow: 12,
    lastRowFrameCount: 7,
    lastFrameRow: 14
  }, {
    animationName: "Blue Rain",
    firstFrameColumn: 0,
    firstFrameRow: 15,
    lastRowFrameCount: 7,
    lastFrameRow: 17
  }, {
    animationName: "Green Rain",
    firstFrameColumn: 0,
    firstFrameRow: 18,
    lastRowFrameCount: 7,
    lastFrameRow: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim5.png", 31, [{
    animationName: "Lightning Rain",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 7,
    lastFrameRow: 2
  }, {
    animationName: "Pink Rain",
    firstFrameColumn: 0,
    firstFrameRow: 3,
    lastRowFrameCount: 7,
    lastFrameRow: 5
  }, {
    animationName: "Rainbow Rain",
    firstFrameColumn: 0,
    firstFrameRow: 6,
    lastRowFrameCount: 7,
    lastFrameRow: 8
  }], 7), new AnimationSheet("spritesheet/DamageFX.png", 32, [{
    animationName: "Red Damage",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 2,
    lastFrameRow: 0
  }, {
    animationName: "White Damage",
    firstFrameColumn: 0,
    firstFrameRow: 1,
    lastRowFrameCount: 2,
    lastFrameRow: 1
  }, {
    animationName: "Blue Damage",
    firstFrameColumn: 0,
    firstFrameRow: 2,
    lastRowFrameCount: 2,
    lastFrameRow: 2
  }, {
    animationName: "Green Damage",
    firstFrameColumn: 0,
    firstFrameRow: 3,
    lastRowFrameCount: 2,
    lastFrameRow: 3
  }, {
    animationName: "Red Splat",
    firstFrameColumn: 0,
    firstFrameRow: 4,
    lastRowFrameCount: 2,
    lastFrameRow: 4
  }, {
    animationName: "Electric Damage",
    firstFrameColumn: 0,
    firstFrameRow: 5,
    lastRowFrameCount: 2,
    lastFrameRow: 5
  }, {
    animationName: "Fire Damage",
    firstFrameColumn: 0,
    firstFrameRow: 6,
    lastRowFrameCount: 2,
    lastFrameRow: 6
  }, {
    animationName: "Poison Damage",
    firstFrameColumn: 0,
    firstFrameRow: 7,
    lastRowFrameCount: 2,
    lastFrameRow: 7
  }, {
    animationName: "Sonic Damage",
    firstFrameColumn: 0,
    firstFrameRow: 8,
    lastRowFrameCount: 2,
    lastFrameRow: 8
  }, {
    animationName: "Pink Damage",
    firstFrameColumn: 0,
    firstFrameRow: 9,
    lastRowFrameCount: 2,
    lastFrameRow: 9
  }], 2), new AnimationSheet("spritesheet/SpellFXMissiles.png", 31, [{
    animationName: "Red Arrow",
    firstFrameColumn: 0,
    firstFrameRow: 0,
    lastRowFrameCount: 7,
    lastFrameRow: 0,
    isDirectional: true
  }, {
    animationName: "Green Arrow",
    firstFrameColumn: 0,
    firstFrameRow: 1,
    lastRowFrameCount: 7,
    lastFrameRow: 1,
    isDirectional: true
  }, {
    animationName: "Pink Arrow",
    firstFrameColumn: 0,
    firstFrameRow: 2,
    lastRowFrameCount: 7,
    lastFrameRow: 2,
    isDirectional: true
  }, {
    animationName: "Pink Lightning",
    firstFrameColumn: 0,
    firstFrameRow: 3,
    lastRowFrameCount: 7,
    lastFrameRow: 3,
    isDirectional: true
  }, {
    animationName: "Green Projectile",
    firstFrameColumn: 0,
    firstFrameRow: 4,
    lastRowFrameCount: 7,
    lastFrameRow: 4,
    isDirectional: true
  }, {
    animationName: "Small Green Projectiles",
    firstFrameColumn: 0,
    firstFrameRow: 5,
    lastRowFrameCount: 7,
    lastFrameRow: 5,
    isDirectional: true
  }, {
    animationName: "Fire Projectile",
    firstFrameColumn: 0,
    firstFrameRow: 6,
    lastRowFrameCount: 7,
    lastFrameRow: 6,
    isDirectional: true
  }, {
    animationName: "Fire Arrow",
    firstFrameColumn: 0,
    firstFrameRow: 7,
    lastRowFrameCount: 7,
    lastFrameRow: 7,
    isDirectional: true
  }, {
    animationName: "Ice Projectile",
    firstFrameColumn: 0,
    firstFrameRow: 8,
    lastRowFrameCount: 7,
    lastFrameRow: 8,
    isDirectional: true
  }, {
    animationName: "Ice Arrow",
    firstFrameColumn: 0,
    firstFrameRow: 9,
    lastRowFrameCount: 7,
    lastFrameRow: 9,
    isDirectional: true
  }, {
    animationName: "Lightning",
    firstFrameColumn: 0,
    firstFrameRow: 10,
    lastRowFrameCount: 7,
    lastFrameRow: 10,
    isDirectional: true
  }, {
    animationName: "Lightning Arrow",
    firstFrameColumn: 0,
    firstFrameRow: 11,
    lastRowFrameCount: 7,
    lastFrameRow: 11,
    isDirectional: true
  }, {
    animationName: "Grey Bullet",
    firstFrameColumn: 0,
    firstFrameRow: 12,
    lastRowFrameCount: 7,
    lastFrameRow: 12,
    isDirectional: true
  }, {
    animationName: "Yellow Bullet",
    firstFrameColumn: 0,
    firstFrameRow: 13,
    lastRowFrameCount: 7,
    lastFrameRow: 13,
    isDirectional: true
  }, {
    animationName: "Ninja Star",
    firstFrameColumn: 0,
    firstFrameRow: 14,
    lastRowFrameCount: 7,
    lastFrameRow: 14,
    isDirectional: true
  }, {
    animationName: "Pink Star Projectile",
    firstFrameColumn: 0,
    firstFrameRow: 15,
    lastRowFrameCount: 7,
    lastFrameRow: 15,
    isDirectional: true
  }, {
    animationName: "Web",
    firstFrameColumn: 0,
    firstFrameRow: 16,
    lastRowFrameCount: 7,
    lastFrameRow: 16,
    isDirectional: true
  }, {
    animationName: "Pink Ball Projectile",
    firstFrameColumn: 0,
    firstFrameRow: 17,
    lastRowFrameCount: 7,
    lastFrameRow: 17,
    isDirectional: true
  }], 7)]);
}
export function initializeContentAnimations() {}
