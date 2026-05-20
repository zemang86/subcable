"use client";

import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { StatusIndicator } from "./StatusIndicator";

interface CableInformationProps {
  cable: CableSystem;
  language?: Language;
}

const TYPE_LABEL: Record<CableSystem["classification"], string> = {
  international: "INTERNATIONAL",
  iru: "INTERNATIONAL",
  domestic: "DOMESTIC",
};

function statusVariant(status: CableSystem["status"]): "active" | "inactive" {
  return status === "active" ? "active" : "inactive";
}

export default function CableInformation({
  cable,
  language = "en",
}: CableInformationProps) {
  const t = useT(language);
  const status = statusVariant(cable.status);
  const inactive = status === "inactive";
  const titleColor = inactive ? "var(--v1-inactive)" : "var(--v1-active)";

  return (
    <div
      className="v1-card-bevel"
      style={{
        position: "fixed",
        bottom: 160,
        left: 32,
        zIndex: 20,
        padding: 18,
        width: 560,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 2,
        }}
      >
        <StatusIndicator status={status} pulse={!inactive} />
        <div
          className="v1-h-heading"
          style={{ fontSize: 18, color: titleColor }}
        >
          {cable.shortName}
        </div>
        {inactive && (
          <span
            style={{
              padding: "3px 8px",
              fontFamily: "var(--v1-heading)",
              fontWeight: 700,
              fontSize: 9,
              letterSpacing: "0.20em",
              color: "var(--v1-fg)",
              background: "var(--v1-inactive-2)",
              textTransform: "uppercase",
            }}
          >
            {t("decommissioned")}
          </span>
        )}
      </div>
      <div className="v1-h-eye" style={{ marginBottom: 16 }}>
        {cable.name}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <Field label={t("length").toUpperCase()} value={cable.length} />
        <Field
          label={t("built").toUpperCase()}
          value={cable.buildYear ? String(cable.buildYear) : "—"}
        />
        <Field label={t("rfs").toUpperCase()} value={cable.rfs || "—"} />
        <Field
          label={t("type").toUpperCase()}
          value={TYPE_LABEL[cable.classification]}
        />
      </div>

      <div className="v1-h-eye" style={{ marginBottom: 6 }}>
        {t("owners").toUpperCase()}
      </div>
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        {cable.owners.map((owner) => (
          <span key={owner} className="v1-tag">
            {owner}
          </span>
        ))}
      </div>

      <div className="v1-h-eye" style={{ marginBottom: 6 }}>
        {t("description").toUpperCase()}
      </div>
      <p
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 11,
          color: "var(--v1-mute)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {cable.description}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div className="v1-h-eye" style={{ fontSize: 9 }}>
        {label}
      </div>
      <div
        style={{
          padding: "5px 9px",
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.30)",
          fontFamily: "var(--v1-mono)",
          fontSize: 11,
          color: "var(--v1-fg)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </div>
    </div>
  );
}
