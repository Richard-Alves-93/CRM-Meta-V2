import {
  ArrowForwardIos,
  ContentCopy,
  Delete,
  DynamicFeed
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: 12,
        borderRadius: 14,
        maxWidth: 220,
        width: 210,
        position: "relative",
        border: "1px solid rgba(15, 23, 42, 0.10)",
        boxShadow: "0 10px 28px rgba(16, 24, 40, 0.10)",
        transition: "all .2s ease",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"'
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#6366f1",
          width: 18,
          height: 18,
          top: 28,
          left: -12,
          cursor: "pointer",
          border: "2px solid #ffffff",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)"
        }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      >
        <ArrowForwardIos
          sx={{
            color: "#fff",
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
          gap: 8,
          alignItems: "center"
        }}
      >
        <ContentCopy
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("duplicate");
          }}
          sx={{
            width: 16,
            height: 16,
            color: "rgba(107, 114, 128, 0.95)"
          }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{
            width: 16,
            height: 16,
            color: "rgba(107, 114, 128, 0.95)"
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          paddingRight: 42
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
            border: "1px solid rgba(99, 102, 241, 0.22)"
          }}
        >
          <DynamicFeed sx={{ width: 16, height: 16, color: "#6366f1" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.01em",
              lineHeight: "18px"
            }}
          >
            Menu
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgba(15, 23, 42, 0.62)",
              lineHeight: "14px"
            }}
          >
            Opções de escolha
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ marginTop: 10 }}>
        <div
          style={{
            color: "rgba(15, 23, 42, 0.78)",
            fontSize: 12,
            lineHeight: "16px",
            padding: 10,
            borderRadius: 12,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            background: "rgba(248, 250, 252, 0.90)",
            height: 62,
            overflow: "hidden"
          }}
        >
          {data.message}
        </div>
      </div>

      {/* Options */}
      <div style={{ marginTop: 10 }}>
        {data.arrayOption.map((option) => (
          <div
            key={option.number}
            style={{
              marginBottom: 10,
              display: "flex",
              position: "relative",
              paddingRight: 18
            }}
          >
            <div
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(15, 23, 42, 0.08)",
                background: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8
              }}
            >
              <div
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontSize: 11,
                  color: "rgba(15, 23, 42, 0.76)"
                }}
              >
                {`[${option.number}] ${option.value}`}
              </div>

              <div
                style={{
                  fontSize: 10,
                  padding: "2px 8px",
                  borderRadius: 999,
                  border: "1px solid rgba(99, 102, 241, 0.18)",
                  background: "rgba(99, 102, 241, 0.08)",
                  color: "rgba(99, 102, 241, 0.95)",
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {option.number}
              </div>
            </div>

            {/* Handle alinhado com a opção (visual apenas) */}
            <Handle
              type="source"
              position="right"
              id={"a" + option.number}
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                background: "#6366f1",
                width: 18,
                height: 18,
                right: -12,
                cursor: "pointer",
                border: "2px solid #ffffff",
                boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)"
              }}
              isConnectable={isConnectable}
            >
              <ArrowForwardIos
                sx={{
                  color: "#fff",
                  width: 10,
                  height: 10,
                  marginLeft: "3px",
                  marginBottom: "1px",
                  pointerEvents: "none"
                }}
              />
            </Handle>
          </div>
        ))}
      </div>
    </div>
  );
});
