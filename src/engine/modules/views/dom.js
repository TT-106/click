/** 旧面板 DOM 操作。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export function getElement(elementId) {
  return document.getElementById(elementId);
}
export function createElement(tagName, parentElement, elementId, className) {
  var createdElement = document.createElement(tagName);
  if (className) {
    createdElement.className = className;
  }
  if (elementId) {
    createdElement.id = elementId;
  }
  if (parentElement) {
    parentElement.appendChild(createdElement);
  }
  return createdElement;
}
export function clearElementById(elementId) {
  var element;
  if (element = getElement(elementId)) {
    for (; element.firstChild;) {
      element.removeChild(element.firstChild);
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
export function appendAttributeRow(table, labelHtml, rowIndex) {
  var attributeRow = table.insertRow(rowIndex);
  var labelCell = attributeRow.insertCell(0);
  labelCell.className = "characteristicsTableLabel";
  labelCell.innerHTML = labelHtml;
  return attributeRow.insertCell(1);
}
export function initializeViewsDom() {}
