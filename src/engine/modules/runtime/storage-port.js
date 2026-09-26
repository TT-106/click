// 持久化由宿主注入，引擎不直接依赖 localStorage。

/**
 * 宿主持久化端口。
 * @typedef {Object} PersistencePort
 * @property {function(): string|null} read 读取当前存档原文（Base64），无则 null。
 * @property {function(string): void} write 写入存档原文（宿主负责备份键迁移）。
 * @property {function(): void} remove 删除存档。
 * @property {function((unknown|null)=): void} [onLoadError] 可选：读取/恢复失败时由宿主处理错误。
 */

/** @type {PersistencePort} */
export let persistence = { read: () => null, write: () => {}, remove: () => {} };

/** @param {PersistencePort} port */
export function configurePersistence(port) { persistence = port; }
