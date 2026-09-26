/** 各类地牢的地板、墙面、门与阶梯图块。
 * 初始化由 runtime/index.js 统一协调；字段与原符号映射见 docs/symbol-map.json。
 */
export var templeTheme, caveTheme, towerTheme, castleTheme, dungeonTheme, iceDungeonTheme, ironMineTheme, stoneDungeonTheme, chamberTheme, woodenMineTheme;
export function initializeContentDungeonThemes() {
  templeTheme = {
    floor: "L1_Terrain014.PNG",
    stairs: {
      di: "L2_Door007.PNG",
      ci: "L2_Door008.PNG",
      Lh: "L2_StairsDownNS.PNG",
      Kh: "L2_StairsDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_Door001.PNG",
      doorOpenBSprite: "L2_Door002.PNG",
      Vf: "L2_Door003.PNG",
      Uf: "L2_Door004.PNG"
    },
    wallSprites: {
      Cg: "L2_WallBrickNS.PNG",
      Eg: "L2_WallBrickEW.PNG",
      Fg: "L2_WallBrickNE.PNG",
      Dg: "L2_WallBrickES.PNG",
      Hg: "L2_WallBrickNW.PNG",
      Gg: "L2_WallBrickSW.PNG",
      ii: "L2_WallBrickNESW.PNG",
      Ah: "L2_WallBrickESW.PNG",
      Bh: "L2_WallBrickNEW.PNG",
      zh: "L2_WallBrickNES.PNG",
      Ch: "L2_WallBrickNSW.PNG",
      stateSize: "L2_WallBrickW.PNG",
      E: "L2_WallBrickN.PNG",
      ji: "L2_WallBrickE.PNG",
      ki: "L2_WallBrickS.PNG"
    },
    Th: [{
      Oo: [],
      JC: ["L3_WallDeco23.PNG", "L3_WallDeco49.PNG"],
      KC: ["L3_WallDeco24.PNG", "L3_WallDeco50.PNG"]
    }]
  };
  caveTheme = {
    floor: "L1_Terrain015.PNG",
    stairs: {
      di: "L2_DarkStoneStairsUpNS.PNG",
      ci: "L2_DarkStoneStairsUpEW.PNG",
      Lh: "L2_DarkStoneStairsDownNS.PNG",
      Kh: "L2_DarkStoneStairsDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_Door001.PNG",
      doorOpenBSprite: "L2_Door002.PNG",
      Vf: "L2_Door003.PNG",
      Uf: "L2_Door004.PNG"
    },
    wallSprites: {
      Cg: "L2_WallDarkBrickNS.PNG",
      Eg: "L2_WallDarkBrickEW.PNG",
      Fg: "L2_WallDarkBrickNE.PNG",
      Dg: "L2_WallDarkBrickES.PNG",
      Hg: "L2_WallDarkBrickNW.PNG",
      Gg: "L2_WallDarkBrickSW.PNG",
      ii: "L2_WallDarkBrickNESW.PNG",
      Ah: "L2_WallDarkBrickESW.PNG",
      Bh: "L2_WallDarkBrickNEW.PNG",
      zh: "L2_WallDarkBrickNES.PNG",
      Ch: "L2_WallDarkBrickNSW.PNG",
      stateSize: "L2_WallDarkBrickW.PNG",
      E: "L2_WallDarkBrickN.PNG",
      ji: "L2_WallDarkBrickE.PNG",
      ki: "L2_WallDarkBrickS.PNG"
    },
    Th: []
  };
  towerTheme = {
    floor: "L1_Terrain013.PNG",
    stairs: {
      di: "L2_StairsHutUpNS.PNG",
      ci: "L2_StairsHutUpEW.PNG",
      Lh: "L2_StairsHutDownNS.PNG",
      Kh: "L2_StairsHutDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_Door001.PNG",
      doorOpenBSprite: "L2_Door002.PNG",
      Vf: "L2_Door003.PNG",
      Uf: "L2_Door004.PNG"
    },
    wallSprites: {
      Cg: "L2_WallCaveNS.PNG",
      Eg: "L2_WallCaveEW.PNG",
      Fg: "L2_WallCaveNE.PNG",
      Dg: "L2_WallCaveES.PNG",
      Hg: "L2_WallCaveNW.PNG",
      Gg: "L2_WallCaveSW.PNG",
      ii: "L2_WallCaveNESW.PNG",
      Ah: "L2_WallCaveESW.PNG",
      Bh: "L2_WallCaveNEW.PNG",
      zh: "L2_WallCaveNES.PNG",
      Ch: "L2_WallCaveNSW.PNG",
      stateSize: "L2_WallCaveW.PNG",
      E: "L2_WallCaveN.PNG",
      ji: "L2_WallCaveE.PNG",
      ki: "L2_WallCaveS.PNG"
    },
    Th: []
  };
  castleTheme = {
    floor: "L1_FloorPattern.PNG",
    stairs: {
      di: "L2_StairsBoneUpNS.PNG",
      ci: "L2_StairsBoneUpEW.PNG",
      Lh: "L2_StairsBoneDownNS.PNG",
      Kh: "L2_StairsBoneDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorBoneOpenNS.PNG",
      doorOpenBSprite: "L2_DoorBoneOpenEW.PNG",
      Vf: "L2_DoorBoneClosedNS.PNG",
      Uf: "L2_DoorBoneClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallBoneNS.PNG",
      Eg: "L2_WallBoneEW.PNG",
      Fg: "L2_WallBoneNE.PNG",
      Dg: "L2_WallBoneES.PNG",
      Hg: "L2_WallBoneNW.PNG",
      Gg: "L2_WallBoneSW.PNG",
      ii: "L2_WallBoneNESW.PNG",
      Ah: "L2_WallBoneESW.PNG",
      Bh: "L2_WallBoneNEW.PNG",
      zh: "L2_WallBoneNES.PNG",
      Ch: "L2_WallBoneNSW.PNG",
      stateSize: "L2_WallBoneW.PNG",
      E: "L2_WallBoneN.PNG",
      ji: "L2_WallBoneE.PNG",
      ki: "L2_WallBoneS.PNG"
    },
    Th: []
  };
  dungeonTheme = {
    floor: "L1_Terrain049.PNG",
    stairs: {
      di: "L2_DarkStoneStairsUpNS.PNG",
      ci: "L2_DarkStoneStairsUpEW.PNG",
      Lh: "L2_DarkStoneStairsDownNS.PNG",
      Kh: "L2_DarkStoneStairsDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorDarkStoneOpenNS.PNG",
      doorOpenBSprite: "L2_DoorDarkStoneOpenEW.PNG",
      Vf: "L2_DoorDarkStoneClosedNS.PNG",
      Uf: "L2_DoorDarkStoneClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallDarkStoneNS.PNG",
      Eg: "L2_WallDarkStoneEW.PNG",
      Fg: "L2_WallDarkStoneNE.PNG",
      Dg: "L2_WallDarkStoneES.PNG",
      Hg: "L2_WallDarkStoneNW.PNG",
      Gg: "L2_WallDarkStoneSW.PNG",
      ii: "L2_WallDarkStoneNESW.PNG",
      Ah: "L2_WallDarkStoneESW.PNG",
      Bh: "L2_WallDarkStoneNEW.PNG",
      zh: "L2_WallDarkStoneNES.PNG",
      Ch: "L2_WallDarkStoneNSW.PNG",
      stateSize: "L2_WallDarkStoneW.PNG",
      E: "L2_WallDarkStoneN.PNG",
      ji: "L2_WallDarkStoneE.PNG",
      ki: "L2_WallDarkStoneS.PNG"
    },
    Th: []
  };
  iceDungeonTheme = {
    floor: "L1_Terrain004.PNG",
    stairs: {
      di: "L2_StairsIceUpNS.PNG",
      ci: "L2_StairsIceUpEW.PNG",
      Lh: "L2_StairsIceDownNS.PNG",
      Kh: "L2_StairsIceDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorIceOpenNS.PNG",
      doorOpenBSprite: "L2_DoorIceOpenEW.PNG",
      Vf: "L2_DoorIceClosedNS.PNG",
      Uf: "L2_DoorIceClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallIceNS.PNG",
      Eg: "L2_WallIceEW.PNG",
      Fg: "L2_WallIceNE.PNG",
      Dg: "L2_WallIceES.PNG",
      Hg: "L2_WallIceNW.PNG",
      Gg: "L2_WallIceSW.PNG",
      ii: "L2_WallIceNESW.PNG",
      Ah: "L2_WallIceESW.PNG",
      Bh: "L2_WallIceNEW.PNG",
      zh: "L2_WallIceNES.PNG",
      Ch: "L2_WallIceNSW.PNG",
      stateSize: "L2_WallIceW.PNG",
      E: "L2_WallIceN.PNG",
      ji: "L2_WallIceE.PNG",
      ki: "L2_WallIceS.PNG"
    },
    Th: [{
      Oo: ["L2_IceFloorDeco1.PNG", "L2_IceFloorDeco3.PNG", "L2_IceFloorDeco2.PNG"],
      JC: [],
      KC: []
    }]
  };
  ironMineTheme = {
    floor: "L1_Terrain049.PNG",
    stairs: {
      di: "L2_StairsIronUpNS.PNG",
      ci: "L2_StairsIronUpEW.PNG",
      Lh: "L2_StairsIronDownNS.PNG",
      Kh: "L2_StairsIronDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorIronOpenNS.PNG",
      doorOpenBSprite: "L2_DoorIronOpenEW.PNG",
      Vf: "L2_DoorIronClosedNS.PNG",
      Uf: "L2_DoorIronClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallIronNS.PNG",
      Eg: "L2_WallIronEW.PNG",
      Fg: "L2_WallIronNE.PNG",
      Dg: "L2_WallIronES.PNG",
      Hg: "L2_WallIronNW.PNG",
      Gg: "L2_WallIronSW.PNG",
      ii: "L2_WallIronNESW.PNG",
      Ah: "L2_WallIronESW.PNG",
      Bh: "L2_WallIronNEW.PNG",
      zh: "L2_WallIronNES.PNG",
      Ch: "L2_WallIronNSW.PNG",
      stateSize: "L2_WallIronW.PNG",
      E: "L2_WallIronN.PNG",
      ji: "L2_WallIronE.PNG",
      ki: "L2_WallIronS.PNG"
    },
    Th: []
  };
  stoneDungeonTheme = {
    floor: "L1_Terrain049.PNG",
    stairs: {
      di: "L2_DarkStoneStairsUpNS.PNG",
      ci: "L2_DarkStoneStairsUpEW.PNG",
      Lh: "L2_DarkStoneStairsDownNS.PNG",
      Kh: "L2_DarkStoneStairsDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorDarkStoneOpenNS.PNG",
      doorOpenBSprite: "L2_DoorDarkStoneOpenEW.PNG",
      Vf: "L2_DoorDarkStoneClosedNS.PNG",
      Uf: "L2_DoorDarkStoneClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallMineNS.PNG",
      Eg: "L2_WallMineEW.PNG",
      Fg: "L2_WallMineNE.PNG",
      Dg: "L2_WallMineES.PNG",
      Hg: "L2_WallMineNW.PNG",
      Gg: "L2_WallMineSW.PNG",
      ii: "L2_WallMineNESW.PNG",
      Ah: "L2_WallMineESW.PNG",
      Bh: "L2_WallMineNEW.PNG",
      zh: "L2_WallMineNES.PNG",
      Ch: "L2_WallMineNSW.PNG",
      stateSize: "L2_WallMineW.PNG",
      E: "L2_WallMineN.PNG",
      ji: "L2_WallMineE.PNG",
      ki: "L2_WallMineS.PNG"
    },
    Th: []
  };
  chamberTheme = {
    floor: "L1_Terrain010.PNG",
    stairs: {
      di: "L2_StairsUpNS.PNG",
      ci: "L2_StairsUpEW.PNG",
      Lh: "L2_StairsDownNS.PNG",
      Kh: "L2_StairsDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorOpenNS.PNG",
      doorOpenBSprite: "L2_DoorOpenEW.PNG",
      Vf: "L2_DoorClosedNS.PNG",
      Uf: "L2_DoorClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallStoneNS.PNG",
      Eg: "L2_WallStoneEW.PNG",
      Fg: "L2_WallStoneNE.PNG",
      Dg: "L2_WallStoneES.PNG",
      Hg: "L2_WallStoneNW.PNG",
      Gg: "L2_WallStoneSW.PNG",
      ii: "L2_WallStoneNESW.PNG",
      Ah: "L2_WallStoneESW.PNG",
      Bh: "L2_WallStoneNEW.PNG",
      zh: "L2_WallStoneNES.PNG",
      Ch: "L2_WallStoneNSW.PNG",
      stateSize: "L2_WallStoneW.PNG",
      E: "L2_WallStoneN.PNG",
      ji: "L2_WallStoneE.PNG",
      ki: "L2_WallStoneS.PNG"
    },
    Th: []
  };
  woodenMineTheme = {
    floor: "L1_Terrain011.PNG",
    stairs: {
      di: "L2_StairsHutUpNS.PNG",
      ci: "L2_StairsHutUpEW.PNG",
      Lh: "L2_StairsHutDownNS.PNG",
      Kh: "L2_StairsHutDownEW.PNG"
    },
    doorSprites: {
      doorOpenASprite: "L2_DoorHutOpenNS.PNG",
      doorOpenBSprite: "L2_DoorHutOpenEW.PNG",
      Vf: "L2_DoorHutClosedNS.PNG",
      Uf: "L2_DoorHutClosedEW.PNG"
    },
    wallSprites: {
      Cg: "L2_WallWoodNS.PNG",
      Eg: "L2_WallWoodEW.PNG",
      Fg: "L2_WallWoodNE.PNG",
      Dg: "L2_WallWoodES.PNG",
      Hg: "L2_WallWoodNW.PNG",
      Gg: "L2_WallWoodSW.PNG",
      ii: "L2_WallWoodNESW.PNG",
      Ah: "L2_WallWoodESW.PNG",
      Bh: "L2_WallWoodNEW.PNG",
      zh: "L2_WallWoodNES.PNG",
      Ch: "L2_WallWoodNSW.PNG",
      stateSize: "L2_WallWoodW.PNG",
      E: "L2_WallWoodN.PNG",
      ji: "L2_WallWoodE.PNG",
      ki: "L2_WallWoodS.PNG"
    },
    Th: []
  };
}
