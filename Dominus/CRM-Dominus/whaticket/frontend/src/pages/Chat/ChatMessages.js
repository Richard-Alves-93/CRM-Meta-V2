import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Box,
  FormControl,
  IconButton,
  Input,
  InputAdornment,
  makeStyles,
  Paper,
  Typography,
  Tooltip,
} from "@material-ui/core";
import SendIcon from "@material-ui/icons/Send";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import MicIcon from "@material-ui/icons/Mic";
import CloseIcon from "@material-ui/icons/Close";
import ReplyIcon from "@material-ui/icons/Reply";
import DescriptionIcon from "@material-ui/icons/Description";
import StopIcon from "@material-ui/icons/Stop";

import { AuthContext } from "../../context/Auth/AuthContext";
import { useDate } from "../../hooks/useDate";
import api from "../../services/api";
import { getBackendUrl } from "../../config";
import whatsBackground from "../../assets/wa-background.png";
import whatsBackgroundDark from "../../assets/wa-background-dark.png";

const useStyles = makeStyles((theme) => ({
  mainContainer: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    overflow: "hidden",
    borderRadius: 0,
    height: "100%",
    borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
  },
  messageList: {
    position: "relative",
    overflowY: "auto",
    height: "100%",
    ...theme.scrollbarStyles,
    backgroundImage: "none",
    backgroundColor: theme.palette.type === "dark" ? "#0f172a" : "#F8FAFC",
  },
  inputArea: {
    position: "relative",
    height: "auto",
    backgroundColor: theme.palette.type === "dark" ? "#1a1a1a" : "#fff",
    paddingTop: theme.spacing(1),
  },
  input: {
    padding: "14px 18px",
    fontSize: "0.85rem",
  },
  buttonSend: {
    margin: theme.spacing(1),
  },
  boxLeft: {
    padding: "8px 12px 6px",
    margin: "12px",
    position: "relative",
    backgroundColor: theme.palette.type === "dark" ? "#1e293b" : "#ffffff",
    color: theme.palette.type === "dark" ? "#f8fafc" : "#0f172a",
    maxWidth: "60%",
    borderRadius: 12,
    borderTopLeftRadius: 4,
    border: "none",
    boxShadow: theme.palette.type === "dark" ? "0 4px 6px -1px rgba(0,0,0,0.3)" : "0 4px 6px -1px rgba(15,23,42,0.05), 0 2px 4px -1px rgba(15,23,42,0.03)",
  },
  boxRight: {
    padding: "8px 12px 6px",
    margin: "12px 12px 12px auto",
    position: "relative",
    backgroundColor: theme.palette.type === "dark" ? "#1e3a8a" : "#dbf0fe",
    color: theme.palette.type === "dark" ? "#f8fafc" : "#0f172a",
    textAlign: "right",
    maxWidth: "60%",
    borderRadius: 12,
    borderTopRightRadius: 4,
    border: "none",
    boxShadow: theme.palette.type === "dark" ? "0 4px 6px -1px rgba(0,0,0,0.3)" : "0 4px 6px -1px rgba(15,23,42,0.05), 0 2px 4px -1px rgba(15,23,42,0.03)",
  },
  quotedContainerLeft: {
    backgroundColor: theme.palette.type === "dark" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.05)",
    borderLeft: "4px solid #10b981",
    padding: "4px 8px",
    borderRadius: "4px",
    marginBottom: "4px",
    fontSize: "0.8rem",
    textAlign: "left",
  },
  quotedContainerRight: {
    backgroundColor: theme.palette.type === "dark" ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.05)",
    borderLeft: "4px solid #10b981",
    padding: "4px 8px",
    borderRadius: "4px",
    marginBottom: "4px",
    fontSize: "0.8rem",
    textAlign: "left",
  },
  replyPanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.type === "dark" ? "#333" : "#f1f1f1",
    padding: "8px 16px",
    borderLeft: "4px solid #10b981",
    margin: "8px 16px 0px 16px",
    borderRadius: "4px",
  },
  filePanel: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: theme.palette.type === "dark" ? "#333" : "#f1f1f1",
    padding: "8px 16px",
    margin: "8px 16px 0px 16px",
    borderRadius: "4px",
  },
  actionIcon: {
    cursor: "pointer",
    fontSize: "1rem",
    opacity: 0.6,
    marginLeft: 8,
    "&:hover": {
      opacity: 1,
    },
  },
  mediaPreview: {
    width: "100%",
    maxHeight: 200,
    objectFit: "contain",
    borderRadius: 8,
    marginTop: 4,
  },
  fileLink: {
    display: "flex",
    alignItems: "center",
    color: "inherit",
    textDecoration: "none",
    padding: 8,
    backgroundColor: theme.palette.type === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
    borderRadius: 4,
    marginTop: 4,
  },
  audioPlayer: {
    height: 40,
    outline: "none",
    width: "100%",
  },
  recordingIndicator: {
    display: "flex",
    alignItems: "center",
    color: "#ef4444",
    padding: "14px 18px",
    animation: "$pulse 1.5s infinite",
  },
  "@keyframes pulse": {
    "0%": { opacity: 1 },
    "50%": { opacity: 0.5 },
    "100%": { opacity: 1 },
  },
}));

