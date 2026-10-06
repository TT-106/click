// 模拟故障上报端口：引擎只负责停机与上报，可见化由宿主决定。

/**
 * 模拟故障上报宿主端口
 * @typedef {Object} FaultPort
 * @property {function((unknown|null)=): void} [onSimulationFault] 可选：模拟推进抛错、循环已停机时由宿主展示。
 */

/** @type {FaultPort} */
export let faults = {};

/** @param {FaultPort} port */
export function configureFaults(port) { faults = port; }
