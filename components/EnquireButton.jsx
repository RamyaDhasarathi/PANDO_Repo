"use client";

import { useState } from "react";

export default function EnquireButton({ className }) {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "12px",
          borderRadius: "var(--hp-radius-md)",
          background: "var(--hp-mint-50)",
          color: "var(--hp-primary-dark)",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        ✓ Your enquiry has been sent. An agent will reach out shortly.
      </div>
    );
  }

  return (
    <button type="button" className={className} onClick={() => setSent(true)}>
      Contact Agent / Enquire
    </button>
  );
}
