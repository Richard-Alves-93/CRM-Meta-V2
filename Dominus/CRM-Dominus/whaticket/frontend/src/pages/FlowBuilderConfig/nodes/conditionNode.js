import { ImportExport } from "@mui/icons-material";
import React, { memo } from "react";
import { Handle } from "react-flow-renderer";

export default memo(({ data, isConnectable }) => {
  const typeCondition = (value) => {
    if (value === 1) return "==";
    if (value === 2) return ">=";
    if (value === 3) return "<=";
    if (value === 4) return "<";
    if (value === 5) return ">";
  };

  return (
    <div
      style={{
        background: "#ffffff",
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(99, 102, 241, 0.25)",
        boxShadow: "0 10px 28px rgba(16, 24, 40, 0.10)",
        width: 210,
        position: "relative",
        transition: "all .2s ease"
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#6366F1",
          width: 18,
          height: 18,
          left: -12,
          top: 28,
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)"
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          paddingRight: 36
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(99, 102, 241, 0.10)",
            border: "1px solid rgba(99, 102, 241, 0.25)"
          }}
        >
          <ImportExport sx={{ width: 16, height: 16, color: "#6366F1" }} />
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em"
          }}
        >
          Condição
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "rgba(15, 23, 42, 0.80)",
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}
      >
        <div
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background: "rgba(248, 250, 252, 0.9)"
          }}
        >
          {data.key}
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 999,
            width: "fit-content",
            border: "1px solid rgba(99, 102, 241, 0.25)",
            background: "rgba(99, 102, 241, 0.10)",
            fontWeight: 700,
            color: "#6366F1"
          }}
        >
          {typeCondition(data.condition)}
        </div>

        <div
          style={{
            padding: "6px 10px",
            borderRadius: 10,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background: "rgba(248, 250, 252, 0.9)"
          }}
        >
          {data.value}
        </div>
      </div>

      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          top: 18,
          background: "#6366F1",
          width: 18,
          height: 18,
          right: -12,
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)"
        }}
        isConnectable={isConnectable}
      />

      <Handle
        type="source"
        position="right"
        id="b"
        style={{
          bottom: 18,
          top: "auto",
          background: "#6366F1",
          width: 18,
          height: 18,
          right: -12,
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)"
        }}
        isConnectable={isConnectable}
      />
    </div>
  );
});
