import { IdentifyBadge, QuarantineBadge, StageBadge, ZoneTag, sourceShort } from "./ui";
import type { Specimen } from "../rules/types";

export function SpecimenRow({
  specimen,
  onOpen,
  action,
}: {
  specimen: Specimen;
  onOpen?: (id: string) => void;
  action?: React.ReactNode;
}) {
  return (
    <div className="sp-row" onClick={onOpen ? () => onOpen(specimen.id) : undefined}>
      <div className="sp-main">
        <div className="sp-title">
          <button className="sp-link" onClick={(e) => { e.stopPropagation(); onOpen?.(specimen.id); }}>
            {specimen.collectionNo}
          </button>
          <strong>{specimen.species}</strong>
          {specimen.family && <span className="family">{specimen.family}</span>}
          <ZoneTag zone={specimen.zone} />
        </div>
        <div className="sp-meta">
          <span>{sourceShort(specimen.sourceId)}</span>
          <span>{specimen.locality}</span>
          {specimen.altitude !== undefined && <span>海拔 {specimen.altitude}m</span>}
          {specimen.slotNo && <span className="slot">柜位 {specimen.slotNo}</span>}
        </div>
      </div>
      <div className="sp-badges">
        <IdentifyBadge status={specimen.identifyStatus} />
        {specimen.stage === "pending" && <QuarantineBadge value={specimen.quarantine} />}
        {specimen.stage === "pending" && specimen.voucherNo === undefined && (
          <span className="badge badge-bad">缺调出凭证</span>
        )}
        <StageBadge stage={specimen.stage} />
      </div>
      {action && <div className="sp-action" onClick={(e) => e.stopPropagation()}>{action}</div>}
    </div>
  );
}
