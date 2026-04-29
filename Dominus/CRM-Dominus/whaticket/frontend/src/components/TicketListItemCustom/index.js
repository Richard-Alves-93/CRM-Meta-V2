import React, { useState, useEffect, useRef, useContext, useCallback } from "react";

import { useHistory, useParams } from "react-router-dom";
import { parseISO, format, isSameDay } from "date-fns";
import clsx from "clsx";

import { makeStyles } from "@material-ui/core/styles";
import { grey } from "@material-ui/core/colors";
import { i18n } from "../../translate/i18n";

import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import MarkdownWrapper from "../MarkdownWrapper";
import { Tooltip } from "@material-ui/core";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import toastError from "../../errors/toastError";
import { v4 as uuidv4 } from "uuid";

import GroupIcon from '@material-ui/icons/Group';
import ContactTag from "../ContactTag";
import ConnectionIcon from "../ConnectionIcon";
import AcceptTicketWithouSelectQueue from "../AcceptTicketWithoutQueueModal";
import TransferTicketModalCustom from "../TransferTicketModalCustom";
import ShowTicketOpen from "../ShowTicketOpenModal";
import { isNil } from "lodash";
import { toast } from "react-toastify";
import { Done, HighlightOff, Replay, SwapHoriz } from "@material-ui/icons";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import facebookIcon from "../../assets/facebook.png";
import instagramIcon from "../../assets/instagram.png";
import whatsappIcon from "../../assets/whatsapp.png";
import { 
    Avatar, 
    ListItemAvatar, 
    ListItem, 
    ListItemSecondaryAction, 
    ListItemText, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    IconButton, 
    Paper, 
    Divider,
    Badge
} from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import CloseIcon from "@material-ui/icons/Close";
import MessageIcon from "@material-ui/icons/Message";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import { Menu, MenuItem } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    ticket: {
        display: "flex",
        alignItems: "center",
        padding: "12px",
        gap: "12px",
        borderBottom: "1px solid #F3F4F6",
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        transition: "all .2s ease",
        borderLeft: "2px solid transparent",
        "&.Mui-selected": {
            backgroundColor: "#F3F4F6",
            borderLeft: "2px solid #4F46E5",
        },
        "&:hover": {
            backgroundColor: "#F9FAFB",
        },
    },

  unreadTicket: {
    "&:before": {
      background:
        theme.mode === "light"
          ? "linear-gradient(180deg, #86efac 0%, #4ade80 100%)"
          : "linear-gradient(180deg, #166534 0%, #14532d 100%)",
      boxShadow: "none",
    },
  },

    readTicket: {
        "&:before": {
            backgroundColor: theme.mode === "light" ? "#cbd5e1" : "rgba(148,163,184,0.55)",
        },
    },

    pendingTicket: {
        cursor: "unset",
    },

    avatarWrap: {
        marginLeft: 2,
        marginRight: 8,
    },

    ticketAvatar: {
        width: 48,
        height: 48,
    },

    contentRoot: {
        flex: 1,
        minWidth: 0,
    },

    primaryRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 8,
    },

    nameLine: {
        display: "flex",
        alignItems: "center",
        minWidth: 0,
        gap: 6,
    },

    contactName: {
        color: theme.mode === "light" ? "#0f172a" : "#f8fafc",
        fontWeight: 700,
        fontSize: "0.83rem",
        letterSpacing: "0.01em",
    },

    rightTop: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 4,
        marginLeft: "auto",
        flexShrink: 0,
        minWidth: 75,
    },

  unreadCounter: {
    minWidth: 18,
    height: 18,
    borderRadius: 10,
    padding: "0 5px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "0.62rem",
    fontWeight: "bold",
    color: theme.mode === "light" ? "#991B1B" : "#FECACA",
    background: theme.mode === "light" ? "#FEE2E2" : "#7F1D1D",
    boxShadow: "none",
  },

    viewIcon: {
        color: "#94a3b8",
        cursor: "pointer",
        fontSize: "1rem",
        padding: 0,
        marginLeft: 4,
        "&:hover": {
            color: theme.palette.primary.main,
        }
    },

    lastMessageTime: {
        color: "#64748b",
        fontSize: "0.7rem",
        fontWeight: 500,
        marginLeft: "auto",
        flexShrink: 0,
    },

    lastMessageTimeUnread: {
        color: "#2563eb",
        fontSize: "0.68rem",
        fontWeight: "bold",
    },

    unreadCounter: {
        backgroundColor: "#2563eb",
        color: "#ffffff",
        borderRadius: 999,
        padding: "2px 8px",
        fontSize: "0.68rem",
        fontWeight: 700,
        marginLeft: 8,
        minWidth: 18,
        height: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 4px rgba(37, 99, 235, 0.2)",
    },

    secondaryContent: {
        marginTop: 2,
    },

    messagePreview: {
        color: "#6B7280",
        fontSize: "13px",
        lineHeight: 1.35,
        fontWeight: 500,
        display: "block",
        width: "100%",
        paddingRight: "85px",
        boxSizing: "border-box",
    },

    messagePreviewUnread: {
        color: "#0f172a",
        fontWeight: 700,
    },

    metaRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
        overflow: "hidden",
        flexWrap: "nowrap",
    },

    metaPill: {
        fontSize: "10px",
        padding: "1px 5px",
        borderRadius: "4px",
        display: "inline-flex",
        gap: "3px",
        fontWeight: 500,
        whiteSpace: "nowrap",
        alignItems: "center",
        opacity: 0.85,
    },
    statusBadge: {
        borderRadius: 12,
        padding: "2px 10px",
        fontSize: "0.68rem",
        fontWeight: 700,
        textTransform: "capitalize",
    },
    badgeWaiting: {
        backgroundColor: "#FEF3C7",
        color: "#92400E",
    },
    badgeOverdue: {
        backgroundColor: "#FCE7F3",
        color: "#9D174D",
    },

    tagsRow: {
        display: "flex",
        flexWrap: "nowrap",
        gap: 4,
        marginLeft: 4,
    },
    bottomColorBars: {
        display: "flex",
        height: 3,
        width: "100%",
        gap: 0,
        position: "absolute",
        bottom: 0,
        left: 0,
    },
    colorBar: {
        flex: 1,
        height: "100%",
    },

    actionsColumn: {
        display: "flex",
        alignItems: "center",
        paddingLeft: 4,
    },

    actionButtonsRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 3,
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
    },

    actionButton: {
        minWidth: 28,
        width: 28,
        height: 28,
        borderRadius: "50%",
        boxShadow: theme.mode === "light" ? "0 4px 10px rgba(15,23,42,0.12)" : "0 4px 10px rgba(0,0,0,0.4)",
        border: `1px solid ${theme.mode === "light" ? "rgba(148,163,184,0.24)" : "rgba(148,163,184,0.35)"}`,
        padding: 0,
        transition: "all .18s ease",
        "&:hover": {
            transform: "translateY(-1px)",
        },
    },
    actionButtonAccept: {
        background: theme.mode === "light"
            ? "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
            : "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
        color: "#ffffff",
    },
    actionButtonTransfer: {
        background: theme.mode === "light"
            ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
            : "linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)",
        color: "#ffffff",
    },
    actionButtonDanger: {
        background: theme.mode === "light"
            ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
            : "linear-gradient(135deg, #fb923c 0%, #ea580c 100%)",
        color: "#ffffff",
    },
    actionButtonNeutral: {
        background: theme.mode === "light"
            ? "linear-gradient(135deg, #64748b 0%, #475569 100%)"
            : "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)",
        color: "#ffffff",
    },

    connectionIcon: {
        marginRight: 1,
    },
    dialogTitle: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: theme.palette.primary.main,
        color: "white",
        paddingBottom: theme.spacing(1),
    },
    closeButton: {
        color: "white",
    },
    messagesContainer: {
        height: "60vh", // Use viewport height instead of fixed pixels
        maxHeight: "600px", // Set a maximum height
        overflowY: "auto",
        padding: theme.spacing(2),
        scrollBehavior: "smooth", // Add smooth scrolling
    },
    scrollToBottomBtn: {
        position: "absolute",
        bottom: theme.spacing(2),
        right: theme.spacing(2),
        zIndex: 1000,
        backgroundColor: theme.palette.primary.main,
        color: "white",
        "&:hover": {
            backgroundColor: theme.palette.primary.dark,
        },
    },
    messageItem: {
        padding: theme.spacing(1),
        margin: theme.spacing(1, 0),
        borderRadius: theme.spacing(1),
        maxWidth: "80%",
        position: "relative",
    },
    fromMe: {
        backgroundColor: "#dcf8c6",
        marginLeft: "auto",
    },
    fromThem: {
        backgroundColor: "#f5f5f5",
    },
    messageTime: {
        fontSize: "0.75rem",
        color: grey[500],
        position: "absolute",
        bottom: "2px",
        right: "8px",
    },
    messageText: {
        marginBottom: theme.spacing(2),
        wordBreak: "break-word",
    },
    emptyMessages: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        color: grey[500],
    },
    messagesHeader: {
        display: "flex",
        alignItems: "center",
        padding: theme.spacing(1, 2),
        backgroundColor: theme.palette.grey[100],
    },
    messageAvatar: {
        marginRight: theme.spacing(1),
    },
    messageIcon: {
        marginRight: theme.spacing(1),
        color: theme.palette.primary.main,
    },
    loadingMessages: {
        display: "flex",
        justifyContent: "center",
        padding: theme.spacing(3),
    },
    smallAvatar: {
        width: 18,
        height: 18,
        border: `2px solid ${theme.palette.background.paper}`,
        backgroundColor: "white",
    }
}));

