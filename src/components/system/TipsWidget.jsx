import React, { useState, useEffect } from "react";

export const TipsWidget = ({ onDisable }) => {
  const tips = [
    "Right‑click anywhere to open the universal context menu.",
    "Press Ctrl+Space to open the global search palette.",
    "Drag windows by their title bar to rearrange your workspace.",
    "Use the App Menu to quickly launch installed apps.",
    "Pin your favorite apps to the taskbar for fast access."
  ];

  const [index, setIndex] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const nextTip = () => {
    setIndex((prev) => (prev + 1) % tips.length);
  };

  const close = () => {
    if (dontShow) onDisable();
  };

  // Escape key closes widget
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dontShow]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>Tips & Tricks</div>

      <div style={styles.body}>{tips[index]}</div>

      <div style={styles.footer}>
        <button style={styles.button} onClick={nextTip}>Next</button>
        <button style={styles.button} onClick={close}>Close</button>
      </div>

      <label style={styles.checkboxRow}>
        <input
          type="checkbox"
          checked={dontShow}
          onChange={() => setDontShow(!dontShow)}
        />
        Don’t show again
      </label>
    </div>
  );
};

const styles = {
  container: {
    position: "top-right",
    bottom: "100px",
    right: "20px",
    width: "260px",
    padding: "16px",
    background: "rgba(40,40,40,0.75)",
    backdropFilter: "blur(14px) saturate(180%)",
    WebkitBackdropFilter: "blur(14px) saturate(180%)",
    borderRadius: "12px",
    color: "white",
    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
    zIndex: 999999,
    animation: "fadeIn 0.2s ease-out"
  },
  header: {
    fontSize: "16px",
    fontWeight: "bold",
    marginBottom: "8px"
  },
  body: {
    fontSize: "14px",
    marginBottom: "12px"
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px"
  },
  button: {
    padding: "6px 10px",
    background: "rgba(255,255,255,0.15)",
    border: "none",
    borderRadius: "6px",
    color: "white",
    cursor: "pointer"
  },
  checkboxRow: {
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  }
};