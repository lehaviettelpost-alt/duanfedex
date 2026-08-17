import React from "react";

// Ảnh logo chính hãng do người dùng cung cấp (public/fedex-logo.png, public/viettelpost-logo.png).
export function FedExMark({ height = 20 }) {
  return <img src="/fedex-logo.png" alt="FedEx" style={{ display: "block", height, width: "auto" }} />;
}

export function ViettelPostMark({ height = 20 }) {
  return <img src="/viettelpost-logo.png" alt="Viettel Post" style={{ display: "block", height, width: "auto" }} />;
}

export function BrandBadges({ fedexHeight = 18, viettelHeight = 16 }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #E4D1DE", borderRadius: 8, padding: "6px 12px" }}>
        <FedExMark height={fedexHeight} />
      </div>
      <div style={{ display: "flex", alignItems: "center", background: "#fff", border: "1px solid #E4D1DE", borderRadius: 8, padding: "6px 12px" }}>
        <ViettelPostMark height={viettelHeight} />
      </div>
    </>
  );
}
