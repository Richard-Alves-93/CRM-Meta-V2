import { ContentCopy, Delete, Image, ArrowForwardIos } from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const link =
    process.env.REACT_APP_BACKEND_URL === "https://localhost:8090"
      ? "https://localhost:8090"
      : process.env.REACT_APP_BACKEND_URL;

  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        background: "#ffffff",
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(15, 23, 42, 0.10)",
        boxShadow: "0 10px 28px rgba(16, 24, 40, 0.10)",
        width: 240,
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
          sx={{ width: 16, height: 16, color: "#6b7280" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: 16, height: 16, color: "#6b7280" }}
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
            background: "rgba(99, 102, 241, 0.10)",
            border: "1px solid rgba(99, 102, 241, 0.25)"
          }}
        >
          <Image sx={{ width: 16, height: 16, color: "#6366F1" }} />
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em"
          }}
        >
          Imagem
        </div>
      </div>

      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid rgba(15, 23, 42, 0.08)"
        }}
      >
        <img
          src={`${link}/public/${data.url}`}
          alt=""
          style={{ width: "100%", display: "block" }}
        />
      </div>

      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#6366F1",
          width: 18,
          height: 18,
          right: -12,
          top: "74%",
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)"
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