const getAvatarChannel = (channel) => {
    if (channel === "facebook") return facebookIcon;
    if (channel === "instagram") return instagramIcon;
    if (channel === "whatsapp" || channel === "whatsappapi") return whatsappIcon;
    return null;
};

const TicketListItemCustom = ({ setTabOpen, ticket }) => {
    const classes = useStyles();
    const history = useHistory();
    const [loading, setLoading] = useState(false);
    const [acceptTicketWithouSelectQueueOpen, setAcceptTicketWithouSelectQueueOpen] = useState(false);
    const [transferTicketModalOpen, setTransferTicketModalOpen] = useState(false);

    const [openAlert, setOpenAlert] = useState(false);
    const [userTicketOpen, setUserTicketOpen] = useState("");
    const [queueTicketOpen, setQueueTicketOpen] = useState("");
    const [openTicketMessageDialog, setOpenTicketMessageDialog] = useState(false);
    
    // New states for the ticket messages
    const [ticketMessages, setTicketMessages] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [avatarUrl, setAvatarUrl] = useState("");

    const handleOpenMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
    };

    const { ticketId } = useParams();
    const isMounted = useRef(true);
    const { setCurrentTicket } = useContext(TicketsContext);
    const { user } = useContext(AuthContext);

    const { get: getSetting } = useCompanySettings();

    useEffect(() => {
        if (ticket.contact.urlPicture) {
            const fetchImage = async () => {
                try {
                    const { data, headers } = await api.get(ticket.contact.urlPicture, {
                        responseType: "blob",
                    });
                    const url = window.URL.createObjectURL(
                        new Blob([data], { type: headers["content-type"] })
                    );
                    setAvatarUrl(url);
                } catch (err) {
                    setAvatarUrl(ticket.contact.urlPicture);
                }
            };
            fetchImage();
        }

        return () => {
            isMounted.current = false;
            if (avatarUrl && avatarUrl.startsWith("blob:")) {
                window.URL.revokeObjectURL(avatarUrl);
            }
        };
    }, [ticket.contact.urlPicture]);

    const handleOpenAcceptTicketWithouSelectQueue = useCallback(() => {
        setAcceptTicketWithouSelectQueueOpen(true);
    }, []);

    const handleCloseTicket = async (id) => {
        const setting = await getSetting(
            {
                "column": "requiredTag"
            }
        );

        if (setting.requiredTag === "enabled") {
            //verificar se tem uma tag   
            try {
                const contactTags = await api.get(`/contactTags/${ticket.contact.id}`);
                if (!contactTags.data.tags) {
                    toast.warning(i18n.t("messagesList.header.buttons.requiredTag"))
                } else {
                    await api.put(`/tickets/${id}`, {
                        status: "closed",
                        userId: user?.id || null,
                    });

                    if (isMounted.current) {
                        setLoading(false);
                    }

                    history.push(`/tickets/`);
                }
            } catch (err) {
                setLoading(false);
                toastError(err);
            }
        } else {
            setLoading(true);
            try {
                await api.put(`/tickets/${id}`, {
                    status: "closed",
                    userId: user?.id || null,
                });

            } catch (err) {
                setLoading(false);
                toastError(err);
            }
            if (isMounted.current) {
                setLoading(false);
            }

            history.push(`/tickets/`);
        }
    };

    const handleCloseIgnoreTicket = async (id) => {
        setLoading(true);
        try {
            await api.put(`/tickets/${id}`, {
                status: "closed",
                userId: user?.id || null,
                sendFarewellMessage: false,
                amountUsedBotQueues: 0
            });

        } catch (err) {
            setLoading(false);
            toastError(err);
        }
        if (isMounted.current) {
            setLoading(false);
        }

        history.push(`/tickets/`);
    };

    const truncate = (str, len) => {
        if (!isNil(str)) {
            if (str.length > len) {
                return str.substring(0, len) + "...";
            }
            return str;
        }
    };

    const handleCloseTransferTicketModal = useCallback(() => {
        if (isMounted.current) {
            setTransferTicketModalOpen(false);
        }
    }, []);

    const handleOpenTransferModal = () => {
        setLoading(true)
        setTransferTicketModalOpen(true);
        if (isMounted.current) {
            setLoading(false);
        }
        handleSelectTicket(ticket);
        history.push(`/tickets/${ticket.uuid}`);
    }

    const handleAcepptTicket = async (id) => {
        setLoading(true);
        try {
            const otherTicket = await api.put(`/tickets/${id}`, ({
                status: ticket.isGroup && ticket.channel === 'whatsapp' ? "group" : "open",
                userId: user?.id,
            }));

            if (otherTicket.data.id !== ticket.id) {
                if (otherTicket.data.userId !== user?.id) {
                    setOpenAlert(true);
                    setUserTicketOpen(otherTicket.data.user.name);
                    setQueueTicketOpen(otherTicket.data.queue.name);
                } else {
                    setLoading(false);
                    setTabOpen(ticket.isGroup ? "group" : "open");
                    handleSelectTicket(otherTicket.data);
                    history.push(`/tickets/${otherTicket.uuid}`);
                }
            } else {
                let setting;

                try {
                    setting = await getSetting({
                        "column": "sendGreetingAccepted"
                    });
                } catch (err) {
                    toastError(err);
                }

                if (setting.sendGreetingAccepted === "enabled" && (!ticket.isGroup || ticket.whatsapp?.groupAsTicket === "enabled")) {
                    handleSendMessage(ticket.id);
                }
                if (isMounted.current) {
                    setLoading(false);
                }

                setTabOpen(ticket.isGroup ? "group" : "open");
                handleSelectTicket(ticket);
                history.push(`/tickets/${ticket.uuid}`);
            }
        } catch (err) {
            setLoading(false);
            toastError(err);
        }
    };

    const handleSendMessage = async (id) => {
        let setting;

        try {
            setting = await getSetting({
                "column": "greetingAcceptedMessage"
            })
        } catch (err) {
            toastError(err);
        }

        const msg = `${setting.greetingAcceptedMessage}`;
        const message = {
            read: 1,
            fromMe: true,
            mediaUrl: "",
            body: `${msg.trim()}`,
        };
        try {
            await api.post(`/messages/${id}`, message);
        } catch (err) {
            toastError(err);
        }
    };

    const handleCloseAlert = useCallback(() => {
        setOpenAlert(false);
        setLoading(false);
    }, []);

    const handleSelectTicket = (ticket) => {
        const code = uuidv4();
        const { id, uuid } = ticket;
        setCurrentTicket({ id, uuid, code });
    };

    // Function to fetch messages for the ticket
    const fetchTicketMessages = async (ticketId) => {
        if (!ticketId) return;
        
        setLoadingMessages(true);
        try {
            const { data } = await api.get(`/messages/${ticketId}`);
            if (isMounted.current) {
                setTicketMessages(data.messages);
            }
        } catch (err) {
            toastError(err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Handle opening the message dialog
    const handleOpenMessageDialog = (e) => {
        e.stopPropagation();
        setOpenTicketMessageDialog(true);
        fetchTicketMessages(ticket.id);
    };

    const formattedUpdateLabel = ticket.lastMessage
        ? (isSameDay(parseISO(ticket.updatedAt), new Date())
            ? format(parseISO(ticket.updatedAt), "HH:mm")
            : format(parseISO(ticket.updatedAt), "dd/MM/yyyy"))
        : "";

    const renderLastMessageLabel = () => {
        if (!ticket.lastMessage) return "Sem mensagens";
        if (ticket.lastMessage.includes("fb.me")) return "Clique de anúncio";
        if (ticket.lastMessage.includes("data:image/png;base64")) return "Localização";
        if (ticket.lastMessage.includes("BEGIN:VCARD")) return "Contato";
        return truncate(ticket.lastMessage, 56);
    };

    return (
        <React.Fragment key={ticket.id}>
            {openAlert && (
                <ShowTicketOpen
                    isOpen={openAlert}
                    handleClose={handleCloseAlert}
                    user={userTicketOpen}
                    queue={queueTicketOpen}
                />
            )}
            {acceptTicketWithouSelectQueueOpen && (
                <AcceptTicketWithouSelectQueue
                    modalOpen={acceptTicketWithouSelectQueueOpen}
                    onClose={(e) => setAcceptTicketWithouSelectQueueOpen(false)}
                    ticketId={ticket.id}
                    ticket={ticket}
                />
            )}
            {transferTicketModalOpen && (
                <TransferTicketModalCustom
                    modalOpen={transferTicketModalOpen}
                    onClose={handleCloseTransferTicketModal}
                    ticketid={ticket.id}
                    ticket={ticket}
                />
            )}
            
            {/* Improved Message Dialog */}
            <Dialog 
                open={openTicketMessageDialog} 
                onClose={() => setOpenTicketMessageDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle disableTypography className={classes.dialogTitle}>
                    <Typography variant="h6">
                        Espiando a conversa
                    </Typography>
                    <IconButton 
                        aria-label="close" 
                        className={classes.closeButton} 
                        onClick={() => setOpenTicketMessageDialog(false)}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                
                <div className={classes.messagesHeader}>
                    <Avatar 
                        src={ticket?.contact?.urlPicture}
                        className={classes.messageAvatar}
                    />
                    <div>
                        <Typography variant="subtitle1">
                            {ticket.contact?.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {ticket.whatsapp?.name || ticket.channel}
                        </Typography>
                    </div>
                </div>
                
                <Divider />
                
                <DialogContent className={classes.messagesContainer}>
                    {loadingMessages ? (
                        <div className={classes.loadingMessages}>
                            <Typography>Carregando mensagens...</Typography>
                        </div>
                    ) : ticketMessages.length === 0 ? (
                        <div className={classes.emptyMessages}>
                            <MessageIcon fontSize="large" />
                            <Typography variant="body1">
                                {i18n.t("ticketsList.noMessages")}
                            </Typography>
                        </div>
                    ) : (
                        ticketMessages.map((message) => (
                            <Paper 
                                key={message.id} 
                                className={clsx(
                                    classes.messageItem, 
                                    message.fromMe ? classes.fromMe : classes.fromThem
                                )}
                                elevation={0}
                            >
                                <Typography className={classes.messageText}>
                                    {message.body.includes('data:image/png;base64') ? (
                                        <MarkdownWrapper>Localização</MarkdownWrapper>
                                    ) : message.body.includes('BEGIN:VCARD') ? (
                                        <MarkdownWrapper>Contato</MarkdownWrapper>
                                    ) : (
                                        <MarkdownWrapper>{message.body}</MarkdownWrapper>
                                    )}
                                </Typography>
                                <Typography variant="caption" className={classes.messageTime}>
                                    {format(parseISO(message.createdAt), "HH:mm")}
                                </Typography>
                            </Paper>
                        ))
                    )}
                </DialogContent>
            </Dialog>
            
            <ListItem
                button
                dense
                onClick={(e) => {
                    const isCheckboxClicked = (e.target.tagName.toLowerCase() === "input" && e.target.type === "checkbox")
                        || (e.target.tagName.toLowerCase() === "svg" && e.target.type === undefined)
                        || (e.target.tagName.toLowerCase() === "path" && e.target.type === undefined);

                    if (isCheckboxClicked) return;

                    handleSelectTicket(ticket);
                }}
                selected={ticketId && ticketId === ticket.uuid}
                className={clsx(classes.ticket, {
                    [classes.pendingTicket]: ticket.status === "pending",
                    [classes.unreadTicket]: Number(ticket.unreadMessages) > 0,
                    [classes.readTicket]: Number(ticket.unreadMessages) === 0,
                })}
            >
                <ListItemAvatar className={classes.avatarWrap}>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "right",
                        }}
                        badgeContent={
                            <Avatar 
                                className={classes.smallAvatar}
                                src={getAvatarChannel(ticket.channel)}
                            />
                        }
                    >
                        <Avatar 
                            alt={ticket.contact.name} 
                            className={classes.ticketAvatar} 
                            src={avatarUrl || ticket.contact.urlPicture || undefined} 
                        />
                    </Badge>
                </ListItemAvatar>

                <ListItemText
                    disableTypography
                    className={classes.contentRoot}
                    primary={
                        <div className={classes.primaryRow}>
                            <div className={classes.nameLine}>
                                {ticket.isGroup && ticket.channel === "whatsapp" && (
                                    <GroupIcon fontSize="small" style={{ color: grey[700] }} />
                                )}
                                <Typography noWrap component="span" className={classes.contactName}>
                                    {truncate(ticket.contact?.name, 42)}
                                </Typography>
                            </div>
                            <div className={classes.rightTop}>
                                {ticket.lastMessage && (
                                    <Typography
                                        component="span"
                                        className={Number(ticket.unreadMessages) > 0 ? classes.lastMessageTimeUnread : classes.lastMessageTime}
                                    >
                                        {formattedUpdateLabel}
                                    </Typography>
                                )}
                                <IconButton
                                    size="small"
                                    onClick={handleOpenMenu}
                                    className={classes.viewIcon}
                                >
                                    <MoreVertIcon style={{ fontSize: "1.1rem" }} />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleCloseMenu}
                                >
                                    <MenuItem onClick={(e) => { e.stopPropagation(); handleOpenMessageDialog(e); handleCloseMenu(); }}>
                                        <VisibilityIcon fontSize="small" style={{ marginRight: 8 }} /> {i18n.t("ticketsList.buttons.view")}
                                    </MenuItem>

                                    {ticket.status === "pending" && (
                                        <MenuItem onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (ticket.queueId) handleAcepptTicket(ticket.id); 
                                            else handleOpenAcceptTicketWithouSelectQueue();
                                            handleCloseMenu();
                                        }}>
                                            <Done fontSize="small" style={{ marginRight: 8 }} /> {i18n.t("ticketsList.buttons.accept")}
                                        </MenuItem>
                                    )}

                                    {(ticket.status === "pending" || ticket.status === "open" || ticket.status === "group") && (
                                        <MenuItem onClick={(e) => { e.stopPropagation(); handleOpenTransferModal(); handleCloseMenu(); }}>
                                            <SwapHoriz fontSize="small" style={{ marginRight: 8 }} /> {i18n.t("ticketsList.buttons.transfer")}
                                        </MenuItem>
                                    )}

                                    {(ticket.status === "open" || ticket.status === "group") && (
                                        <MenuItem onClick={(e) => { e.stopPropagation(); handleCloseTicket(ticket.id); handleCloseMenu(); }}>
                                            <HighlightOff fontSize="small" style={{ marginRight: 8 }} /> {i18n.t("ticketsList.buttons.closed")}
                                        </MenuItem>
                                    )}
                                </Menu>
                            </div>
                        </div>
                    }
                    secondary={
                        <div className={classes.secondaryContent}>
                            <Typography
                                noWrap
                                component="span"
                                className={clsx(classes.messagePreview, {
                                    [classes.messagePreviewUnread]: Number(ticket.unreadMessages) > 0,
                                })}
                            >
                                {renderLastMessageLabel()}
                            </Typography>

                            <div className={classes.metaRow} style={{ marginBottom: 4 }}>
                                {ticket?.whatsapp && (
                                    <span
                                        className={classes.metaPill}
                                        style={{
                                            backgroundColor: "#f0fdf4",
                                            color: "#166534",
                                            border: "1px solid #dcfce7"
                                        }}
                                    >
                                        {ticket.whatsapp?.name}
                                    </span>
                                )}
                            </div>
                            <div className={classes.metaRow}>
                                <span
                                    className={classes.metaPill}
                                    style={{ 
                                        backgroundColor: "#eff6ff",
                                        color: "#1e40af",
                                        border: "1px solid #dbeafe"
                                    }}
                                >
                                    {ticket.queueId
                                        ? ticket.queue?.name
                                        : ticket.status === "lgpd"
                                            ? "LGPD"
                                            : "SEM FILA"}
                                </span>
                                {ticket?.user && (
                                    <span 
                                        className={classes.metaPill} 
                                        style={{ 
                                            backgroundColor: "#f9fafb",
                                            color: "#6b7280",
                                            border: "1px solid #f3f4f6"
                                        }}
                                    >
                                        {ticket.user?.name}
                                    </span>
                                )}
                                <div className={classes.tagsRow}>
                                    {ticket.tags?.map((tag) => (
                                        <ContactTag tag={tag} key={`ticket-contact-tag-${ticket.id}-${tag.id}`} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    }
                />
            </ListItem>
            
            <div className={classes.bottomColorBars}>
                {ticket.tags?.map((tag) => (
                    <div 
                        key={`bar-${tag.id}`} 
                        className={classes.colorBar} 
                        style={{ backgroundColor: tag.color }} 
                    />
                ))}
            </div>
        </React.Fragment>
    );
};

export default TicketListItemCustom;
