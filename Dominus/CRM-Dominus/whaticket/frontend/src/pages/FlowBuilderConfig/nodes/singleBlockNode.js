import {
  AccessTime,
  ArrowForwardIos,
  ContentCopy,
  Delete,
  Image,
  LibraryBooks,
  Message,
  MicNone,
  Videocam
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        background: "#ffffff",
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(239, 68, 68, 0.25)",
        boxShadow: "0 10px 28px rgba(16, 24, 40, 0.10)",
        width: 220,
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
          top: 26,
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
          sx={{ width: 16, height: 16, color: "#ef4444" }}
        />

        <Delete
          onClick={() => {
            storageItems.setNodesStorage(id);
            storageItems.setAct("delete");
          }}
          sx={{ width: 16, height: 16, color: "#ef4444" }}
        />
      </div>

      {/* Header */}
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
            background: "rgba(239, 68, 68, 0.10)",
            border: "1px solid rgba(239, 68, 68, 0.30)"
          }}
        >
          <LibraryBooks sx={{ width: 16, height: 16, color: "#ef4444" }} />
        </div>

        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "-0.01em"
          }}
        >
          Conteúdo
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {data.seq.map((item) => {
          const element = data.elements.filter(
            (itemLoc) => itemLoc.number === item
          )[0];

          return (
            <div
              key={item}
              style={{
                borderRadius: 12,
                border: "1px solid rgba(15, 23, 42, 0.08)",
                background: "rgba(248, 250, 252, 0.9)",
                padding: 6
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 4
                }}
              >
                {item.includes("message") && (
                  <Message sx={{ color: "#ef4444" }} />
                )}
                {item.includes("interval") && (
                  <AccessTime sx={{ color: "#ef4444" }} />
                )}
                {item.includes("img") && <Image sx={{ color: "#ef4444" }} />}
                {item.includes("audio") && (
                  <MicNone sx={{ color: "#ef4444" }} />
                )}
                {item.includes("video") && (
                  <Videocam sx={{ color: "#ef4444" }} />
                )}
              </div>

              <Typography
                textAlign="center"
                sx={{
                  textOverflow: "ellipsis",
                  fontSize: "10px",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  color: "rgba(15, 23, 42, 0.78)"
                }}
              >
                {element?.value || element?.original}
              </Typography>

              {item.includes("interval") && (
                <Typography
                  textAlign="center"
                  sx={{
                    fontSize: "10px",
                    color: "rgba(15, 23, 42, 0.65)"
                  }}
                >
                  segundos
                </Typography>
              )}
            </div>
          );
        })}
      </div>

      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#6366F1",
          width: 18,
          height: 18,
          top: "78%",
          right: -12,
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
