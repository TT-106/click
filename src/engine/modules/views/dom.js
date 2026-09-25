// @ts-nocheck -- M10 渐进类型化：JSDoc 覆盖后摘除（见 docs/WORKSTATE.md）
/** 旧面板 DOM 操作。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export function getElement(a) {
  return document.getElementById(a);
}
export function createElement(a, b, c, d) {
  a = document.createElement(a);
  if (d) {
    a.className = d;
  }
  if (c) {
    a.id = c;
  }
  if (b) {
    b.appendChild(a);
  }
  return a;
}
export function clearElementById(a) {
  if (a = getElement(a)) {
    for (; a.firstChild;) {
      a.removeChild(a.firstChild);
    }
  }
}
export function clearElement(a) {
  if (a) {
    for (; a.firstChild;) {
      a.removeChild(a.firstChild);
    }
  }
}
export function hideElement(a) {
  if (a) {
    a.style.display = "none";
  }
}
export function showElement(a) {
  if (a) {
    a.style.display = "block";
  }
}
export function hideElementById(a) {
  hideElement(getElement(a));
}
export function showElementById(a) {
  showElement(getElement(a));
}
export function setElementHtml(a, b) {
  var c = getElement(a);
  if (c) {
    c.innerHTML = b;
  }
}
export function appendHeaderCell(a) {
  var b = document.createElement("th");
  a.appendChild(b);
  return b;
}
export function appendAttributeRow(a, b, c) {
  a = a.insertRow(c);
  c = a.insertCell(0);
  c.className = "characteristicsTableLabel";
  c.innerHTML = b;
  return a.insertCell(1);
}
export function initializeViewsDom() {}
