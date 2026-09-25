/** 原版组队规则及创建动作。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
import { TabView } from "./navigation.js";
import { clearElement, clearElementById, createElement, getElement, hideElement, showElement } from "./dom.js";
import { game } from "../runtime/game.js";
import { adventurerClasses } from "../content/classes.js";
import { Character, hasUnspentSkills } from "../characters/character.js";
import { ADVENTURER_TYPE } from "../ai/targeting.js";
import { Inventory } from "../loot/inventory.js";
import { applyLevelStats, chooseScrollCaster, createBehaviorQueue, refreshUnspentSkillFlags } from "../simulation/characters.js";
import { refreshPartyLevels } from "../characters/party.js";
import { generateItem } from "../loot/items.js";
import { placePartyInWorld } from "../world/terrain.js";
import { unlockStartingRegion } from "../world/regions.js";
import { recordGameEvent } from "../core/math.js";
import { partyCapacityBonus } from "../content/balance.js";
export function PartyCreationView(a) {
  this.elementId = "partyCreationTabContent";
  this.C = a;
  this.selectedCharacters = [];
  this.cr = [];
  this.validParty = false;
  this.rx = null;
  this.tz = this.zr = this.jm = false;
  this.startButton = this.oo = null;
  this.ql = false;
}
export function mountPartyCreation(a) {
  var b = getElement(a.elementId);
  clearElement(b);
  mountPartyIntroduction(b);
  mountClassChoices(a, b);
  mountSelectedParty(a, b);
  b = createElement("div", b, null, "partyConfirmationPanel");
  a.startButton = createElement("div", b, "startQuestButton", "disabledUpgradeButton");
  a.startButton.style.padding = "15px";
  a.startButton.style.textAlign = "center";
  a.startButton.innerHTML = getPartyCapacityLabel();
  a.startButton.onclick = function () {
    if (!(1 > a.selectedCharacters.length) && a.validParty) {
      var b = a.selectedCharacters,
        d,
        f,
        g,
        h = "";
      for (d = 0; d < b.length; d++) {
        f = b[d].classIndex;
        f = adventurerClasses[f];
        g = b[d].defaultName;
        var l = f.spriteName;
        g = new Character(g, ADVENTURER_TYPE, f.characterClass, f, new Inventory());
        var n = g.stats;
        g.ee = game.monsterSprites.getSprite(l);
        l = createBehaviorQueue(f.nb());
        g.behaviors = l;
        n.baseAttackCooldown = 12;
        n.baseHealthRegenPercent = 2;
        n.baseSpiritRegenPercent = 3;
        n.characterLevel = 1;
        l = Math.min(40, game.state.victoryCount);
        if (0 < l) {
          var p = g;
          p.skillPoints = l;
          p.hasUnspentSkills = hasUnspentSkills(p);
        }
        if (f.fe) {
          g.initialSpellSkillPoint = 1;
        }
        refreshPartyLevels();
        for (var l = g.Z, s = p = undefined, s = 0; s < l.length; s++) {
          if (p = generateItem(game.itemGenerator, l[s], g, 1, 0)) {
            g.Qk(p);
          }
        }
        applyLevelStats(n, 1, f.Ma);
        f = g;
        game.state.adventurers.push(f);
        if (0 < d) {
          h += ", ";
        }
        h += f.classDefinition.className;
      }
      game.state.leader = game.state.adventurers[0];
      game.state.scrollCaster = chooseScrollCaster();
      game.partyCreated = true;
      placePartyInWorld();
      unlockStartingRegion();
      refreshUnspentSkillFlags();
      game.allies.reset();
      game.view.reset();
      recordGameEvent("Party Creation", h);
    }
  };
}
export function mountPartyIntroduction(a) {
  a = createElement("div", a, "partyCreationHeader", "partyCreationIntroductionPanel");
  var b = createElement("div", a, null, "sectionTitle");
  b.style.fontSize = "14px";
  b.innerHTML = "末日大陆需要你的力量!";
  b = createElement("p", a, null, null);
  b.style.fontSize = "13px";
  b.innerHTML = "所有地牢,被遗忘的神庙,封禁的高塔,黑暗矿洞,拷问室,和幽闭的洞穴,那些曾经一片美好的地方,环境优美宜人,都陷入怪物的蹂躏之下,你要做的只有杀戮.";
  a = createElement("p", a, null, null);
  a.style.fontSize = "13px";
  a.innerHTML = "只有你有这个能力让一切回归旧貌,选择你的队友,杀光大陆上所有的怪物.";
}
export function getPartyCapacityLabel() {
  var a = 4 + partyCapacityBonus.t;
  if (4 === a) {
    return "最多选择4名队员";
  }
  if (5 === a) {
    return "最多选择5名队员";
  }
}
export function mountClassChoices(a, b) {
  var c = createElement("div", b, null, "partySelectionHeaderContainer");
  createElement("span", c, null, "partySelectionHeaderSpan").innerHTML = getPartyCapacityLabel();
  var c = createElement("div", b, null, "partySelectionPanel"),
    c = createElement("table", c, null, "partySelectionTable"),
    d = null,
    f = 0,
    g,
    h;
  for (h = 0; h < adventurerClasses.length; h++) {
    if (d = c.insertRow(f), f++, g = d.insertCell(0), d = game.state.victoryCount < adventurerClasses[h].requiredVictories) {
      var d = a,
        l = h;
      g = createElement("table", g, null, "lockedCharacterSelectionTable").insertRow(0).insertCell(0);
      var n = game.monsterSprites.getSprite(adventurerClasses[l].spriteName),
        p = createElement("img", g, null, "characterImage");
      p.src = "images/Transparent.gif";
      p.style.height = "35px";
      p.style.width = "35px";
      p.style.background = "url('spritesheet/monsters.png') -" + (n.sourceX + 10) + "px -" + (n.sourceY + 12) + "px";
      g = createElement("div", g, null, null);
      n = undefined;
      switch (adventurerClasses[l].requiredVictories) {
        case 0:
          n = "角色已经解锁了(bug?)";
          break;
        case 1:
          n = "二周目时解锁该角色";
          break;
        case 2:
          n = "三周目时解锁该角色";
          break;
        case 3:
          n = "四周目时解锁该角色";
          break;
        case 4:
          n = "五周目时解锁该角色";
          break;
        case 5:
          n = "六周目时解锁该角色";
          break;
        case 6:
          n = "七周目时解锁该角色";
          break;
        default:
          n = "稍后解锁该角色";
      }
      g.innerHTML = n;
      d.cr.push(null);
    } else {
      mountClassChoice(a, g, h);
    }
  }
}
export function mountSelectedParty(a, b) {
  var c = createElement("div", b, null, "selectedCharactersHeaderContainer");
  createElement("span", c, null, "partySelectionHeaderSpan").innerHTML = "已选择角色";
  c = createElement("div", b, null, "selectedCharactersPanel");
  a.rx = createElement("table", c, null, "partySelectionTable");
  a.oo = createElement("div", c, null, "partySelectionNameWarning");
  a.oo.innerHTML = "给你的角色取个独特的名字.";
  a.oo.style.display = "none";
}
export function mountClassChoice(a, b, c) {
  var d = adventurerClasses[c],
    f,
    g,
    h;
  b = createElement("table", b, null, "characterSelectionButton");
  a.cr.push(b);
  b.onclick = function () {
    if (!(a.selectedCharacters.length >= 4 + partyCapacityBonus.t)) {
      a.selectedCharacters.push({
        classIndex: c,
        defaultName: adventurerClasses[c].defaultName
      });
      a.jm = true;
      validateSelectedParty(a);
    }
  };
  f = b.insertRow(0);
  b = b.insertRow(1);
  g = f.insertCell(0);
  g.style.width = "35px";
  g.style.textAlign = "center";
  h = game.monsterSprites.getSprite(d.spriteName);
  g = createElement("img", g, null, "characterImage");
  g.src = "images/Transparent.gif";
  g.style.height = "35px";
  g.style.width = "35px";
  g.style.background = "url('spritesheet/monsters.png') -" + (h.sourceX + 10) + "px -" + (h.sourceY + 12) + "px";
  f = f.insertCell(1);
  f.style.width = "410px";
  f.style.textAlign = "left";
  f = createElement("span", f, null, null);
  f.style.fontWeight = "bold";
  f.style.fontSize = "13px";
  f.innerHTML = d.className;
  b = b.insertCell(0);
  b.colSpan = 2;
  b.innerHTML = d.descriptionText;
}
export function mountSelectedCharacter(a, b, c, d) {
  var f = adventurerClasses[c.classIndex],
    g,
    h,
    l,
    n,
    p,
    s;
  b = createElement("div", b, null, "selectedCharacterContainer");
  g = createElement("table", b, null, "selectedCharacterSelectionTable");
  if (!(c.defaultName && "" !== c.defaultName)) {
    g.className = "errorSelectedCharacterSelectionTable";
  }
  h = g.insertRow(0);
  l = g.insertRow(1);
  n = h.insertCell(0);
  n.style.width = "35px";
  n.style.textAlign = "center";
  p = game.monsterSprites.getSprite(f.spriteName);
  n = createElement("img", n, null, "characterImage");
  n.src = "images/Transparent.gif";
  n.style.height = "35px";
  n.style.width = "35px";
  n.style.background = "url('spritesheet/monsters.png') -" + (p.sourceX + 10) + "px -" + (p.sourceY + 12) + "px";
  h = h.insertCell(1);
  h.style.width = "400px";
  h.style.textAlign = "left";
  s = createElement("input", h, null, null);
  s.type = "text";
  s.size = 15;
  s.maxLength = 15;
  s.value = c.defaultName;
  s.onkeyup = function () {
    renameSelectedCharacter(a, c, s.value, g);
  };
  s.onchange = function () {
    renameSelectedCharacter(a, c, s.value, g);
  };
  h = createElement("span", h, null, null);
  h.style.fontWeight = "bold";
  h.style.fontSize = "13px";
  h.style.marginLeft = "5px";
  h.innerHTML = " " + f.className;
  l = l.insertCell(0);
  l.colSpan = 2;
  l.innerHTML = f.descriptionText;
  f = createElement("div", b, null, "deselectCharacterButton");
  f.title = "移除角色";
  f.innerHTML = "X";
  f.onmouseup = function () {
    if (!(0 > d || d >= a.selectedCharacters.length)) {
      a.selectedCharacters.splice(d, 1);
      a.jm = true;
      validateSelectedParty(a);
    }
    return false;
  };
  f = 0 < d;
  l = createElement("div", b, null, f ? "moveUpButton" : "disabledMoveUpButton");
  l.title = "上移";
  l.innerHTML = "&#9650";
  if (f) {
    l.onmouseup = function () {
      if (0 !== d) {
        var b = a.selectedCharacters[d - 1];
        a.selectedCharacters[d - 1] = a.selectedCharacters[d];
        a.selectedCharacters[d] = b;
        a.jm = true;
        validateSelectedParty(a);
      }
      return false;
    };
  }
  f = d < a.selectedCharacters.length - 1;
  b = createElement("div", b, null, f ? "moveDownButton" : "disabledMoveDownButton");
  b.title = "下移";
  b.innerHTML = "&#9660;";
  if (f) {
    b.onmouseup = function () {
      if (!(d >= a.selectedCharacters.length - 1)) {
        var b = a.selectedCharacters[d + 1];
        a.selectedCharacters[d + 1] = a.selectedCharacters[d];
        a.selectedCharacters[d] = b;
        a.jm = true;
        validateSelectedParty(a);
      }
      return false;
    };
  }
}
export function renameSelectedCharacter(a, b, c, d) {
  var f = null != b.defaultName && "" != b.defaultName;
  if (c) {
    c = c.replace("&", "&amp;");
    c = c.replace("<", "&lt;");
    c = c.replace(">", "&gt;");
    c = c.replace('"', "&quot;");
    c = c.replace("'", "&#x27;");
    c = c.replace("/", "&#x2F;");
  } else {
    c = "";
  }
  b.defaultName = c;
  b = null != b.defaultName && "" != b.defaultName;
  if (f && !b) {
    d.className = "errorSelectedCharacterSelectionTable";
  } else {
    if (!f && b) {
      d.className = "selectedCharacterSelectionTable";
    }
  }
  validateSelectedParty(a);
}
export function validateSelectedParty(a) {
  var b = true,
    c,
    d,
    f = 4 + partyCapacityBonus.t,
    g = [],
    h = false;
  for (d = 0; d < a.selectedCharacters.length; d++) {
    if (!((c = a.selectedCharacters[d].defaultName) && "" !== c)) {
      b = false;
    }
    if (-1 < g.indexOf(c)) {
      h = true;
      b = false;
    }
    g.push(c);
  }
  for (d = 0; d < adventurerClasses.length; d++) {
    c = game.state.victoryCount < adventurerClasses[d].requiredVictories;
    if (!c) {
      a.cr[d].className = a.selectedCharacters.length === f ? "disabledCharacterSelectionButton" : "characterSelectionButton";
    }
  }
  if (0 === a.selectedCharacters.length) {
    b = false;
  }
  d = f - a.selectedCharacters.length;
  f = getPartyCapacityLabel();
  if (b) {
    switch (a.startButton.className = "upgradeButton", d) {
      case 1:
        f = "你还可以添加1个角色,或是直接开始游戏.";
        break;
      case 2:
        f = "你还可以添加2个角色,或是直接开始游戏.";
        break;
      case 3:
        f = "你还可以添加3个角色,或是直接开始游戏.";
        break;
      case 4:
        f = "你还可以添加4个角色,或是直接开始游戏.";
        break;
      default:
        f = "开始冒险!";
    }
  } else {
    a.startButton.className = "disabledUpgradeButton";
  }
  a.startButton.innerHTML = f;
  a.zr = h;
  a.validParty = b;
}
export function initializeViewsPartyCreation() {
  PartyCreationView.prototype = new TabView();
  PartyCreationView.prototype.onGameWon = function () {
    this.C.enabled = false;
    this.C.selected = false;
  };
  PartyCreationView.prototype.onOfflineFinish = function () {
    this.C.enabled = false;
    this.C.selected = false;
  };
  PartyCreationView.prototype.onOfflineStart = function () {
    this.C.enabled = false;
    this.C.selected = false;
  };
  PartyCreationView.prototype.reset = function () {
    this.C.enabled = false;
    clearElementById(this.elementId);
    this.ql = false;
    this.selectedCharacters.length = 0;
    this.cr.length = 0;
    this.validParty = false;
    this.startButton = null;
  };
  PartyCreationView.prototype.update = function () {
    if (!(0 < game.state.adventurers.length)) {
      if (!this.ql) {
        mountPartyCreation(this);
        this.ql = true;
      }
      if (this.jm) {
        this.jm = false;
        var a = this.rx;
        if (a) {
          for (; 0 < a.rows.length;) {
            a.deleteRow(0);
          }
        }
        var b = null,
          a = 0,
          c;
        for (c = 0; c < this.selectedCharacters.length; c++) {
          b = this.rx.insertRow(a);
          a++;
          b = b.insertCell(0);
          mountSelectedCharacter(this, b, this.selectedCharacters[c], c);
        }
      }
      if (this.tz != this.zr) {
        if (this.tz = this.zr) {
          showElement(this.oo);
        } else {
          hideElement(this.oo);
        }
      }
    }
  };
}
