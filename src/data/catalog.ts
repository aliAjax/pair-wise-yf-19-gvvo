import type {
  Locality,
  SourceHerbarium,
  Specimen,
  StorageBin,
} from "../types";

/** 预置三个来源馆。 */
export const SOURCES: SourceHerbarium[] = [
  {
    id: "KUN",
    code: "KUN",
    name: "昆明植物研究所标本馆",
    keeper: "周馆长",
    contact: "0871-6522-3010",
  },
  {
    id: "PE",
    code: "PE",
    name: "中国科学院植物研究所标本馆",
    keeper: "林主任",
    contact: "010-6283-6400",
  },
  {
    id: "IBSC",
    code: "IBSC",
    name: "华南国家植物园标本馆",
    keeper: "陈管理员",
    contact: "020-3725-2711",
  },
];

/** 预置四个气候仓位，容量按接收演示需要设为较紧。 */
export const BINS: StorageBin[] = [
  {
    id: "BIN-TR",
    code: "热柜 TR-01",
    zone: "tropical",
    name: "热带恒温防潮舱",
    tempRange: "22–28℃",
    humidity: "65–75%RH",
    capacity: 4,
  },
  {
    id: "BIN-SUB",
    code: "亚热 SUB-02",
    zone: "subtropical",
    name: "亚热带调湿柜",
    tempRange: "16–22℃",
    humidity: "55–65%RH",
    capacity: 4,
  },
  {
    id: "BIN-TE",
    code: "温柜 TE-03",
    zone: "temperate",
    name: "温带常温柜",
    tempRange: "10–18℃",
    humidity: "45–55%RH",
    capacity: 4,
  },
  {
    id: "BIN-AL",
    code: "高寒 AL-04",
    zone: "alpine",
    name: "高寒低温干燥柜",
    tempRange: "2–8℃",
    humidity: "30–40%RH",
    capacity: 3,
  },
];

export const LOCALITIES: Locality[] = [
  {
    code: "LOC-YN-XSBN",
    name: "西双版纳勐腊补蚌",
    province: "云南",
    zone: "tropical",
    biome: "热带季节雨林",
    geo: "21.93°N, 101.25°E",
  },
  {
    code: "LOC-HN-JF",
    name: "尖峰岭热带雨林",
    province: "海南",
    zone: "tropical",
    biome: "热带季雨林",
    geo: "18.74°N, 108.87°E",
  },
  {
    code: "LOC-GD-DHS",
    name: "肇庆鼎湖山",
    province: "广东",
    zone: "subtropical",
    biome: "南亚热带常绿阔叶林",
    geo: "23.17°N, 112.56°E",
  },
  {
    code: "LOC-GX-HP",
    name: "弄岗国家级保护区",
    province: "广西",
    zone: "subtropical",
    biome: "北热带喀斯特季雨林",
    geo: "22.46°N, 106.96°E",
  },
  {
    code: "LOC-YN-AL",
    name: "高黎贡山南段",
    province: "云南",
    zone: "temperate",
    biome: "中山湿性常绿阔叶林",
    geo: "25.10°N, 98.78°E",
  },
  {
    code: "LOC-SX-TBS",
    name: "太白山蒿坪寺",
    province: "陕西",
    zone: "temperate",
    biome: "暖温带落叶阔叶林",
    geo: "34.08°N, 107.75°E",
  },
  {
    code: "LOC-XJ-TMS",
    name: "天山后峡",
    province: "新疆",
    zone: "temperate",
    biome: "山地针叶林缘草甸",
    geo: "43.20°N, 86.70°E",
  },
  {
    code: "LOC-SC-HLZ",
    name: "海螺沟一号冰川下",
    province: "四川",
    zone: "alpine",
    biome: "高山流石滩草甸",
    geo: "29.57°N, 102.97°E",
  },
  {
    code: "LOC-XZ-SJ",
    name: "色季拉山西坡",
    province: "西藏",
    zone: "alpine",
    biome: "亚高山暗针叶林",
    geo: "29.62°N, 94.61°E",
  },
  {
    code: "LOC-QH-QLS",
    name: "祁连山东大滩",
    province: "青海",
    zone: "alpine",
    biome: "高寒灌丛草甸",
    geo: "37.40°N, 101.38°E",
  },
  {
    code: "LOC-JX-LS",
    name: "庐山芦林湖畔",
    province: "江西",
    zone: "subtropical",
    biome: "中亚热带针阔混交林",
    geo: "29.55°N, 115.98°E",
  },
];

