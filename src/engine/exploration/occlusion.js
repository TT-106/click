import { frameGeometry } from '../modules/rendering/frame.js';

const overlaps = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

/** 多格建筑不能仅按最前角的 x+y 排序：门前的人可能仍比该角更靠后。
 * 使用占地前沿约束与其图像相交的脚点物件，其余保留稳定 painter 顺序。
 * 当前预设不重叠。将来交叉桥/长墙产生环时必须拆部件，不能靠加 z 魔数解决。
 */
export function orderSceneCommands(commands) {
  const ordered = [...commands].sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));
  const rectangles = ordered.map(command => frameGeometry(command.frame, command.x, command.y));
  const outgoing = ordered.map(() => new Set()), indegree = ordered.map(() => 0);
  const constrain = (before, after) => {
    if (!outgoing[before].has(after)) { outgoing[before].add(after); indegree[after]++; }
  };
  ordered.forEach((building, buildingIndex) => {
    const bounds = building.occlusionBounds;
    if (!bounds) return;
    ordered.forEach((point, pointIndex) => {
      if (point === building || point.occlusionBounds || !overlaps(rectangles[buildingIndex], rectangles[pointIndex])) return;
      const front = point.worldX > bounds.right || point.worldY > bounds.bottom;
      const back = point.worldX < bounds.left || point.worldY < bounds.top;
      // 对角跨两个轴的点通常没有图像交集；很大图像的歧义保持 painter 顺序。
      if (front && !back) constrain(buildingIndex, pointIndex);
      else if (back && !front) constrain(pointIndex, buildingIndex);
    });
  });
  const result = [], used = new Set();
  while (result.length < ordered.length) {
    let index = indegree.findIndex((degree, candidate) => degree === 0 && !used.has(candidate));
    // 环不能丢掉绘制对象，以原顺序稳定退化；交叉地表需要拆部件。
    if (index < 0) index = ordered.findIndex((_, candidate) => !used.has(candidate));
    used.add(index); result.push(ordered[index]);
    for (const after of outgoing[index]) indegree[after]--;
  }
  return result;
}
