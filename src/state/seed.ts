import type {
  AppState,
  ClimateZone,
  EventType,
  IdentifyStatus,
  QuarantineResult,
  Specimen,
  TransferBatch,
  TransferEvent,
} from "../rules/types";

const ts = (
  year: number,
  month: number,
  day: number,
  hour = 9,
  minute = 0,
) => new Date(year, month - 1, day, hour, minute).getTime();

interface SeedInput {
  collectionNo: string;
  species: string;
  family?: string;
  locality: string;
  altitude?: number;
  habitat?: string;
  collector?: string;
  identify?: IdentifyStatus;
  zone: ClimateZone;
  voucherNo?: string;
  quarantine?: QuarantineResult;
  pressed?: boolean;
}

let counter = 0;
function sp(
  batchId: string,
  sourceId: string,
  input: SeedInput,
  stage: Specimen["stage"],
  at: number,
  stored?: { binId: string; slotNo: string },
  returned?: number,
): Specimen {
  counter += 1;
  return {
    id: `SP-${String(counter).padStart(3, "0")}`,
    batchId,
    sourceId,
    collectionNo: input.collectionNo,
    species: input.species,
    family: input.family,
    locality: input.locality,
    altitude: input.altitude,
    habitat: input.habitat,
    collector: input.collector,
    pressed: input.pressed ?? true,
    identifyStatus: input.identify ?? "pending",
    voucherNo: input.voucherNo,
    quarantine: input.quarantine ?? "",
    zone: input.zone,
    stage: returned ? "returned" : stage,
    binId: returned ? undefined : stored?.binId,
    slotNo: returned ? undefined : stored?.slotNo,
    receivedAt: stored ? at : undefined,
    returnedAt: returned,
    createdAt: at,
  };
}

const PASS = "pass" as const;

