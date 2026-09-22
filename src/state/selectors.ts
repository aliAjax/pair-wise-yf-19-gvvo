import { BINS } from "../rules/constants";
import type { AppState, Bin, ClimateZone, Specimen, TransferBatch } from "../rules/types";

export function batchSpecimens(state: AppState, batchId: string): Specimen[] {
  return state.specimens.filter((s) => s.batchId === batchId);
}

export function storedInBin(state: AppState, binId: string): Specimen[] {
  return state.specimens.filter(
    (s) => s.stage === "stored" && s.binId === binId,
  );
}

export function binUsage(state: AppState, bin: Bin): number {
  return storedInBin(state, bin.id).length;
}

export function pendingBatches(state: AppState): TransferBatch[] {
  return state.batches.filter((b) => b.stage === "pending");
}

export function rejectedBatches(state: AppState): TransferBatch[] {
  return state.batches.filter((b) => b.stage === "rejected");
}

// 已核验、可拆箱的批次（仍有 queued 标本）
export function readyBatches(state: AppState): TransferBatch[] {
  return state.batches.filter((b) => b.stage === "verified");
}

export function queuedSpecimens(state: AppState): Specimen[] {
  return state.specimens.filter((s) => s.stage === "queued");
}

export function storedSpecimens(state: AppState): Specimen[] {
  return state.specimens.filter((s) => s.stage === "stored");
}

export function returnedSpecimens(state: AppState): Specimen[] {
  return state.specimens.filter((s) => s.stage === "returned");
}

export function eventsForSpecimen(
  state: AppState,
  specimenId: string,
): AppState["events"] {
  return state.events.filter(
    (e) =>
      e.specimenIds?.includes(specimenId) ||
      state.specimens.find(
        (s) => s.id === specimenId && s.batchId === e.batchId,
      ) !== undefined,
  );
}

// 采集地卡：按采集地点聚合
export interface LocalityCard {
  locality: string;
  count: number;
  stored: number;
  zones: ClimateZone[];
  altitudes: number[];
  species: string[];
}

export function localityCards(state: AppState): LocalityCard[] {
  const map = new Map<string, LocalityCard>();
  state.specimens.forEach((s) => {
    if (s.stage === "returned") return;
    const card =
      map.get(s.locality) ??
      ({
        locality: s.locality,
        count: 0,
        stored: 0,
        zones: [],
        altitudes: [],
        species: [],
      } satisfies LocalityCard);
    card.count += 1;
    if (s.stage === "stored") card.stored += 1;
    if (!card.zones.includes(s.zone)) card.zones.push(s.zone);
    if (s.altitude !== undefined && !card.altitudes.includes(s.altitude)) {
      card.altitudes.push(s.altitude);
    }
    if (!card.species.includes(s.species)) card.species.push(s.species);
    map.set(s.locality, card);
  });
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function binOverview(state: AppState) {
  return BINS.map((bin) => ({
    bin,
    used: binUsage(state, bin),
    specimens: storedInBin(state, bin.id),
  }));
}
