// 名称类文本的安全输出。实体表与原版输入转义一致（& < > " '），不含 /（文本节点无需）。
const HTML_TEXT_ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/**
 * 把文本中的 HTML 敏感字符转成实体，供写入 innerHTML 的文本位置使用。
 * 引擎自己产出的标签（例如高亮 span）不经过本函数，因此不会二次转义。
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtmlText(value) {
  return String(value).replace(/[&<>"']/g, character => HTML_TEXT_ENTITIES[character]);
}

// 一个完整的 HTML 实体：命名实体（&amp;）或数字实体（&#65; / &#x27;）。
const HTML_ENTITY_AT_START = /^&(?:#\d+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/;

/**
 * 与 escapeHtmlText 相同，但**保留已经成形的实体**，只转义真正的裸字符。
 *
 * 用于"输入侧已经逐字符转义过、存档值可能来自导入"的混合来源字符串——典型是
 * adventurerName：原版 renameSelectedCharacter 在输入时就把 & < > " ' / 转成实体，
 * 若在输出边界再无条件转义一次，玩家输入的 `&` 会显示成 `&amp;`（双重转义）。
 * 保留既有实体则两种来源都正确：
 *   - 玩家输入 `A&B`   → 存档 `A&amp;B`  → 原样保留 → 浏览器显示 `A&B`
 *   - 导入存档 `<b>x`  → 裸 `<`         → 转成 `&lt;` → 浏览器显示 `<b>x` 而不生成标签
 *   - 导入存档 `&lt;b&gt;`                → 已是实体 → 原样保留 → 仍只显示文本，不生成标签
 *
 * 对不含 & < > " ' 的合法内容是逐字节 no-op，因此不改变任何可观测行为。
 * @param {unknown} value
 * @returns {string}
 */
export function escapeHtmlTextPreservingEntities(value) {
  const text = String(value);
  let result = "", index = 0;
  while (index < text.length) {
    const character = text[index];
    if (character === "&") {
      const entity = HTML_ENTITY_AT_START.exec(text.slice(index));
      if (entity) {
        result += entity[0];
        index += entity[0].length;
        continue;
      }
      result += HTML_TEXT_ENTITIES["&"];
    } else if (character === "<") result += HTML_TEXT_ENTITIES["<"];
    else if (character === ">") result += HTML_TEXT_ENTITIES[">"];
    else if (character === '"') result += HTML_TEXT_ENTITIES['"'];
    else if (character === "'") result += HTML_TEXT_ENTITIES["'"];
    else result += character;
    index++;
  }
  return result;
}
