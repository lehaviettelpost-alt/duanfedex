import React, { useEffect, useRef, useState } from "react";

// Các báo cáo/dashboard là trang HTML độc lập trong public/ (bao-cao.html: hành trình đơn,
// pickup-dashboard.html: tình trạng lấy hàng). Nhúng cùng origin nên đo được chiều cao nội dung và
// giãn khung theo báo cáo, không có thanh cuộn lồng bên trong.
export default function EmbeddedReportPage({ src, title }) {
  const frameRef = useRef(null);
  const [height, setHeight] = useState(900);

  useEffect(() => {
    const frame = frameRef.current;
    let observer = null;

    function fit() {
      const doc = frame?.contentDocument;
      if (doc?.documentElement) setHeight(Math.max(600, doc.documentElement.scrollHeight));
    }
    function onLoad() {
      fit();
      const body = frame.contentDocument?.body;
      if (body && window.ResizeObserver) {
        observer = new ResizeObserver(fit);
        observer.observe(body);
      }
    }

    frame.addEventListener("load", onLoad);
    if (frame.contentDocument?.readyState === "complete" && frame.contentDocument.body?.childElementCount) onLoad();
    return () => {
      frame.removeEventListener("load", onLoad);
      observer?.disconnect();
    };
  }, []);

  return (
    <iframe
      ref={frameRef}
      src={src}
      title={title}
      style={{ display: "block", width: "100%", height, border: "none", background: "transparent", colorScheme: "light" }}
    />
  );
}
