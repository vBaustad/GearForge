export const AD_SLOTS = {
  layoutTop: "0000000001",
  layoutFooter: "0000000002",
  landingGrid: "0000000011",
  optimizerForm: "0000000020",
  optimizerResultHeader: "0000000030",
  optimizerResultInline: "0000000031",
  rewardsTop: "0000000040",
  rewardsMid: "0000000041",
  guidesIndexTop: "0000000050",
  guidesIndexGrid: "0000000051",
  guideArticleTop: "0000000060",
  guideArticleInline: "0000000061",
} as const;

type SlotMap = typeof AD_SLOTS;
export type AdSlotKey = keyof SlotMap;
