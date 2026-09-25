import React, { useEffect, useRef, useState } from "react";

// Báo cáo hành trình đơn là trang HTML độc lập (public/bao-cao.html: đọc file bill Excel, đánh giá
// hành trình theo bảng mã trạng thái MVĐ). Nhúng cùng origin nên đo được chiều cao nội dung và
// giãn khung theo báo cáo, không có thanh cuộn lồng bên trong.
export default function HanhTrinhDonPage() {
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
      src="/bao-cao.html"
      title="Báo cáo hành trình đơn"
      style={{ display: "block", width: "100%", height, border: "none", background: "transparent", colorScheme: "light" }}
    />
  );
}
