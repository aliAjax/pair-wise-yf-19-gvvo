import type {
  BatchStage,
  Bin,
  ClimateZone,
  EventType,
  IdentifyStatus,
  SpecimenStage,
} from "./types";

// 预置：三个来源馆（只读规则数据）
export const SOURCES = [
  { id: "HITBC", name: "西双版纳热带植物园标本馆", short: "版纳馆" },
  { id: "LSBG", name: "庐山植物园标本馆", short: "庐山馆" },
  { id: "CBM", name: "长白山科学植物标本馆", short: "长白山馆" },
] as const;

export type SourceId = (typeof SOURCES)[number]["id"];

export const SOURCE_MAP: Record<string, (typeof SOURCES)[number]> =
  Object.fromEntries(SOURCES.map((s) => [s.id, s]));

// 预置：四个气候仓位（只读规则数据，容量固定）
export const BINS: Bin[] = [
  {
    id: "BIN-TR",
    name: "热带湿热柜",
    code: "TR-A",
    zone: "tropical",
    capacity: 8,
    note: "恒温 22℃ · 湿度 65% · 防霉隔层",
  },
  {
    id: "BIN-ST",
    name: "亚热带常绿柜",
    code: "ST-B",
    zone: "subtropical",
    capacity: 8,
    note: "恒温 18℃ · 湿度 55% · 通风层架",
  },
  {
    id: "BIN-TM",
    name: "温带落叶柜",
    code: "TM-C",
    zone: "temperate",
    capacity: 8,
    note: "恒温 14℃ · 湿度 45% · 干燥层架",
  },
  {
    id: "BIN-AL",
    name: "高山寒温柜",
    code: "AL-D",
    zone: "alpine",
    capacity: 6,
    note: "恒温 6℃ · 湿度 40% · 低温密封",
  },
];

export const BIN_MAP: Record<string, Bin> = Object.fromEntries(
  BINS.map((b) => [b.id, b]),
);

export const ZONE_LABEL: Record<ClimateZone, string> = {
  tropical: "热带",
  subtropical: "亚热带",
  temperate: "温带",
  alpine: "高山",
};

export const IDENTIFY_LABEL: Record<IdentifyStatus, string> = {
  pending: "待鉴定",
  identified: "已鉴定",
  doubtful: "存疑待核",
};

export const QUARANTINE_LABEL: Record<string, string> = {
  pass: "检疫合格",
  fail: "检疫不合格",
  "": "未出结论",
};

export const STAGE_LABEL: Record<SpecimenStage, string> = {
  pending: "待核验",
  queued: "待拆箱",
  stored: "已上柜",
  returned: "已退回",
};

export const BATCH_STAGE_LABEL: Record<BatchStage, string> = {
  pending: "待核验",
  rejected: "已拒收",
  verified: "已核验待拆箱",
  received: "已入库",
};

export const EVENT_META: Record<
  EventType,
  { label: string; tone: "ok" | "bad" | "info" | "warn" }
> = {
  registered: { label: "调拨登记", tone: "info" },
  verified: { label: "核验通过", tone: "ok" },
  rejected: { label: "整批拒收", tone: "bad" },
  received: { label: "拆箱入位", tone: "ok" },
  receive_rejected: { label: "拆箱拒收", tone: "bad" },
  returned: { label: "退回来源馆", tone: "warn" },
};

export const IDENTIFY_FILTERS: { id: IdentifyStatus | "all"; label: string }[] =
  [
    { id: "all", label: "全部鉴定状态" },
    { id: "pending", label: "待鉴定" },
    { id: "identified", label: "已鉴定" },
    { id: "doubtful", label: "存疑待核" },
  ];

export const STORAGE_KEY = "herbarium-transfer-v1";
