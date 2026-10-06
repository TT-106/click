/** 物品规则与语义资源分离；新增材料无需修改背包或地图 Renderer。 */
export const EXPEDITION_ITEMS = Object.freeze({
  wood: { name: '木料', icon: 'material.wood', category: '材料', rarity: '普通', weight: 1, description: '沿途收集的干燥木料。可留作制作工具与营地建设的材料。' },
  feather: { name: '羽毛', icon: 'material.feather', category: '材料', rarity: '普通', weight: 1, description: '林间与草地上的轻盈羽毛。适合未来制作箭矢与轻便饰品。' },
  copper: { name: '铜矿', icon: 'material.copper', category: '矿物', rarity: '普通', weight: 2, description: '带着铜色纹理的矿石。可留作未来冶炼与工具制作的材料。' },
  iron: { name: '铁矿', icon: 'material.iron', category: '矿物', rarity: '普通', weight: 2, description: '从露出地表的矿脉采集。可留作未来制作装备与强化设施。' },
  silver: { name: '银矿', icon: 'material.silver', category: '矿物', rarity: '少见', weight: 2, description: '微微闪亮的银矿石。队伍会自动收好，并在返程时带回营地。' },
  crystal: { name: '晶石', icon: 'material.crystal', category: '矿物', rarity: '稀有', weight: 1, description: '在潮湿地带偶尔发现的晶体。可留作未来研究与施法器具的材料。' },
  leather: { name: '皮革', icon: 'material.leather', category: '材料', rarity: '少见', weight: 1, description: '在旧屋中找到的完好皮料。可留作未来制作背包与护具。' },
});

export const EXPEDITION_RULES = Object.freeze({ capacity: 24, returnAt: .8, maximumOutingMs: 15 * 60 * 1000, restMs: 8000, gatherMs: 650, maximumRoute: 4096 });