function buildSeed(): AppState {
  const batches: TransferBatch[] = [
    {
      id: "B2409-01",
      sourceId: "HITBC",
      manifestNo: "ML-2409-011",
      createdAt: ts(2024, 9, 5, 9, 20),
      stage: "received",
      verifiedAt: ts(2024, 9, 5, 9, 35),
    },
    {
      id: "B2409-02",
      sourceId: "LSBG",
      manifestNo: "ML-2409-021",
      createdAt: ts(2024, 9, 8, 8, 40),
      stage: "received",
      verifiedAt: ts(2024, 9, 8, 8, 55),
    },
    {
      id: "B2409-03",
      sourceId: "CBM",
      manifestNo: "ML-2409-031",
      createdAt: ts(2024, 9, 11, 10, 10),
      stage: "received",
      verifiedAt: ts(2024, 9, 11, 10, 30),
    },
    {
      id: "B2409-04",
      sourceId: "HITBC",
      manifestNo: "ML-2409-042",
      createdAt: ts(2024, 9, 18, 14, 0),
      stage: "verified",
      verifiedAt: ts(2024, 9, 18, 14, 20),
    },
    {
      id: "B2409-05",
      sourceId: "CBM",
      manifestNo: "ML-2409-051",
      createdAt: ts(2024, 9, 19, 11, 0),
      stage: "verified",
      verifiedAt: ts(2024, 9, 19, 11, 25),
    },
    {
      id: "B2409-06",
      sourceId: "LSBG",
      manifestNo: "ML-2409-061",
      createdAt: ts(2024, 9, 20, 15, 30),
      stage: "pending",
    },
  ];

  const specimens: Specimen[] = [
    // B2409-01 版纳馆 · 热带 5 份（其中 1 份已退回）
    sp("B2409-01", "HITBC", {
      collectionNo: "HX-TR-001", species: "箭毒木", family: "桑科",
      locality: "西双版纳勐腊县望天树林", altitude: 780, habitat: "热带季雨林",
      collector: "陶安达", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-018", quarantine: PASS,
    }, "stored", ts(2024, 9, 5, 10, 2), { binId: "BIN-TR", slotNo: "TR-A-01" }),
    sp("B2409-01", "HITBC", {
      collectionNo: "HX-TR-002", species: "云南肉豆蔻", family: "肉豆蔻科",
      locality: "西双版纳勐腊补崩", altitude: 820, habitat: "沟谷雨林",
      collector: "陶安达", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-019", quarantine: PASS,
    }, "stored", ts(2024, 9, 5, 10, 2), { binId: "BIN-TR", slotNo: "TR-A-02" }),
    sp("B2409-01", "HITBC", {
      collectionNo: "HX-TR-003", species: "版纳青梅", family: "龙脑香科",
      locality: "勐腊县曼拉检查站", altitude: 740, habitat: "湿性季节性雨林",
      collector: "林红羽", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-020", quarantine: PASS,
    }, "stored", ts(2024, 9, 5, 10, 2), { binId: "BIN-TR", slotNo: "TR-A-03" }),
    sp("B2409-01", "HITBC", {
      collectionNo: "HX-TR-004", species: "四数木", family: "四数木科",
      locality: "勐腊葫芦信", altitude: 690, habitat: "石灰山雨林",
      collector: "林红羽", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-021", quarantine: PASS,
    }, "stored", ts(2024, 9, 5, 10, 2), { binId: "BIN-TR", slotNo: "TR-A-04" }),
    sp("B2409-01", "HITBC", {
      collectionNo: "HX-TR-005", species: "大花万代兰", family: "兰科",
      locality: "勐海布朗山", altitude: 1350, habitat: "山地常绿阔叶林",
      collector: "陶安达", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-022", quarantine: PASS,
    }, "stored", ts(2024, 9, 5, 10, 2), { binId: "BIN-TR", slotNo: "TR-A-05" },
      ts(2024, 9, 14, 9, 10)),

    // B2409-02 庐山馆 · 亚热带 4 + 温带 2
    sp("B2409-02", "LSBG", {
      collectionNo: "HX-ST-001", species: "香果树", family: "茜草科",
      locality: "庐山乌龙潭", altitude: 1020, habitat: "山谷溪边阔叶混交林",
      collector: "陈慕云", identify: "identified", zone: "subtropical",
      voucherNo: "LS-V-2409-088", quarantine: PASS,
    }, "stored", ts(2024, 9, 8, 9, 30), { binId: "BIN-ST", slotNo: "ST-B-01" }),
    sp("B2409-02", "LSBG", {
      collectionNo: "HX-ST-002", species: "伯乐树", family: "叠珠树科",
      locality: "庐山含鄱口", altitude: 1160, habitat: "山坡疏林",
      collector: "陈慕云", identify: "identified", zone: "subtropical",
      voucherNo: "LS-V-2409-089", quarantine: PASS,
    }, "stored", ts(2024, 9, 8, 9, 30), { binId: "BIN-ST", slotNo: "ST-B-02" }),
    sp("B2409-02", "LSBG", {
      collectionNo: "HX-ST-003", species: "青钱柳", family: "胡桃科",
      locality: "庐山五老峰", altitude: 1280, habitat: "山地沟谷林",
      collector: "何知远", identify: "identified", zone: "subtropical",
      voucherNo: "LS-V-2409-090", quarantine: PASS,
    }, "stored", ts(2024, 9, 8, 9, 30), { binId: "BIN-ST", slotNo: "ST-B-03" }),
    sp("B2409-02", "LSBG", {
      collectionNo: "HX-ST-004", species: "庐山石韦",
      locality: "庐山仙人洞", altitude: 1080, habitat: "阴湿石面",
      collector: "何知远", identify: "doubtful", zone: "subtropical",
      voucherNo: "LS-V-2409-091", quarantine: PASS,
    }, "stored", ts(2024, 9, 8, 9, 30), { binId: "BIN-ST", slotNo: "ST-B-04" }),
    sp("B2409-02", "LSBG", {
      collectionNo: "HX-TM-001", species: "天女木兰", family: "木兰科",
      locality: "庐山小天池", altitude: 1210, habitat: "针阔混交林",
      collector: "陈慕云", identify: "identified", zone: "temperate",
      voucherNo: "LS-V-2409-092", quarantine: PASS,
    }, "stored", ts(2024, 9, 8, 9, 30), { binId: "BIN-TM", slotNo: "TM-C-01" }),
    sp("B2409-02", "LSBG", {
      collectionNo: "HX-TM-002", species: "黄山松", family: "松科",
      locality: "庐山汉阳峰", altitude: 1420, habitat: "山脊矮林",
      collector: "何知远", identify: "identified", zone: "temperate",
      voucherNo: "LS-V-2409-093", quarantine: PASS,
    }, "stored", ts(2024, 9, 8, 9, 30), { binId: "BIN-TM", slotNo: "TM-C-02" }),

    // B2409-03 长白山馆 · 温带 4 + 高山 5
    sp("B2409-03", "CBM", {
      collectionNo: "HX-TM-003", species: "红松", family: "松科",
      locality: "长白山西坡", altitude: 1100, habitat: "红松阔叶混交林",
      collector: "朴正吉", identify: "identified", zone: "temperate",
      voucherNo: "CB-V-2409-046", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-TM", slotNo: "TM-C-03" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-TM-004", species: "紫椴", family: "锦葵科",
      locality: "长白山二道白河", altitude: 760, habitat: "阔叶红松林",
      collector: "朴正吉", identify: "identified", zone: "temperate",
      voucherNo: "CB-V-2409-047", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-TM", slotNo: "TM-C-04" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-TM-005", species: "东北刺人参", family: "五加科",
      locality: "长白山大峡谷", altitude: 1250, habitat: "针阔混交林阴湿处",
      collector: "金成柱", identify: "identified", zone: "temperate",
      voucherNo: "CB-V-2409-048", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-TM", slotNo: "TM-C-05" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-TM-006", species: "花楷槭",
      locality: "长白山地下森林", altitude: 1180, habitat: "溪流沿岸林",
      collector: "金成柱", zone: "temperate",
      voucherNo: "CB-V-2409-049", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-TM", slotNo: "TM-C-06" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-AL-001", species: "高山红景天", family: "景天科",
      locality: "长白山天池西坡", altitude: 2100, habitat: "高山苔原岩缝",
      collector: "朴正吉", identify: "identified", zone: "alpine",
      voucherNo: "CB-V-2409-050", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-AL", slotNo: "AL-D-01" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-AL-002", species: "高山罂粟", family: "罂粟科",
      locality: "长白山将军峰", altitude: 2450, habitat: "高山冻原",
      collector: "金成柱", identify: "identified", zone: "alpine",
      voucherNo: "CB-V-2409-051", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-AL", slotNo: "AL-D-02" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-AL-003", species: "长白山棘豆", family: "豆科",
      locality: "长白山天文峰", altitude: 2380, habitat: "砾石苔原",
      collector: "朴正吉", identify: "identified", zone: "alpine",
      voucherNo: "CB-V-2409-052", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-AL", slotNo: "AL-D-03" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-AL-004", species: "牛皮杜鹃", family: "杜鹃花科",
      locality: "长白山西坡苔原带", altitude: 2050, habitat: "高山苔原",
      collector: "金成柱", identify: "identified", zone: "alpine",
      voucherNo: "CB-V-2409-053", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-AL", slotNo: "AL-D-04" }),
    sp("B2409-03", "CBM", {
      collectionNo: "HX-AL-005", species: "仙女木", family: "蔷薇科",
      locality: "长白山白云峰", altitude: 2520, habitat: "雪线附近石砾坡",
      collector: "朴正吉", identify: "doubtful", zone: "alpine",
      voucherNo: "CB-V-2409-054", quarantine: PASS,
    }, "stored", ts(2024, 9, 11, 11, 15), { binId: "BIN-AL", slotNo: "AL-D-05" }),

    // B2409-04 版纳馆 · 热带 4 份待拆箱（恰好填满热带柜）
    sp("B2409-04", "HITBC", {
      collectionNo: "HX-TR-006", species: "滇南红厚壳", family: "胡桐科",
      locality: "勐腊易武", altitude: 900, habitat: "热带沟谷林",
      collector: "陶安达", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-101", quarantine: PASS,
    }, "queued", ts(2024, 9, 18, 14, 0)),
    sp("B2409-04", "HITBC", {
      collectionNo: "HX-TR-007", species: "假海桐", family: "水螅花科",
      locality: "勐腊尚勇", altitude: 860, habitat: "热带雨林下木",
      collector: "林红羽", zone: "tropical",
      voucherNo: "HN-V-2409-102", quarantine: PASS,
    }, "queued", ts(2024, 9, 18, 14, 0)),
    sp("B2409-04", "HITBC", {
      collectionNo: "HX-TR-008", species: "阔叶风车子", family: "使君子科",
      locality: "勐腊勐仑", altitude: 580, habitat: "热带次生林",
      collector: "陶安达", identify: "identified", zone: "tropical",
      voucherNo: "HN-V-2409-103", quarantine: PASS,
    }, "queued", ts(2024, 9, 18, 14, 0)),
    sp("B2409-04", "HITBC", {
      collectionNo: "HX-TR-009", species: "版纳藤黄", family: "藤黄科",
      locality: "勐腊关累", altitude: 700, habitat: "低丘雨林",
      collector: "林红羽", identify: "doubtful", zone: "tropical",
      voucherNo: "HN-V-2409-104", quarantine: PASS,
    }, "queued", ts(2024, 9, 18, 14, 0)),

    // B2409-05 长白山馆 · 高山 3 份待拆箱（高山柜仅剩 1 位 → 整次拒收）
    sp("B2409-05", "CBM", {
      collectionNo: "HX-AL-006", species: "长白岩茴香", family: "伞形科",
      locality: "长白山华盖峰", altitude: 2300, habitat: "砾石质苔原",
      collector: "朴正吉", zone: "alpine",
      voucherNo: "CB-V-2409-071", quarantine: PASS,
    }, "queued", ts(2024, 9, 19, 11, 0)),
    sp("B2409-05", "CBM", {
      collectionNo: "HX-AL-007", species: "短柱鹿蹄草", family: "杜鹃花科",
      locality: "长白山梯子河", altitude: 1850, habitat: "暗针叶林苔藓层",
      collector: "金成柱", identify: "identified", zone: "alpine",
      voucherNo: "CB-V-2409-072", quarantine: PASS,
    }, "queued", ts(2024, 9, 19, 11, 0)),
    sp("B2409-05", "CBM", {
      collectionNo: "HX-AL-008", species: "北极林奈木", family: "忍冬科",
      locality: "长白山天池林线", altitude: 1900, habitat: "岳桦矮曲林",
      collector: "朴正吉", zone: "alpine",
      voucherNo: "CB-V-2409-073", quarantine: PASS,
    }, "queued", ts(2024, 9, 19, 11, 0)),

    // B2409-06 庐山馆 · 待核验：缺凭证 / 检疫不合格 → 整批拒收
    sp("B2409-06", "LSBG", {
      collectionNo: "HX-ST-005", species: "银鹊树",
      locality: "庐山黄龙潭", altitude: 950, habitat: "沟谷阔叶林",
      collector: "陈慕云", zone: "subtropical",
      quarantine: "",
    }, "pending", ts(2024, 9, 20, 15, 30)),
    sp("B2409-06", "LSBG", {
      collectionNo: "HX-ST-006", species: "紫茎", family: "山茶科",
      locality: "庐山芦林", altitude: 1100, habitat: "山地常绿林",
      collector: "何知远", identify: "identified", zone: "subtropical",
      voucherNo: "LS-V-2409-331", quarantine: "fail",
    }, "pending", ts(2024, 9, 20, 15, 30)),
    sp("B2409-06", "LSBG", {
      collectionNo: "HX-ST-007", species: "白辛树",
      locality: "庐山石门涧", altitude: 880, habitat: "溪谷杂木林",
      collector: "陈慕云", zone: "subtropical",
      voucherNo: "", quarantine: PASS,
    }, "pending", ts(2024, 9, 20, 15, 30)),
  ];

  const idOf = (no: string) =>
    specimens.find((s) => s.collectionNo === no)!.id;

  const ev = (
    at: number,
    type: EventType,
    batchId: string,
    sourceId: string,
    message: string,
    extra?: Partial<TransferEvent>,
  ): TransferEvent => ({
    id: `EV-${Math.random().toString(36).slice(2, 9)}`,
    at, type, batchId, sourceId, message, ...extra,
  });

  const events: TransferEvent[] = [
    ev(ts(2024, 9, 5, 9, 20), "registered", "B2409-01", "HITBC",
      "版纳馆调拨清单 ML-2409-011 登记，5 份热带标本待核验"),
    ev(ts(2024, 9, 5, 9, 35), "verified", "B2409-01", "HITBC",
      "5 份标本调出凭证齐全、检疫全部合格，核验通过"),
    ev(ts(2024, 9, 5, 10, 2), "received", "B2409-01", "HITBC",
      "TR-A 热带湿热柜拆箱入位 5 份（TR-A-01 ~ TR-A-05）", { binId: "BIN-TR" }),
    ev(ts(2024, 9, 8, 9, 30), "received", "B2409-02", "LSBG",
      "按气候带拆箱：ST-B 入位 4 份、TM-C 入位 2 份"),
    ev(ts(2024, 9, 11, 11, 15), "received", "B2409-03", "CBM",
      "按气候带拆箱：TM-C 入位 4 份、AL-D 入位 5 份"),
    ev(ts(2024, 9, 14, 9, 10), "returned", "B2409-01", "HITBC",
      "HX-TR-005 大花万代兰退回版纳馆（馆际复查重号），柜位 TR-A-05 已释放",
      { specimenIds: [idOf("HX-TR-005")] }),
    ev(ts(2024, 9, 18, 14, 0), "registered", "B2409-04", "HITBC",
      "版纳馆调拨清单 ML-2409-042 登记，4 份热带标本待核验"),
    ev(ts(2024, 9, 18, 14, 20), "verified", "B2409-04", "HITBC",
      "4 份标本凭证与检疫齐全，核验通过，进入拆箱队列"),
    ev(ts(2024, 9, 19, 11, 0), "registered", "B2409-05", "CBM",
      "长白山馆调拨清单 ML-2409-051 登记，3 份高山标本待核验"),
    ev(ts(2024, 9, 19, 11, 25), "verified", "B2409-05", "CBM",
      "3 份标本凭证与检疫齐全，核验通过，进入拆箱队列"),
    ev(ts(2024, 9, 20, 15, 30), "registered", "B2409-06", "LSBG",
      "庐山馆调拨清单 ML-2409-061 登记，3 份标本待核验"),
  ];

  return { batches, specimens, events };
}

export function createSeed(): AppState {
  return buildSeed();
}
