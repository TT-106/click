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
      doorClosedASprite: "L2_Door003.PNG",
      doorClosedBSprite: "L2_Door004.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallBrickNS.PNG",
      wallEW: "L2_WallBrickEW.PNG",
      wallNE: "L2_WallBrickNE.PNG",
      wallES: "L2_WallBrickES.PNG",
      wallNW: "L2_WallBrickNW.PNG",
      wallSW: "L2_WallBrickSW.PNG",
      wallNESW: "L2_WallBrickNESW.PNG",
      wallESW: "L2_WallBrickESW.PNG",
      wallNEW: "L2_WallBrickNEW.PNG",
      wallNES: "L2_WallBrickNES.PNG",
      wallNSW: "L2_WallBrickNSW.PNG",
      wallW: "L2_WallBrickW.PNG",
      wallN: "L2_WallBrickN.PNG",
      wallE: "L2_WallBrickE.PNG",
      wallS: "L2_WallBrickS.PNG"
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
      doorClosedASprite: "L2_Door003.PNG",
      doorClosedBSprite: "L2_Door004.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallDarkBrickNS.PNG",
      wallEW: "L2_WallDarkBrickEW.PNG",
      wallNE: "L2_WallDarkBrickNE.PNG",
      wallES: "L2_WallDarkBrickES.PNG",
      wallNW: "L2_WallDarkBrickNW.PNG",
      wallSW: "L2_WallDarkBrickSW.PNG",
      wallNESW: "L2_WallDarkBrickNESW.PNG",
      wallESW: "L2_WallDarkBrickESW.PNG",
      wallNEW: "L2_WallDarkBrickNEW.PNG",
      wallNES: "L2_WallDarkBrickNES.PNG",
      wallNSW: "L2_WallDarkBrickNSW.PNG",
      wallW: "L2_WallDarkBrickW.PNG",
      wallN: "L2_WallDarkBrickN.PNG",
      wallE: "L2_WallDarkBrickE.PNG",
      wallS: "L2_WallDarkBrickS.PNG"
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
      doorClosedASprite: "L2_Door003.PNG",
      doorClosedBSprite: "L2_Door004.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallCaveNS.PNG",
      wallEW: "L2_WallCaveEW.PNG",
      wallNE: "L2_WallCaveNE.PNG",
      wallES: "L2_WallCaveES.PNG",
      wallNW: "L2_WallCaveNW.PNG",
      wallSW: "L2_WallCaveSW.PNG",
      wallNESW: "L2_WallCaveNESW.PNG",
      wallESW: "L2_WallCaveESW.PNG",
      wallNEW: "L2_WallCaveNEW.PNG",
      wallNES: "L2_WallCaveNES.PNG",
      wallNSW: "L2_WallCaveNSW.PNG",
      wallW: "L2_WallCaveW.PNG",
      wallN: "L2_WallCaveN.PNG",
      wallE: "L2_WallCaveE.PNG",
      wallS: "L2_WallCaveS.PNG"
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
      doorClosedASprite: "L2_DoorBoneClosedNS.PNG",
      doorClosedBSprite: "L2_DoorBoneClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallBoneNS.PNG",
      wallEW: "L2_WallBoneEW.PNG",
      wallNE: "L2_WallBoneNE.PNG",
      wallES: "L2_WallBoneES.PNG",
      wallNW: "L2_WallBoneNW.PNG",
      wallSW: "L2_WallBoneSW.PNG",
      wallNESW: "L2_WallBoneNESW.PNG",
      wallESW: "L2_WallBoneESW.PNG",
      wallNEW: "L2_WallBoneNEW.PNG",
      wallNES: "L2_WallBoneNES.PNG",
      wallNSW: "L2_WallBoneNSW.PNG",
      wallW: "L2_WallBoneW.PNG",
      wallN: "L2_WallBoneN.PNG",
      wallE: "L2_WallBoneE.PNG",
      wallS: "L2_WallBoneS.PNG"
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
      doorClosedASprite: "L2_DoorDarkStoneClosedNS.PNG",
      doorClosedBSprite: "L2_DoorDarkStoneClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallDarkStoneNS.PNG",
      wallEW: "L2_WallDarkStoneEW.PNG",
      wallNE: "L2_WallDarkStoneNE.PNG",
      wallES: "L2_WallDarkStoneES.PNG",
      wallNW: "L2_WallDarkStoneNW.PNG",
      wallSW: "L2_WallDarkStoneSW.PNG",
      wallNESW: "L2_WallDarkStoneNESW.PNG",
      wallESW: "L2_WallDarkStoneESW.PNG",
      wallNEW: "L2_WallDarkStoneNEW.PNG",
      wallNES: "L2_WallDarkStoneNES.PNG",
      wallNSW: "L2_WallDarkStoneNSW.PNG",
      wallW: "L2_WallDarkStoneW.PNG",
      wallN: "L2_WallDarkStoneN.PNG",
      wallE: "L2_WallDarkStoneE.PNG",
      wallS: "L2_WallDarkStoneS.PNG"
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
      doorClosedASprite: "L2_DoorIceClosedNS.PNG",
      doorClosedBSprite: "L2_DoorIceClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallIceNS.PNG",
      wallEW: "L2_WallIceEW.PNG",
      wallNE: "L2_WallIceNE.PNG",
      wallES: "L2_WallIceES.PNG",
      wallNW: "L2_WallIceNW.PNG",
      wallSW: "L2_WallIceSW.PNG",
      wallNESW: "L2_WallIceNESW.PNG",
      wallESW: "L2_WallIceESW.PNG",
      wallNEW: "L2_WallIceNEW.PNG",
      wallNES: "L2_WallIceNES.PNG",
      wallNSW: "L2_WallIceNSW.PNG",
      wallW: "L2_WallIceW.PNG",
      wallN: "L2_WallIceN.PNG",
      wallE: "L2_WallIceE.PNG",
      wallS: "L2_WallIceS.PNG"
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
      doorClosedASprite: "L2_DoorIronClosedNS.PNG",
      doorClosedBSprite: "L2_DoorIronClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallIronNS.PNG",
      wallEW: "L2_WallIronEW.PNG",
      wallNE: "L2_WallIronNE.PNG",
      wallES: "L2_WallIronES.PNG",
      wallNW: "L2_WallIronNW.PNG",
      wallSW: "L2_WallIronSW.PNG",
      wallNESW: "L2_WallIronNESW.PNG",
      wallESW: "L2_WallIronESW.PNG",
      wallNEW: "L2_WallIronNEW.PNG",
      wallNES: "L2_WallIronNES.PNG",
      wallNSW: "L2_WallIronNSW.PNG",
      wallW: "L2_WallIronW.PNG",
      wallN: "L2_WallIronN.PNG",
      wallE: "L2_WallIronE.PNG",
      wallS: "L2_WallIronS.PNG"
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
      doorClosedASprite: "L2_DoorDarkStoneClosedNS.PNG",
      doorClosedBSprite: "L2_DoorDarkStoneClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallMineNS.PNG",
      wallEW: "L2_WallMineEW.PNG",
      wallNE: "L2_WallMineNE.PNG",
      wallES: "L2_WallMineES.PNG",
      wallNW: "L2_WallMineNW.PNG",
      wallSW: "L2_WallMineSW.PNG",
      wallNESW: "L2_WallMineNESW.PNG",
      wallESW: "L2_WallMineESW.PNG",
      wallNEW: "L2_WallMineNEW.PNG",
      wallNES: "L2_WallMineNES.PNG",
      wallNSW: "L2_WallMineNSW.PNG",
      wallW: "L2_WallMineW.PNG",
      wallN: "L2_WallMineN.PNG",
      wallE: "L2_WallMineE.PNG",
      wallS: "L2_WallMineS.PNG"
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
      doorClosedASprite: "L2_DoorClosedNS.PNG",
      doorClosedBSprite: "L2_DoorClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallStoneNS.PNG",
      wallEW: "L2_WallStoneEW.PNG",
      wallNE: "L2_WallStoneNE.PNG",
      wallES: "L2_WallStoneES.PNG",
      wallNW: "L2_WallStoneNW.PNG",
      wallSW: "L2_WallStoneSW.PNG",
      wallNESW: "L2_WallStoneNESW.PNG",
      wallESW: "L2_WallStoneESW.PNG",
      wallNEW: "L2_WallStoneNEW.PNG",
      wallNES: "L2_WallStoneNES.PNG",
      wallNSW: "L2_WallStoneNSW.PNG",
      wallW: "L2_WallStoneW.PNG",
      wallN: "L2_WallStoneN.PNG",
      wallE: "L2_WallStoneE.PNG",
      wallS: "L2_WallStoneS.PNG"
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
      doorClosedASprite: "L2_DoorHutClosedNS.PNG",
      doorClosedBSprite: "L2_DoorHutClosedEW.PNG"
    },
    wallSprites: {
      wallNS: "L2_WallWoodNS.PNG",
      wallEW: "L2_WallWoodEW.PNG",
      wallNE: "L2_WallWoodNE.PNG",
      wallES: "L2_WallWoodES.PNG",
      wallNW: "L2_WallWoodNW.PNG",
      wallSW: "L2_WallWoodSW.PNG",
      wallNESW: "L2_WallWoodNESW.PNG",
      wallESW: "L2_WallWoodESW.PNG",
      wallNEW: "L2_WallWoodNEW.PNG",
      wallNES: "L2_WallWoodNES.PNG",
      wallNSW: "L2_WallWoodNSW.PNG",
      wallW: "L2_WallWoodW.PNG",
      wallN: "L2_WallWoodN.PNG",
      wallE: "L2_WallWoodE.PNG",
      wallS: "L2_WallWoodS.PNG"
    },
    Th: []
  };
}
