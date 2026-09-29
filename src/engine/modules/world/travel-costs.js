/** 大地图通行代价计算。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export function WorldPathfinder() {
  this.unreachableCost = 1E8;
}
export function calculateWorldCosts(pathfinder, destinationColumn, destinationRow, world) {
  const unreachableCost = pathfinder.unreachableCost;
  for (let blockRow = 0; blockRow < 3; blockRow++) {
    const blockColumn = world.worldBlocks[blockRow];
    for (let blockIndex = 0; blockIndex < 3; blockIndex++) {
      const block = blockColumn[blockIndex];
      for (let tileRow = 0; tileRow < block.tileGrid.length; tileRow++) {
        const row = block.tileGrid[tileRow];
        for (let tileColumn = 0; tileColumn < row.length; tileColumn++) {
          row[tileColumn].pathDistanceToDestination = unreachableCost;
        }
      }
    }
  }

  const destination = world.getTileAtPixel(destinationColumn, destinationRow);
  if (destination) {
    const pendingTiles = [destination];
    destination.pathDistanceToDestination = 0;
    const neighbors = [null, null, null, null];
    while (pendingTiles.length > 0) {
      const currentTile = pendingTiles.shift();
      const currentCost = currentTile.pathDistanceToDestination;
      const column = currentTile.getWorldColumn();
      const row = currentTile.getWorldRow();
      neighbors[0] = world.getTileAtPixel(column, row - 1);
      neighbors[1] = world.getTileAtPixel(column - 1, row);
      neighbors[2] = world.getTileAtPixel(column + 1, row);
      neighbors[3] = world.getTileAtPixel(column, row + 1);
      for (let neighborIndex = 0; neighborIndex < neighbors.length; neighborIndex++) {
        const neighbor = neighbors[neighborIndex];
        if (neighbor) {
          const cost = currentCost + neighbor.terrainMoveCost + 1;
          if (cost < neighbor.pathDistanceToDestination) {
            neighbor.pathDistanceToDestination = cost;
            pendingTiles.push(neighbor);
          }
        }
      }
    }
  } else {
    console.log("error: destination is not on grid!!!");
  }
}
export function initializeWorldTravelCosts() {}
