import React, { useState, useEffect, useContext } from "react";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import api from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import Board from "react-trello";
import { toast } from "react-toastify";
import { i18n } from "../../translate/i18n";
import { useHistory } from "react-router-dom";
import { FlashOn as FlashOnIcon } from "@material-ui/icons";
import {
  Typography,
  Button,
  TextField,
  Box,
  Paper,
  Grid,
  Chip,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import { format } from "date-fns";
import { Can } from "../../components/Can";
import MainHeader from "../../components/MainHeader";

const useStyles = makeStyles((theme) => ({
  pageRoot: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    padding: theme.spacing(2),
    height: "calc(100% - 48px)",
    display: "flex",
    flexDirection: "column",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1),
    },
  },
  pageHeader: {
    width: "100%",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: 16,
    color: "#1e2a44",
    background: "#EDF4FF",
    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(2),
    },
  },
  pageHeaderTitle: {
    fontWeight: 600,
    letterSpacing: 0.1,
    fontSize: "1.2rem",
    [theme.breakpoints.down("sm")]: {
      fontSize: "1.05rem",
    },
  },
  pageHeaderSubtitle: {
    marginTop: theme.spacing(0.25),
    color: "rgba(30,42,68,0.78)",
    fontSize: "0.8rem",
    lineHeight: 1.35,
  },
  headerChip: {
    backgroundColor: "#EAF1FF",
    color: "#2f4b7c",
    border: "1px solid #d7e5ff",
    fontWeight: 500,
    fontSize: "0.72rem",
    height: 24,
  },
  filterCard: {
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
    padding: theme.spacing(1.25),
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  dateInput: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 14,
      backgroundColor:
        theme.mode === "light" ? "#f8fbff" : theme.palette.background.default,
      transition: "all 0.2s ease",
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor:
          theme.mode === "light"
            ? "rgba(37, 99, 235, 0.22)"
            : "rgba(148, 163, 184, 0.35)",
        borderWidth: 1.5,
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor:
          theme.mode === "light"
            ? "rgba(29, 78, 216, 0.42)"
            : "rgba(148, 163, 184, 0.55)",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.primary.main,
        borderWidth: 2,
      },
    },
    "& .MuiInputBase-input": {
      fontSize: "0.82rem",
      paddingTop: 12,
      paddingBottom: 12,
      color: theme.palette.text.primary,
    },
    "& .MuiInputLabel-outlined": {
      fontSize: "0.8rem",
      color: theme.palette.text.secondary,
    },
    "& .MuiOutlinedInput-inputMarginDense": {
      paddingTop: 11,
      paddingBottom: 11,
    },
    "& input[type='date']::-webkit-calendar-picker-indicator": {
      cursor: "pointer",
      filter: theme.mode === "light" ? "none" : "invert(0.82)",
    },
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.75rem",
    padding: theme.spacing(0.8, 1.4),
    boxShadow: "0 6px 14px rgba(7, 64, 171, 0.14)",
  },
  helperText: {
    fontSize: "0.8rem",
  },
  boardShell: {
    flex: 1,
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
    backgroundColor: theme.palette.background.paper,
    minHeight: 0,
    padding: theme.spacing(1.5),
    overflow: "hidden",
  },
  boardScroll: {
    width: "100%",
    height: "100%",
    overflowX: "auto",
    overflowY: "hidden",
    ...theme.scrollbarStyles,
    "& .react-trello-board": {
      backgroundColor: "transparent !important",
      minHeight: "100%",
      paddingBottom: theme.spacing(1),
    },
    "& section": {
      background:
        theme.mode === "light"
          ? "linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%)"
          : "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
      borderRadius: 14,
      border: `1px solid ${theme.palette.divider}`,
      boxShadow:
        theme.mode === "light"
          ? "0 10px 24px rgba(15, 23, 42, 0.08)"
          : "0 10px 24px rgba(2, 6, 23, 0.45)",
      paddingBottom: theme.spacing(1),
    },
    "& article": {
      borderRadius: 12,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor:
        theme.mode === "light" ? "rgba(255,255,255,0.96)" : "rgba(15,23,42,0.88)",
      boxShadow:
        theme.mode === "light"
          ? "0 10px 20px rgba(15, 23, 42, 0.08)"
          : "0 10px 20px rgba(2, 6, 23, 0.45)",
      transition: "transform 0.16s ease, box-shadow 0.16s ease",
      backdropFilter: "blur(2px)",
    },
    "& article:hover": {
      transform: "translateY(-2px)",
      boxShadow:
        theme.mode === "light"
          ? "0 14px 28px rgba(15, 23, 42, 0.14)"
          : "0 14px 28px rgba(2, 6, 23, 0.56)",
    },
    "& [data-id='lane-title'], & .react-trello-lane-header": {
      fontWeight: 700,
      letterSpacing: 0.2,
    },
    "& [data-id='CardTitle'], & .react-trello-card-title": {
      fontWeight: 700,
      fontSize: "0.88rem",
      lineHeight: 1.3,
    },
    "& [data-id='CardDescription'], & .react-trello-card-description": {
      color: "inherit !important",
      opacity: 0.88,
      fontSize: "0.78rem",
      lineHeight: 1.4,
    },
    "& .react-trello-lane": {
      marginRight: theme.spacing(1.5),
    },
  },
  connectionTag: {
    background: "green",
    color: "#FFF",
    marginRight: 1,
    padding: 1,
    fontWeight: "bold",
    borderRadius: 3,
    fontSize: "0.6em",
  },
  lastMessageTime: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    marginLeft: "auto",
    color: theme.palette.text.secondary,
  },
  lastMessageTimeUnread: {
    justifySelf: "flex-end",
    textAlign: "right",
    position: "relative",
    color: theme.palette.success.main,
    fontWeight: "bold",
    marginLeft: "auto",
  },
  cardButton: {
    marginRight: theme.spacing(1),
    color: theme.palette.common.white,
    backgroundColor: theme.palette.primary.main,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
    },
  },
}));

