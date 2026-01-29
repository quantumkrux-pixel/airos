import React, { useState, useMemo, useRef } from "react";

const DEFAULT_ROWS = 20;
const DEFAULT_COLS = 10;

function colIndexToName(index) {
  let name = "";
  let n = index + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    name = String.fromCharCode(65 + rem) + name;
    n = Math.floor((n - 1) / 26);
  }
  return name;
}

function parseCellRef(ref) {
  const match = /^([A-Z]+)(\d+)$/.exec(ref.toUpperCase());
  if (!match) return null;
  const [, colLetters, rowStr] = match;

  let colIndex = 0;
  for (let i = 0; i < colLetters.length; i++) {
    colIndex *= 26;
    colIndex += colLetters.charCodeAt(i) - 64;
  }
  colIndex -= 1;

  const rowIndex = parseInt(rowStr, 10) - 1;
  return { row: rowIndex, col: colIndex };
}

function evaluateFormula(expr, getCellRaw) {
  const replaced = expr.replace(/[A-Z]+[0-9]+/gi, (match) => {
    const ref = parseCellRef(match);
    if (!ref) return "0";
    const raw = getCellRaw(ref.row, ref.col) ?? "";
    const num = parseFloat(raw);
    return Number.isFinite(num) ? String(num) : "0";
  });

  try {
    const fn = new Function(`return (${replaced});`);
    const result = fn();
    return Number.isFinite(result) ? result : "#ERR";
  } catch {
    return "#ERR";
  }
}

export default function Spreadsheet({
  rows = DEFAULT_ROWS,
  cols = DEFAULT_COLS,
  initialData = {},
}) {
  const [data, setData] = useState(initialData);
  const [selected, setSelected] = useState({ row: null, col: null });
  const fileInputRef = useRef(null);

  const getCellKey = (row, col) => `${row},${col}`;
  const getCellRaw = (row, col) => data[getCellKey(row, col)] ?? "";

  const handleChange = (row, col, value) => {
    const key = getCellKey(row, col);
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const headers = useMemo(
    () => Array.from({ length: cols }, (_, i) => colIndexToName(i)),
    [cols]
  );

  // -----------------------------
  // LOCAL SAVE
  // -----------------------------
  const handleLocalSave = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "spreadsheet.json";
    a.click();

    URL.revokeObjectURL(url);
  };

  // -----------------------------
  // LOCAL OPEN
  // -----------------------------
  const handleLocalOpenClick = () => {
    fileInputRef.current?.click();
  };

  const handleLocalOpenFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target.result);
        setData(json);
      } catch {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
  };

  // -----------------------------
  // CLOUD SAVE
  // -----------------------------
  const handleCloudSave = async () => {
    try {
      const path = await window.OS.pickSaveLocation({
        suggestedName: "spreadsheet.json",
        fileTypes: ["json"],
      });

      if (!path) return;

      await window.OS.saveFile({
        path,
        content: JSON.stringify(data, null, 2),
      });
    } catch (err) {
      console.error("Cloud save failed:", err);
    }
  };

  // -----------------------------
  // CLOUD OPEN
  // -----------------------------
  const handleCloudOpen = async () => {
    try {
      const file = await window.OS.pickFile({
        fileTypes: ["json"],
      });

      if (!file) return;

      const { content } = await window.OS.openFile({ path: file.path });
      const json = JSON.parse(content);
      setData(json);
    } catch (err) {
      console.error("Cloud open failed:", err);
      alert("Invalid or unreadable cloud file");
    }
  };

  // -----------------------------
  // NEW SHEET
  // -----------------------------
  const handleNew = () => {
    setData({});
  };

  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        fontSize: 12,
        background: "#111",
        color: "#eee",
        borderRadius: 8,
        border: "1px solid #333",
        padding: 8,
        display: "inline-block",
        boxShadow: "0 0 0 1px #ff8800, 0 0 18px rgba(0,0,0,0.7)",
      }}
    >
      {/* FILE TOOLBAR */}
      <div
        style={{
          marginBottom: 8,
          display: "flex",
          gap: 8,
          color: "#ffb366",
        }}
      >
        <button onClick={handleNew} style={btnStyle}>New</button>
        <button onClick={handleLocalOpenClick} style={btnStyle}>Open</button>
        <button onClick={handleLocalSave} style={btnStyle}>Save</button>
        <button onClick={handleCloudOpen} style={btnStyle}>Cloud Open</button>
        <button onClick={handleCloudSave} style={btnStyle}>Cloud Save</button>

        <input
          type="file"
          accept=".json"
          ref={fileInputRef}
          onChange={handleLocalOpenFile}
          style={{ display: "none" }}
        />
      </div>

      {/* SELECTED CELL DISPLAY */}
      <div
        style={{
          marginBottom: 6,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#ffb366",
        }}
      >
        <span style={{ fontWeight: 600 }}>X‑CELL Spreadsheet</span>
        <span style={{ opacity: 0.7 }}>
          {selected.row != null && selected.col != null
            ? `${colIndexToName(selected.col)}${selected.row + 1}`
            : "—"}
        </span>
      </div>

      {/* TABLE */}
      <div
        style={{
          overflow: "auto",
          maxHeight: 900,
          maxWidth: 900,
          borderRadius: 4,
          border: "1px solid #333",
          background: "#181818",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            tableLayout: "fixed",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: 40,
                  background: "#202020",
                  borderRight: "1px solid #333",
                  borderBottom: "1px solid #333",
                }}
              />
              {headers.map((h, colIndex) => (
                <th
                  key={h}
                  style={{
                    padding: "4px 6px",
                    background: "#202020",
                    borderBottom: "1px solid #333",
                    borderRight:
                      colIndex === headers.length - 1
                        ? "none"
                        : "1px solid #333",
                    color: "#ffb366",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: rows }).map((_, row) => (
              <tr key={row}>
                <th
                  style={{
                    padding: "2px 4px",
                    background: "#202020",
                    borderRight: "1px solid #333",
                    borderBottom: "1px solid #333",
                    textAlign: "right",
                    color: "#888",
                    fontWeight: 400,
                    width: 40,
                  }}
                >
                  {row + 1}
                </th>

                {Array.from({ length: cols }).map((__, col) => {
                  const isSelected =
                    selected.row === row && selected.col === col;

                  return (
                    <td
                      key={col}
                      onClick={() => setSelected({ row, col })}
                      style={{
                        borderBottom: "1px solid #222",
                        borderRight:
                          col === cols - 1 ? "none" : "1px solid #222",
                        padding: 0,
                        background: isSelected ? "#262626" : "#181818",
                      }}
                    >
                      <input
                        value={getCellRaw(row, col)}
                        onChange={(e) =>
                          handleChange(row, col, e.target.value)
                        }
                        style={{
                          width: "100%",
                          boxSizing: "border-box",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          color: "#eee",
                          padding: "3px 4px",
                          fontSize: 12,
                          fontFamily: "inherit",
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btnStyle = {
  background: "#222",
  border: "1px solid #444",
  color: "#ffb366",
  padding: "4px 10px",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 12,
};