import { reducer } from "./src/state/reducer";
import { createSeed } from "./src/state/seed";
import { storedInBin } from "./src/state/selectors";
import { BINS } from "./src/rules/constants";
import type { NewSpecimenInput } from "./src/state/reducer";

let failures = 0;
function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ ${msg}`);
  } else {
    failures++;
    console.error(`  ✗ ${msg}`);
  }
}

const mk = (over: Partial<NewSpecimenInput> = {}): NewSpecimenInput => ({
  collectionNo: "T-1",
  species: "测试种",
  locality: "测试地",
  identifyStatus: "pending",
  quarantine: "pass",
  voucherNo: "V-1",
  zone: "tropical",
  ...over,
});

console.log("场景1：种子数据 —— 待核验批次 B2409-06 缺凭证+检疫不合格，整批拒收");
{
  let s = createSeed();
  const trBefore = storedInBin(s, "BIN-TR").length;
  s = reducer(s, { type: "VERIFY_BATCH", batchId: "B2409-06" });
  const b = s.batches.find((x) => x.id === "B2409-06")!;
  assert(b.stage === "rejected", "批次状态变为 rejected");
  assert(!!b.rejectReason && b.rejectReason.includes("缺调出凭证"), "拒收原因含缺凭证");
  assert(b.rejectReason!.includes("检疫不合格"), "拒收原因含检疫不合格");
  assert(s.specimens.filter((x) => x.batchId === "B2409-06").every((x) => x.stage === "pending"), "标本仍为 pending，未进队列");
  assert(storedInBin(s, "BIN-TR").length === trBefore, "仓位未动");
  assert(s.events.at(-1)!.type === "rejected", "历史记录 rejected 事件");
}

console.log("场景2：合规批次核验通过，进入拆箱队列");
{
  let s = createSeed();
  s = reducer(s, { type: "VERIFY_BATCH", batchId: "B2409-06" }); // 先拒收占用无影响
  s = reducer(s, {
    type: "ADD_BATCH",
    sourceId: "LSBG",
    manifestNo: "ML-T-1",
    specimens: [mk({ collectionNo: "T-A" }), mk({ collectionNo: "T-B", zone: "subtropical" })],
  });
  const newId = s.batches.at(-1)!.id;
  s = reducer(s, { type: "VERIFY_BATCH", batchId: newId });
  assert(s.batches.at(-1)!.stage === "verified", "批次变为 verified");
  assert(s.specimens.filter((x) => x.batchId === newId).every((x) => x.stage === "queued"), "两份进入 queued");
}

console.log("场景3：容量不足整次拒收 —— 高山柜 5/6，B2409-05 需入 3 份");
{
  let s = createSeed();
  const before = storedInBin(s, "BIN-AL").length;
  assert(before === 5, `初始高山柜 5 份（实际 ${before}）`);
  const queuedBefore = s.specimens.filter((x) => x.batchId === "B2409-05").length;
  s = reducer(s, { type: "RECEIVE_BOX", batchId: "B2409-05", binId: "BIN-AL" });
  assert(storedInBin(s, "BIN-AL").length === 5, "高山柜仍为 5 份，容量未变");
  assert(s.specimens.filter((x) => x.batchId === "B2409-05").length === queuedBefore, "清单份数不动");
  assert(s.specimens.filter((x) => x.batchId === "B2409-05").every((x) => x.stage === "queued"), "标本仍在队列");
  assert(s.events.at(-1)!.type === "receive_rejected", "记录拆箱拒收事件");
  assert(s.events.at(-1)!.message.includes("容量不足"), "原因提示容量不足");
}

console.log("场景4：混入不匹配标本整次拒收 —— 热带箱误入亚热带柜");
{
  let s = createSeed();
  s = reducer(s, {
    type: "ADD_BATCH",
    sourceId: "LSBG",
    manifestNo: "ML-T-2",
    specimens: [mk({ collectionNo: "MIX-1", zone: "tropical" })],
  });
  const id = s.batches.at(-1)!.id;
  s = reducer(s, { type: "VERIFY_BATCH", batchId: id });
  const stBefore = storedInBin(s, "BIN-ST").length;
  s = reducer(s, { type: "RECEIVE_BOX", batchId: id, binId: "BIN-ST" });
  assert(s.events.at(-1)!.type === "receive_rejected", "记录拆箱拒收");
  assert(s.events.at(-1)!.message.includes("不匹配"), "原因提示气候带不匹配");
  assert(storedInBin(s, "BIN-ST").length === stBefore, "亚热带柜未变");
  // 选对柜位则正常入位
  const trBefore = storedInBin(s, "BIN-TR").length;
  s = reducer(s, { type: "RECEIVE_BOX", batchId: id, binId: "BIN-TR" });
  assert(s.events.at(-1)!.type === "received", "改入热带柜成功");
  assert(storedInBin(s, "BIN-TR").length === trBefore + 1, "热带柜 +1");
}

console.log("场景5：容量拒收 → 退回释放 → 整次入位（B2409-04 热带 4 份，种子 4/8）");
{
  let s = createSeed();
  assert(storedInBin(s, "BIN-TR").length === 4, `种子热带柜 4/8（实际 ${storedInBin(s, "BIN-TR").length}）`);
  // 正常入位 4 份至 8/8
  s = reducer(s, { type: "RECEIVE_BOX", batchId: "B2409-04", binId: "BIN-TR" });
  assert(storedInBin(s, "BIN-TR").length === 8, "4 份入位后 8/8");
  assert(s.events.at(-1)!.type === "received", "记录 received 事件");
  const slots = s.specimens.filter((x) => x.batchId === "B2409-04").map((x) => x.slotNo);
  assert(new Set(slots).size === 4 && slots.every(Boolean), `柜位号唯一：${slots.join(",")}`);
  // 再来一箱 1 份热带，满柜拒收
  s = reducer(s, {
    type: "ADD_BATCH",
    sourceId: "HITBC",
    manifestNo: "ML-T-3",
    specimens: [mk({ collectionNo: "FULL-1" })],
  });
  const id2 = s.batches.at(-1)!.id;
  s = reducer(s, { type: "VERIFY_BATCH", batchId: id2 });
  s = reducer(s, { type: "RECEIVE_BOX", batchId: id2, binId: "BIN-TR" });
  assert(s.events.at(-1)!.type === "receive_rejected", "满柜整次拒收");
  assert(s.events.at(-1)!.message.includes("容量不足"), "原因含容量不足");
  // 退回 1 份释放后再入
  const victim = storedInBin(s, "BIN-TR")[0];
  s = reducer(s, { type: "RETURN_SPECIMEN", specimenId: victim.id, reason: "测试退回" });
  assert(storedInBin(s, "BIN-TR").length === 7, "退回释放为 7/8");
  const returned = s.specimens.find((x) => x.id === victim.id)!;
  assert(returned.stage === "returned" && !returned.binId && !returned.slotNo, "标本为 returned 且无柜位");
  s = reducer(s, { type: "RECEIVE_BOX", batchId: id2, binId: "BIN-TR" });
  assert(storedInBin(s, "BIN-TR").length === 8, "释放后入位成功，恢复 8/8");
  assert(s.events.at(-1)!.type === "received", "记录 received 事件");
  assert(s.events.filter((e) => e.type === "returned").length >= 2, "退回历史全程保留");
}

console.log("场景6：RESET 恢复预置");
{
  let s = createSeed();
  s = reducer(s, { type: "RESET" });
  assert(s.batches.length === 6 && s.specimens.length === 30, "恢复为 6 批次 30 份种子数据");
}

console.log(`仓位预置：${BINS.map((b) => `${b.name}${b.capacity}`).join("、")}`);
console.log(failures === 0 ? "\n全部通过 ✅" : `\n${failures} 项失败 ❌`);
process.exit(failures === 0 ? 0 : 1);