interface SeedInput {
  no: number;
  collectNo: string;
  species: string;
  family: string;
  collector: string;
  loc: string;
  elevation: number;
  habitat: string;
  zone: Specimen["zone"];
  press: Specimen["pressStatus"];
  id: Specimen["idStatus"];
  voucher: string;
  quarantine: Specimen["quarantine"];
  source: string;
}

const RAW: SeedInput[] = [
  // —— 昆明 KUN：6 份 ——
  { no: 1, collectNo: "KUN-2024-0612", species: "云南肉豆蔻", family: "肉豆蔻科", collector: "杨岚、和加奎", loc: "LOC-YN-XSBN", elevation: 760, habitat: "沟谷雨林下层，板根明显", zone: "tropical", press: "pressed", id: "identified", voucher: "DZ-KUN-240601", quarantine: "pass", source: "KUN" },
  { no: 2, collectNo: "KUN-2024-0613", species: "番龙眼（待定）", family: "无患子科", collector: "和加奎", loc: "LOC-YN-XSBN", elevation: 810, habitat: "溪畔季雨林，羽状复叶", zone: "tropical", press: "pressed", id: "suspect", voucher: "DZ-KUN-240601", quarantine: "pass", source: "KUN" },
  { no: 3, collectNo: "KUN-2024-0701", species: "长蕊木兰", family: "木兰科", collector: "杨岚", loc: "LOC-GX-HP", elevation: 540, habitat: "喀斯特峰丛洼地，石灰岩基质", zone: "subtropical", press: "pressed", id: "identified", voucher: "", quarantine: "pass", source: "KUN" },
  { no: 4, collectNo: "KUN-2024-0705", species: "贡山栎（待定）", family: "壳斗科", collector: "斯那取追", loc: "LOC-YN-AL", elevation: 2350, habitat: "中山湿性常绿阔叶林，苔藓厚层", zone: "temperate", press: "pressed", id: "unidentified", voucher: "DZ-KUN-240702", quarantine: "", source: "KUN" },
  { no: 5, collectNo: "KUN-2024-0808", species: "紫背杜鹃", family: "杜鹃花科", collector: "斯那取追", loc: "LOC-XZ-SJ", elevation: 4120, habitat: "高山灌丛与暗针叶林交错带", zone: "alpine", press: "pressed", id: "identified", voucher: "DZ-KUN-240805", quarantine: "pass", source: "KUN" },
  { no: 6, collectNo: "KUN-2024-0810", species: "塔黄", family: "蓼科", collector: "斯那取追", loc: "LOC-SC-HLZ", elevation: 4450, habitat: "冰碛物流石滩，植株高大", zone: "alpine", press: "pressed", id: "identified", voucher: "DZ-KUN-240805", quarantine: "recheck", source: "KUN" },

  // —— 北京 PE：8 份 ——
  { no: 7, collectNo: "PE-2024-1120", species: "臭冷杉", family: "松科", collector: "刘冰、谢云", loc: "LOC-SX-TBS", elevation: 2150, habitat: "巴山冷杉林缘阴坡", zone: "temperate", press: "pressed", id: "identified", voucher: "DZ-PE-241103", quarantine: "pass", source: "PE" },
  { no: 8, collectNo: "PE-2024-1121", species: "菊科一种", family: "菊科", collector: "谢云", loc: "LOC-SX-TBS", elevation: 1780, habitat: "桦木林下路边", zone: "temperate", press: "pressed", id: "unidentified", voucher: "DZ-PE-241103", quarantine: "pass", source: "PE" },
  { no: 9, collectNo: "PE-2024-1122", species: "膜荚黄芪", family: "豆科", collector: "刘冰", loc: "LOC-SX-TBS", elevation: 1320, habitat: "灌草丛，黄棕壤", zone: "temperate", press: "pending", id: "identified", voucher: "", quarantine: "", source: "PE" },
  { no: 10, collectNo: "PE-2024-1201", species: "雪莲花", family: "菊科", collector: "谢云", loc: "LOC-XZ-SJ", elevation: 4680, habitat: "流石滩雪线附近", zone: "alpine", press: "pressed", id: "identified", voucher: "DZ-PE-241201", quarantine: "pass", source: "PE" },
  { no: 11, collectNo: "PE-2024-1202", species: "垫状点地梅", family: "报春花科", collector: "谢云", loc: "LOC-QH-QLS", elevation: 3920, habitat: "高寒草甸裸地斑块", zone: "alpine", press: "pressed", id: "identified", voucher: "DZ-PE-241201", quarantine: "pass", source: "PE" },
  { no: 12, collectNo: "PE-2024-1205", species: "新疆忍冬", family: "忍冬科", collector: "李新军", loc: "LOC-XJ-TMS", elevation: 1980, habitat: "云杉林缘河谷灌丛", zone: "temperate", press: "pressed", id: "identified", voucher: "DZ-PE-241202", quarantine: "pass", source: "PE" },
  { no: 13, collectNo: "PE-2024-1206", species: "雪岭云杉", family: "松科", collector: "李新军", loc: "LOC-XJ-TMS", elevation: 2210, habitat: "阴坡纯林，苔藓地被", zone: "temperate", press: "pressed", id: "identified", voucher: "DZ-PE-241202", quarantine: "pass", source: "PE" },
  { no: 14, collectNo: "PE-2024-1210", species: "山茶属一种", family: "山茶科", collector: "刘冰", loc: "LOC-JX-LS", elevation: 1080, habitat: "针阔混交林下酸性土", zone: "subtropical", press: "pending", id: "suspect", voucher: "", quarantine: "pass", source: "PE" },

  // —— 华南 IBSC：6 份 ——
  { no: 15, collectNo: "IBSC-2024-0518", species: "青梅", family: "龙脑香科", collector: "陈炳辉、黄小华", loc: "LOC-HN-JF", elevation: 260, habitat: "低地雨林，板根与绞杀常见", zone: "tropical", press: "pressed", id: "identified", voucher: "DZ-IBSC-240501", quarantine: "pass", source: "IBSC" },
  { no: 16, collectNo: "IBSC-2024-0519", species: "降香黄檀", family: "豆科", collector: "黄小华", loc: "LOC-HN-JF", elevation: 320, habitat: "季雨林疏林坡地", zone: "tropical", press: "pressed", id: "identified", voucher: "DZ-IBSC-240501", quarantine: "pass", source: "IBSC" },
  { no: 17, collectNo: "IBSC-2024-0521", species: "陆均松", family: "罗汉松科", collector: "陈炳辉", loc: "LOC-HN-JF", elevation: 690, habitat: "山地雨林上层乔木", zone: "tropical", press: "pressed", id: "identified", voucher: "", quarantine: "pass", source: "IBSC" },
  { no: 18, collectNo: "IBSC-2024-0601", species: "观光木", family: "木兰科", collector: "陈炳辉", loc: "LOC-GD-DHS", elevation: 180, habitat: "沟谷常绿阔叶林", zone: "subtropical", press: "pressed", id: "identified", voucher: "DZ-IBSC-240602", quarantine: "pass", source: "IBSC" },
  { no: 19, collectNo: "IBSC-2024-0602", species: "金毛狗（待复核）", family: "金毛狗科", collector: "黄小华", loc: "LOC-GD-DHS", elevation: 120, habitat: "溪谷酸性土，层片密集", zone: "subtropical", press: "pending", id: "suspect", voucher: "DZ-IBSC-240602", quarantine: "", source: "IBSC" },
  { no: 20, collectNo: "IBSC-2024-0606", species: "海南大风子", family: "大风子科", collector: "黄小华", loc: "LOC-GX-HP", elevation: 360, habitat: "喀斯特季节性雨林，石芽裸露", zone: "subtropical", press: "pressed", id: "identified", voucher: "DZ-IBSC-240602", quarantine: "pass", source: "IBSC" },
];

export function buildSeedSpecimens(): Specimen[] {
  return RAW.map((r) => ({
    id: "SP-" + String(r.no).padStart(3, "0"),
    collectNo: r.collectNo,
    species: r.species,
    family: r.family,
    collector: r.collector,
    localityCode: r.loc,
    elevation: r.elevation,
    habitat: r.habitat,
    pressStatus: r.press,
    idStatus: r.id,
    zone: r.zone,
    voucherNo: r.voucher,
    quarantine: r.quarantine,
    sourceId: r.source,
    location: { kind: "source" },
  }));
}
