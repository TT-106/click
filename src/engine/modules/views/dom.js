/** 旧面板 DOM 操作。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export function getElement(elementId) {
  return document.getElementById(elementId);
}
export function createElement(a, parentElement, elementId, className) {
  a = document.createElement(a);
  if (className) {
    a.className = className;
  }
  if (elementId) {
    a.id = elementId;
  }
  if (parentElement) {
    parentElement.appendChild(a);
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
export function clearElement(element) {
  if (element) {
    for (; element.firstChild;) {
      element.removeChild(element.firstChild);
    }
  }
}
export function hideElement(element) {
  if (element) {
    element.style.display = "none";
  }
}
export function showElement(element) {
  if (element) {
    element.style.display = "block";
  }
}
export function hideElementById(elementId) {
  hideElement(getElement(elementId));
}
export function showElementById(elementId) {
  showElement(getElement(elementId));
}
export function setElementHtml(elementId, html) {
  var element = getElement(elementId);
  if (element) {
    element.innerHTML = html;
  }
}
export function appendHeaderCell(headerRow) {
  var headerCell = document.createElement("th");
  headerRow.appendChild(headerCell);
  return headerCell;
}
export function appendAttributeRow(a, labelHtml, rowIndex) {
  a = a.insertRow(rowIndex);
  var labelCell = a.insertCell(0);
  labelCell.className = "characteristicsTableLabel";
  labelCell.innerHTML = labelHtml;
  return a.insertCell(1);
}
export function initializeViewsDom() {}
