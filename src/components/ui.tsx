import {
  IDENTIFY_LABEL,
  QUARANTINE_LABEL,
  SOURCE_MAP,
  STAGE_LABEL,
  ZONE_LABEL,
} from "../rules/constants";
import type { IdentifyStatus, Specimen, SpecimenStage } from "../rules/types";

export function fmtDateTime(at: number): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(
    d.getHours(),
  )}:${p(d.getMinutes())}`;
}

export function fmtDate(at: number): string {
  return fmtDateTime(at).slice(0, 10);
}

export function sourceName(id: string): string {
  return SOURCE_MAP[id]?.name ?? id;
}

export function sourceShort(id: string): string {
  return SOURCE_MAP[id]?.short ?? id;
}

const toneClass: Record<string, string> = {
  ok: "badge-ok",
  bad: "badge-bad",
  warn: "badge-warn",
  info: "badge-info",
};

export function Badge({
  tone = "info",
  children,
}: {
  tone?: "ok" | "bad" | "warn" | "info";
  children: React.ReactNode;
}) {
  return <span className={`badge ${toneClass[tone]}`}>{children}</span>;
}

export function StageBadge({ stage }: { stage: SpecimenStage }) {
  const tone =
    stage === "stored"
      ? "ok"
      : stage === "returned"
        ? "warn"
        : stage === "queued"
          ? "info"
          : "bad";
  return <Badge tone={tone}>{STAGE_LABEL[stage]}</Badge>;
}

export function IdentifyBadge({ status }: { status: IdentifyStatus }) {
  return (
    <Badge tone={status === "identified" ? "ok" : status === "doubtful" ? "warn" : "info"}>
      {IDENTIFY_LABEL[status]}
    </Badge>
  );
}

export function QuarantineBadge({ value }: { value: Specimen["quarantine"] }) {
  if (value === "pass") return <Badge tone="ok">{QUARANTINE_LABEL.pass}</Badge>;
  if (value === "fail") return <Badge tone="bad">{QUARANTINE_LABEL.fail}</Badge>;
  return <Badge tone="bad">{QUARANTINE_LABEL[""]}</Badge>;
}

export function ZoneTag({ zone }: { zone: Specimen["zone"] }) {
  return <span className={`zone-tag zone-${zone}`}>{ZONE_LABEL[zone]}</span>;
}
