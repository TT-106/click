/** 从原始组合根独立出的配置数据。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { AnimationCatalog, AnimationSheet } from "../rendering/sprites.js";
export function createAnimationCatalog() {
  return new AnimationCatalog([new AnimationSheet("spritesheet/SpellFXAnim1.png", 31, [{
    animationName: "Gold Sparkles",
    O: 0,
    P: 0,
    M: 7,
    N: 0
  }, {
    animationName: "Green Sparkles",
    O: 0,
    P: 1,
    M: 7,
    N: 1
  }, {
    animationName: "Blue Sparkles",
    O: 0,
    P: 2,
    M: 7,
    N: 2
  }, {
    animationName: "Orange Sparkles",
    O: 0,
    P: 3,
    M: 7,
    N: 3
  }, {
    animationName: "Pink Sparkles",
    O: 0,
    P: 4,
    M: 7,
    N: 4
  }, {
    animationName: "Red Sparkles",
    O: 0,
    P: 5,
    M: 7,
    N: 5
  }, {
    animationName: "Green Skull",
    O: 0,
    P: 6,
    M: 7,
    N: 6
  }, {
    animationName: "Yellow Key",
    O: 0,
    P: 7,
    M: 7,
    N: 7
  }, {
    animationName: "Skull Cross",
    O: 0,
    P: 8,
    M: 7,
    N: 8
  }, {
    animationName: "Shields",
    O: 0,
    P: 9,
    M: 7,
    N: 9
  }, {
    animationName: "Red Crosses",
    O: 0,
    P: 10,
    M: 7,
    N: 10
  }, {
    animationName: "Fire Ring",
    O: 0,
    P: 11,
    M: 7,
    N: 11
  }, {
    animationName: "Ice Ring",
    O: 0,
    P: 12,
    M: 7,
    N: 12
  }, {
    animationName: "Green Ring",
    O: 0,
    P: 13,
    M: 7,
    N: 13
  }, {
    animationName: "Pink Ring",
    O: 0,
    P: 14,
    M: 7,
    N: 14
  }, {
    animationName: "Yellow Star",
    O: 0,
    P: 15,
    M: 7,
    N: 15
  }, {
    animationName: "Blue Star",
    O: 0,
    P: 16,
    M: 7,
    N: 16
  }, {
    animationName: "Green Star",
    O: 0,
    P: 17,
    M: 7,
    N: 17
  }, {
    animationName: "White Crosses",
    O: 0,
    P: 18,
    M: 7,
    N: 18
  }, {
    animationName: "Spider Web",
    O: 0,
    P: 19,
    M: 7,
    N: 19
  }, {
    animationName: "Torch",
    O: 0,
    P: 20,
    M: 7,
    N: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim2.png", 31, [{
    animationName: "Frost",
    O: 0,
    P: 0,
    M: 7,
    N: 1
  }, {
    animationName: "Yellow Star Circle",
    O: 0,
    P: 2,
    M: 6,
    N: 3
  }, {
    animationName: "Circles",
    O: 0,
    P: 4,
    M: 4,
    N: 5
  }, {
    animationName: "Gold Shield Spiral",
    O: 0,
    P: 6,
    M: 7,
    N: 7
  }, {
    animationName: "Green Shield Spiral",
    O: 0,
    P: 8,
    M: 7,
    N: 9
  }, {
    animationName: "Blue Shield Spiral",
    O: 0,
    P: 10,
    M: 7,
    N: 11
  }, {
    animationName: "Pink Shield Spiral",
    O: 0,
    P: 12,
    M: 7,
    N: 13
  }, {
    animationName: "Blue Firework",
    O: 0,
    P: 14,
    M: 7,
    N: 15
  }, {
    animationName: "Red Firework",
    O: 0,
    P: 16,
    M: 7,
    N: 17
  }, {
    animationName: "Bubbles",
    O: 0,
    P: 18,
    M: 2,
    N: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim3.png", 31, [{
    animationName: "Shield",
    O: 0,
    P: 0,
    M: 7,
    N: 1
  }, {
    animationName: "Color Spiral",
    O: 0,
    P: 2,
    M: 7,
    N: 3
  }, {
    animationName: "Arm Flex",
    O: 0,
    P: 4,
    M: 4,
    N: 5
  }, {
    animationName: "Super Speed",
    O: 0,
    P: 6,
    M: 7,
    N: 7
  }, {
    animationName: "Target",
    O: 0,
    P: 8,
    M: 7,
    N: 9
  }, {
    animationName: "Yellow Shield Spiral",
    O: 0,
    P: 10,
    M: 6,
    N: 11
  }, {
    animationName: "Pink Star Circle",
    O: 0,
    P: 12,
    M: 6,
    N: 13
  }, {
    animationName: "Blue Star Circle",
    O: 0,
    P: 14,
    M: 6,
    N: 15
  }, {
    animationName: "Green Star Circle",
    O: 0,
    P: 16,
    M: 6,
    N: 17
  }, {
    animationName: "Gold Star Circle",
    O: 0,
    P: 18,
    M: 6,
    N: 19
  }, {
    animationName: "Bread",
    O: 0,
    P: 20,
    M: 7,
    N: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim4.png", 31, [{
    animationName: "Yellow Fire Ring",
    O: 0,
    P: 0,
    M: 7,
    N: 0
  }, {
    animationName: "Totems",
    O: 0,
    P: 1,
    M: 7,
    N: 1
  }, {
    animationName: "Eye Blink",
    O: 0,
    P: 2,
    M: 7,
    N: 2
  }, {
    animationName: "Pink Star",
    O: 0,
    P: 3,
    M: 7,
    N: 3
  }, {
    animationName: "Orange Star",
    O: 0,
    P: 4,
    M: 7,
    N: 4
  }, {
    animationName: "Red Eye Blink",
    O: 0,
    P: 5,
    M: 6,
    N: 6
  }, {
    animationName: "Eagle",
    O: 0,
    P: 7,
    M: 7,
    N: 7
  }, {
    animationName: "Sleep",
    O: 0,
    P: 8,
    M: 6,
    N: 9
  }, {
    animationName: "Armor",
    O: 0,
    P: 10,
    M: 7,
    N: 10
  }, {
    animationName: "Blind Eye Blink",
    O: 0,
    P: 11,
    M: 7,
    N: 11
  }, {
    animationName: "Fire Rain",
    O: 0,
    P: 12,
    M: 7,
    N: 14
  }, {
    animationName: "Blue Rain",
    O: 0,
    P: 15,
    M: 7,
    N: 17
  }, {
    animationName: "Green Rain",
    O: 0,
    P: 18,
    M: 7,
    N: 20
  }], 7), new AnimationSheet("spritesheet/SpellFXAnim5.png", 31, [{
    animationName: "Lightning Rain",
    O: 0,
    P: 0,
    M: 7,
    N: 2
  }, {
    animationName: "Pink Rain",
    O: 0,
    P: 3,
    M: 7,
    N: 5
  }, {
    animationName: "Rainbow Rain",
    O: 0,
    P: 6,
    M: 7,
    N: 8
  }], 7), new AnimationSheet("spritesheet/DamageFX.png", 32, [{
    animationName: "Red Damage",
    O: 0,
    P: 0,
    M: 2,
    N: 0
  }, {
    animationName: "White Damage",
    O: 0,
    P: 1,
    M: 2,
    N: 1
  }, {
    animationName: "Blue Damage",
    O: 0,
    P: 2,
    M: 2,
    N: 2
  }, {
    animationName: "Green Damage",
    O: 0,
    P: 3,
    M: 2,
    N: 3
  }, {
    animationName: "Red Splat",
    O: 0,
    P: 4,
    M: 2,
    N: 4
  }, {
    animationName: "Electric Damage",
    O: 0,
    P: 5,
    M: 2,
    N: 5
  }, {
    animationName: "Fire Damage",
    O: 0,
    P: 6,
    M: 2,
    N: 6
  }, {
    animationName: "Poison Damage",
    O: 0,
    P: 7,
    M: 2,
    N: 7
  }, {
    animationName: "Sonic Damage",
    O: 0,
    P: 8,
    M: 2,
    N: 8
  }, {
    animationName: "Pink Damage",
    O: 0,
    P: 9,
    M: 2,
    N: 9
  }], 2), new AnimationSheet("spritesheet/SpellFXMissiles.png", 31, [{
    animationName: "Red Arrow",
    O: 0,
    P: 0,
    M: 7,
    N: 0,
    zc: true
  }, {
    animationName: "Green Arrow",
    O: 0,
    P: 1,
    M: 7,
    N: 1,
    zc: true
  }, {
    animationName: "Pink Arrow",
    O: 0,
    P: 2,
    M: 7,
    N: 2,
    zc: true
  }, {
    animationName: "Pink Lightning",
    O: 0,
    P: 3,
    M: 7,
    N: 3,
    zc: true
  }, {
    animationName: "Green Projectile",
    O: 0,
    P: 4,
    M: 7,
    N: 4,
    zc: true
  }, {
    animationName: "Small Green Projectiles",
    O: 0,
    P: 5,
    M: 7,
    N: 5,
    zc: true
  }, {
    animationName: "Fire Projectile",
    O: 0,
    P: 6,
    M: 7,
    N: 6,
    zc: true
  }, {
    animationName: "Fire Arrow",
    O: 0,
    P: 7,
    M: 7,
    N: 7,
    zc: true
  }, {
    animationName: "Ice Projectile",
    O: 0,
    P: 8,
    M: 7,
    N: 8,
    zc: true
  }, {
    animationName: "Ice Arrow",
    O: 0,
    P: 9,
    M: 7,
    N: 9,
    zc: true
  }, {
    animationName: "Lightning",
    O: 0,
    P: 10,
    M: 7,
    N: 10,
    zc: true
  }, {
    animationName: "Lightning Arrow",
    O: 0,
    P: 11,
    M: 7,
    N: 11,
    zc: true
  }, {
    animationName: "Grey Bullet",
    O: 0,
    P: 12,
    M: 7,
    N: 12,
    zc: true
  }, {
    animationName: "Yellow Bullet",
    O: 0,
    P: 13,
    M: 7,
    N: 13,
    zc: true
  }, {
    animationName: "Ninja Star",
    O: 0,
    P: 14,
    M: 7,
    N: 14,
    zc: true
  }, {
    animationName: "Pink Star Projectile",
    O: 0,
    P: 15,
    M: 7,
    N: 15,
    zc: true
  }, {
    animationName: "Web",
    O: 0,
    P: 16,
    M: 7,
    N: 16,
    zc: true
  }, {
    animationName: "Pink Ball Projectile",
    O: 0,
    P: 17,
    M: 7,
    N: 17,
    zc: true
  }], 7)]);
}
export function initializeContentAnimations() {}
