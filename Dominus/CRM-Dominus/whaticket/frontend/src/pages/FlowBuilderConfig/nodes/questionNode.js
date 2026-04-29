import {
  ArrowForwardIos,
  ContentCopy,
  Delete
} from "@mui/icons-material";
import React, { memo } from "react";

import { Handle } from "react-flow-renderer";
import { useNodeStorage } from "../../../stores/useNodeStorage";
import { Typography } from "@mui/material";
import BallotIcon from "@mui/icons-material/Ballot";

export default memo(({ data, isConnectable, id }) => {
  const storageItems = useNodeStorage();

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: 12,
        borderRadius: 14,
        border: "1px solid rgba(15, 23, 42, 0.10)",
        boxShadow: "0 10px 28px rgba(16, 24, 40, 0.10)",
        width: 210,
        position: "relative",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji"',
      }}
    >
      <Handle
        type="target"
        position="left"
        style={{
          background: "#6366F1",
          width: 18,
          height: 18,
          top: 28,
          left: -12,
          cursor: "pointer",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)",
          border: "2px solid #ffffff"
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
            color: "rgba(239, 68, 68, 0.85)"
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
            color: "rgba(239, 68, 68, 0.85)"
          }}
        />
      </div>

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
            background: "rgba(239, 68, 68, 0.10)",
            border: "1px solid rgba(239, 68, 68, 0.20)"
          }}
        >
          <BallotIcon
            sx={{
              width: 16,
              height: 16,
              color: "rgba(239, 68, 68, 0.95)"
            }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#0f172a",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              lineHeight: "18px"
            }}
          >
            Pergunta
          </div>

          <div
            style={{
              color: "rgba(15, 23, 42, 0.62)",
              fontSize: 11,
              lineHeight: "14px"
            }}
          >
            Preview do conteúdo
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 10,
          padding: 10,
          borderRadius: 12,
          border: "1px solid rgba(15, 23, 42, 0.08)",
          background: "rgba(248, 250, 252, 0.85)"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 6
          }}
        >
          <BallotIcon sx={{ color: "rgba(239, 68, 68, 0.85)" }} />
        </div>

        <Typography
          textAlign={"center"}
          sx={{
            textOverflow: "ellipsis",
            fontSize: "11px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            color: "rgba(15, 23, 42, 0.78)"
          }}
        >
          {data?.typebotIntegration?.message}
        </Typography>
      </div>

      <Handle
        type="source"
        position="right"
        id="a"
        style={{
          background: "#6366F1",
          width: 18,
          height: 18,
          top: "86%",
          right: -12,
          cursor: "pointer",
          boxShadow: "0 10px 22px rgba(99, 102, 241, 0.22)",
          border: "2px solid #ffffff"
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
