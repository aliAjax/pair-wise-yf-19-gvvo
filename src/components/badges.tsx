import type { ClimateZone, IdStatus, PressStatus, Quarantine, Specimen } from "../types";
import { idStatusLabel, quarantineLabel, zoneLabel } from "../rules/transfer";

export function ZoneBadge({ zone }: { zone: ClimateZone }) {
  return <span className={`badge zone-${zone}`}>{zoneLabel(zone)}</span>;
}

export function IdBadge({ status }: { status: IdStatus }) {
  return <span className={`badge id-${status}`}>{idStatusLabel(status)}</span>;
}

export function PressBadge({ status }: { status: PressStatus }) {
  return (
    <span className={`badge press-${status}`}>{status === "pressed" ? "已压制" : "待压制"}</span>
  );
}

export function QuarantineBadge({ q }: { q: Quarantine }) {
  return (
    <span className={`badge q-${q === "pass" ? "pass" : q === "recheck" ? "recheck" : "none"}`}>
      {quarantineLabel(q)}
    </span>
  );
}

export function DocFlags({ sp }: { sp: Specimen }) {
  return (
    <span className="doc-flags">
      {sp.voucherNo ? (
        <em className="flag ok">凭证 {sp.voucherNo}</em>
      ) : (
        <em className="flag bad">缺调出凭证</em>
      )}
      {sp.quarantine ? (
        <em className="flag ok">{quarantineLabel(sp.quarantine)}</em>
      ) : (
        <em className="flag bad">缺检疫结论</em>
      )}
    </span>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="empty">{text}</p>;
}

export function fmtTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
