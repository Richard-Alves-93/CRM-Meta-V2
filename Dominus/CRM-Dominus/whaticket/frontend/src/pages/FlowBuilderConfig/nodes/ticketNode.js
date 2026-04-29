import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  ConfirmationNumber
} from "@mui/icons-material";
import React, { memo } from "react";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Handle } from "react-flow-renderer";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        background: "#ffffff",
        padding: 12,
        borderRadius: 14,
        position: "relative",
        border: "1px solid rgba(37, 99, 235, 0.25)",
        boxShadow: "0 10px 28px rgba(16, 24, 40, 0.10)",
        width: 220,
        transition: "all .2s ease"
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#2563eb",
          width: 18,
          height: 18,
          top: 28,
          left: -12,
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(37, 99, 235, 0.25)"
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffffff",
            width: 10,
            height: 10,
            marginLeft: "3px",
            marginBottom: "1px",
            pointerEvents: "none"
          }}
        />
      </Handle>

      <div
        style={{
          display: "flex",
          position: "absolute",
          right: 8,
          top: 8,
          cursor: "pointer",
          gap: 8
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{ width: 16, height: 16, color: "#2563eb" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: 16, height: 16, color: "#2563eb" }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
          paddingRight: 44
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
            background: "rgba(37, 99, 235, 0.12)",
            border: "1px solid rgba(37, 99, 235, 0.35)"
          }}
        >
          <ConfirmationNumber
            sx={{ width: 16, height: 16, color: "#2563eb" }}
          />
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em"
          }}
        >
          Ticket
        </div>
      </div>

      <div
        style={{
          fontSize: 12,
          color: "rgba(15, 23, 42, 0.75)",
          padding: "8px 10px",
          borderRadius: 12,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "rgba(248, 250, 252, 0.9)",
          textAlign: "center",
          fontWeight: 600
        }}
      >
        {Object.keys(data)[0] === "data" ? data.data.name : data.name}
      </div>

      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#2563eb",
          width: 18,
          height: 18,
          top: "74%",
          right: -12,
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(37, 99, 235, 0.25)"
        }}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#ffffff",
            width: 10,
            height: 10,
            marginLeft: "3px",
            marginBottom: "1px",
            pointerEvents: "none"
          }}
        />
      </Handle>
    </div>
  );
});