export default function ChatMessages({
  chat,
  messages,
  handleSendMessage,
  handleLoadMore,
  scrollToBottomRef,
  pageInfo,
  loading,
}) {
  const classes = useStyles();
  const { user } = useContext(AuthContext);
  const { datetimeToClient } = useDate();
  const baseRef = useRef();

  const [contentMessage, setContentMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [quotedMessage, setQuotedMessage] = useState(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (baseRef.current) {
      baseRef.current.scrollIntoView({});
    }
  };

  const unreadMessages = (chat) => {
    if (chat !== undefined) {
      const currentUser = chat.users.find((u) => u.userId === user.id);
      return currentUser.unreads > 0;
    }
    return 0;
  };

  useEffect(() => {
    if (unreadMessages(chat) > 0) {
      try {
        api.post(`/chats/${chat.id}/read`, { userId: user.id });
      } catch (err) {}
    }
    scrollToBottomRef.current = scrollToBottom;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (!pageInfo.hasMore || loading) return;
    if (scrollTop < 600) {
      handleLoadMore();
    }
  };

  const clearState = () => {
    setContentMessage("");
    setSelectedFile(null);
    setQuotedMessage(null);
  };

  const handleSend = () => {
    if (contentMessage.trim() === "" && !selectedFile) return;
    handleSendMessage(contentMessage, selectedFile, quotedMessage?.id);
    clearState();
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const file = new File([audioBlob], `Audio-${new Date().getTime()}.webm`, { type: "audio/webm" });
        handleSendMessage("", file, quotedMessage?.id);
        clearState();
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.log("Error accessing microphone", err);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
    }
  };

  const renderMedia = (item) => {
    if (!item.mediaPath) return null;
    const url = `${getBackendUrl()}/public/company${chat.companyId}/${item.mediaPath}`;
    const isImage = item.mediaType?.startsWith("image/");
    const isAudio = item.mediaType?.startsWith("audio/");

    if (isImage) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <img src={url} alt={item.mediaName} className={classes.mediaPreview} />
        </a>
      );
    }
    if (isAudio) {
      return <audio src={url} controls className={classes.audioPlayer} />;
    }
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={classes.fileLink}>
        <DescriptionIcon style={{ marginRight: 8 }} />
        <Typography variant="body2" style={{ wordBreak: "break-all" }}>
          {item.mediaName}
        </Typography>
      </a>
    );
  };

  const renderQuotedMessage = (quotedMsg, isRight) => {
    if (!quotedMsg) return null;
    return (
      <div className={isRight ? classes.quotedContainerRight : classes.quotedContainerLeft}>
        <Typography variant="caption" style={{ fontWeight: "bold", display: "block" }}>
          {quotedMsg.sender?.name}
        </Typography>
        <Typography variant="caption" style={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {quotedMsg.message || (quotedMsg.mediaPath ? `📄 ${quotedMsg.mediaName || "Arquivo"}` : "")}
        </Typography>
      </div>
    );
  };

  return (
    <Paper className={classes.mainContainer}>
      <div onScroll={handleScroll} className={classes.messageList}>
        {Array.isArray(messages) &&
          messages.map((item, key) => {
            const isRight = item.senderId === user.id;
            const msgClass = isRight ? classes.boxRight : classes.boxLeft;
            
            return (
              <Box key={key} className={msgClass}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2" style={{ fontWeight: 600 }}>
                    {item.sender.name}
                  </Typography>
                  <Tooltip title="Responder">
                    <ReplyIcon 
                      className={classes.actionIcon} 
                      onClick={() => setQuotedMessage(item)} 
                    />
                  </Tooltip>
                </div>
                
                {renderQuotedMessage(item.quotedMsg, isRight)}
                
                {renderMedia(item)}
                
                {item.message && (
                  <Typography variant="body2" style={{ marginTop: 4, whiteSpace: "pre-wrap", textAlign: "left" }}>
                    {item.message}
                  </Typography>
                )}
                
                <Typography variant="caption" display="block" style={{ marginTop: 4, opacity: 0.7 }}>
                  {datetimeToClient(item.createdAt)}
                </Typography>
              </Box>
            );
          })}
        <div ref={baseRef}></div>
      </div>
      
      <div className={classes.inputArea}>
        {quotedMessage && (
          <div className={classes.replyPanel}>
            <div>
              <Typography variant="caption" style={{ fontWeight: "bold" }}>
                Respondendo a {quotedMessage.sender?.name}:
              </Typography>
              <Typography variant="caption" display="block" style={{
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300
              }}>
                {quotedMessage.message || "📎 Arquivo/Mídia"}
              </Typography>
            </div>
            <IconButton size="small" onClick={() => setQuotedMessage(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        )}

        {selectedFile && (
          <div className={classes.filePanel}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <AttachFileIcon fontSize="small" style={{ marginRight: 8 }} />
              <Typography variant="caption">{selectedFile.name}</Typography>
            </div>
            <IconButton size="small" onClick={() => setSelectedFile(null)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
        )}

        <FormControl variant="outlined" fullWidth>
          <Input
            inputRef={inputRef}
            multiline
            minRows={1}
            maxRows={4}
            value={contentMessage}
            placeholder={recording ? "" : "Digite sua mensagem..."}
            disabled={recording}
            onKeyUp={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onChange={(e) => setContentMessage(e.target.value)}
            className={classes.input}
            startAdornment={
              <InputAdornment position="start" style={{ marginLeft: 8 }}>
                {recording ? (
                  <div className={classes.recordingIndicator}>
                    <MicIcon style={{ marginRight: 4 }} /> 
                    <Typography variant="caption">Gravando áudio...</Typography>
                  </div>
                ) : (
                  <>
                    <input
                      type="file"
                      id="file-upload-chat"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <label htmlFor="file-upload-chat" style={{ margin: 0 }}>
                      <IconButton component="span" size="small">
                        <AttachFileIcon />
                      </IconButton>
                    </label>
                  </>
                )}
              </InputAdornment>
            }
            endAdornment={
              <InputAdornment position="end">
                {contentMessage.trim() === "" && !selectedFile && !recording ? (
                  <IconButton size="small" onClick={handleStartRecording}>
                    <MicIcon />
                  </IconButton>
                ) : recording ? (
                  <IconButton size="small" onClick={handleStopRecording} style={{ color: "#ef4444" }}>
                    <StopIcon />
                  </IconButton>
                ) : (
                  <IconButton onClick={handleSend} size="small" className={classes.buttonSend} color="primary">
                    <SendIcon />
                  </IconButton>
                )}
              </InputAdornment>
            }
          />
        </FormControl>
      </div>
    </Paper>
  );
}
