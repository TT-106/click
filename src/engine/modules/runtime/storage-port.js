// 持久化由宿主注入，引擎不直接依赖 localStorage。
export let persistence = { read: () => null, write: () => {}, remove: () => {} };
export function configurePersistence(port) { persistence = port; }