const Kanban = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { user, socket } = useContext(AuthContext);
  const [tags, setTags] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [file, setFile] = useState({ lanes: [] });
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const queueIds = user.queues.map((queue) => queue.UserQueue.queueId);

  useEffect(() => {
    fetchTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTags = async () => {
    try {
      const response = await api.get("/tag/kanban/");
      const fetchedTags = response.data.lista || [];
      setTags(fetchedTags);
      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const { data } = await api.get("/ticket/kanban", {
        params: {
          queueIds: JSON.stringify(queueIds),
          startDate,
          endDate,
        },
      });
      setTickets(data.tickets);
    } catch (err) {
      console.log(err);
      setTickets([]);
    }
  };

  useEffect(() => {
    const companyId = user.companyId;
    const onAppMessage = (data) => {
      if (data.action === "create" || data.action === "update" || data.action === "delete") {
        fetchTickets();
      }
    };
    socket.on(`company-${companyId}-ticket`, onAppMessage);
    socket.on(`company-${companyId}-appMessage`, onAppMessage);

    return () => {
      socket.off(`company-${companyId}-ticket`, onAppMessage);
      socket.off(`company-${companyId}-appMessage`, onAppMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, startDate, endDate]);

  const handleSearchClick = () => {
    fetchTickets();
  };

  const popularCards = () => {
    const filteredTickets = tickets.filter((ticket) => ticket.tags.length === 0);
    const laneBaseStyle = {
      borderRadius: 14,
      border: `1px solid ${theme.palette.divider}`,
      background:
        theme.mode === "light"
          ? "linear-gradient(180deg, #f8fbff 0%, #f3f7ff 100%)"
          : "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
      color: theme.palette.text.primary,
    };
    const cardBaseStyle = {
      borderRadius: 12,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor:
        theme.mode === "light" ? "rgba(255,255,255,0.96)" : "#ffffff",
      color: theme.mode === "light" ? theme.palette.text.primary : "#0f172a",
      boxShadow:
        theme.mode === "light"
          ? "0 10px 20px rgba(15, 23, 42, 0.08)"
          : "0 10px 20px rgba(2, 6, 23, 0.45)",
    };
    const tagLaneStyle = (tagColor) => ({
      ...laneBaseStyle,
      background: tagColor,
      backgroundColor: tagColor,
      color: "#ffffff",
      borderTop: "none",
      border: "1px solid rgba(255,255,255,0.22)",
      boxShadow:
        theme.mode === "light"
          ? "0 10px 24px rgba(15, 23, 42, 0.08)"
          : "0 10px 24px rgba(2, 6, 23, 0.45)",
    });

    const lanes = [
      {
        id: "lane0",
        title: i18n.t("tagsKanban.laneDefault"),
        label: filteredTickets.length.toString(),
        style: laneBaseStyle,
        cards: filteredTickets.map((ticket) => ({
          id: ticket.id.toString(),
          label: `Ticket nº ${ticket.id}`,
          description: `${ticket.contact?.number || ""} | ${ticket.lastMessage || ""}`,
          title: ticket.contact?.name || "",
          draggable: true,
          href: `/tickets/${ticket.uuid}`,
          style: cardBaseStyle,
        })),
      },
      ...tags.map((tag) => {
        const taggedTickets = tickets.filter((ticket) => {
          const tagIds = ticket.tags.map((item) => item.id);
          return tagIds.includes(tag.id);
        });

        return {
          id: tag.id.toString(),
          title: tag.name,
          label: taggedTickets.length.toString(),
          cards: taggedTickets.map((ticket) => ({
            id: ticket.id.toString(),
            label: `Ticket nº ${ticket.id}`,
            description: `${ticket.contact?.number || ""} | ${ticket.lastMessage || ""}`,
            title: ticket.contact?.name || "",
            draggable: true,
            href: `/tickets/${ticket.uuid}`,
            style: cardBaseStyle,
          })),
          style: tagLaneStyle(tag.color),
        };
      }),
    ];

    setFile({ lanes });
  };

  useEffect(() => {
    popularCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tags, tickets, theme.mode]);

  const handleCardMove = async (cardId, sourceLaneId, targetLaneId) => {
    try {
      await api.delete(`/ticket-tags/${targetLaneId}`);
      toast.success("Ticket Tag Removido!");
      await api.put(`/ticket-tags/${targetLaneId}/${sourceLaneId}`);
      toast.success("Ticket Tag Adicionado com Sucesso!");
      await fetchTickets();
      popularCards();
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddConnectionClick = () => {
    history.push("/tagsKanban");
  };

  const ticketsWithoutLane = tickets.filter((ticket) => ticket.tags.length === 0).length;

  return (
    <div className={classes.pageRoot}>
      <MainHeader>
        <Grid container style={{ width: "100%" }}>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.pageHeader}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" className={classes.pageHeaderTitle}>
                    {i18n.t("kanban.title")}
                  </Typography>
                  <Typography className={classes.pageHeaderSubtitle}>
                    Gerencie tickets por estágio com visão operacional completa em tempo real.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                  <Chip
                    icon={<FlashOnIcon style={{ color: "#2f4b7c" }} />}
                    label={`${tickets.length} tickets no período`}
                    className={classes.headerChip}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={0} className={classes.filterCard}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Data de início"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="outlined"
                    className={classes.dateInput}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Data de fim"
                    type="date"
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="outlined"
                    className={classes.dateInput}
                  />
                </Grid>

                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleSearchClick}
                    className={classes.actionButton}
                    startIcon={<SearchIcon />}
                  >
                    Buscar
                  </Button>
                </Grid>

                <Grid item xs={12} sm={6} md={4} style={{ textAlign: "right" }}>
                  <Can
                    role={user.profile}
                    perform="dashboard:view"
                    yes={() => (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAddConnectionClick}
                        className={classes.actionButton}
                        size="small"
                      >
                        + Adicionar colunas
                      </Button>
                    )}
                  />
                </Grid>
              </Grid>

              <Box mt={1.5}>
                <Typography color="textSecondary" className={classes.helperText}>
                  {`Lanes ativas: ${tags.length + 1} | Sem lane: ${ticketsWithoutLane}`}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </MainHeader>

      <Paper elevation={0} className={classes.boardShell}>
        <div className={classes.boardScroll}>
          <Board
            data={file}
            onCardMoveAcrossLanes={handleCardMove}
            style={{ backgroundColor: "transparent" }}
          />
        </div>
      </Paper>
    </div>
  );
};

export default Kanban;
