import React, { useState, useEffect, useReducer, useCallback, useContext } from "react";
import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";
import MainHeader from "../../components/MainHeader";
import api from "../../services/api";
import { i18n } from "../../translate/i18n";
// import MessageModal from "../../components/MessageModal"
import ScheduleModal from "../../components/ScheduleModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import moment from "moment";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "moment/locale/pt-br";
import "react-big-calendar/lib/css/react-big-calendar.css";
import SearchIcon from "@material-ui/icons/Search";
import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";
import AddIcon from "@material-ui/icons/Add";
import EventNoteIcon from "@material-ui/icons/EventNote";

import "./Schedules.css";

// Defina a função getUrlParam antes de usá-la
function getUrlParam(paramName) {
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.get(paramName);
}

const localizer = momentLocalizer(moment);
var defaultMessages = {
  date: "Data",
  time: "Hora",
  event: "Evento",
  allDay: "Dia Todo",
  week: "Semana",
  work_week: "Agendamentos",
  day: "Dia",
  month: "Mês",
  previous: "Anterior",
  next: "Próximo",
  yesterday: "Ontem",
  tomorrow: "Amanhã",
  today: "Hoje",
  agenda: "Agenda",
  noEventsInRange: "Não há agendamentos no período.",
  showMore: function showMore(total) {
    return "+" + total + " mais";
  }
};

const reducer = (state, action) => {
  if (action.type === "LOAD_SCHEDULES") {
    const schedules = action.payload;
    const newSchedules = [];

    schedules.forEach((schedule) => {
      const scheduleIndex = state.findIndex((s) => s.id === schedule.id);
      if (scheduleIndex !== -1) {
        state[scheduleIndex] = schedule;
      } else {
        newSchedules.push(schedule);
      }
    });

    return [...state, ...newSchedules];
  }

  if (action.type === "UPDATE_SCHEDULES") {
    const schedule = action.payload;
    const scheduleIndex = state.findIndex((s) => s.id === schedule.id);

    if (scheduleIndex !== -1) {
      state[scheduleIndex] = schedule;
      return [...state];
    } else {
      return [schedule, ...state];
    }
  }

  if (action.type === "DELETE_SCHEDULE") {
    const scheduleId = action.payload;

    const scheduleIndex = state.findIndex((s) => s.id === scheduleId);
    if (scheduleIndex !== -1) {
      state.splice(scheduleIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

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
      padding: theme.spacing(1.5),
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
  controlsPaper: {
    marginBottom: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
    padding: theme.spacing(1.25),
    backgroundColor: theme.palette.background.paper,
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 10,
      backgroundColor: theme.palette.background.default,
    },
    "& .MuiInputBase-input": {
      fontSize: "0.82rem",
      paddingTop: 13,
      paddingBottom: 13,
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
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1),
    overflow: "hidden",
    ...theme.scrollbarStyles,
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  calendarWrap: {
    height: "100%",
    minHeight: 580,
    padding: theme.spacing(1),
    borderRadius: 14,
    background:
      theme.mode === "light"
        ? "linear-gradient(180deg, #f8fbff 0%, #f4f8ff 100%)"
        : "linear-gradient(180deg, #0f172a 0%, #111827 100%)",
    border: `1px solid ${theme.palette.divider}`,
    "& .rbc-calendar": {
      fontSize: "0.82rem",
      color: theme.palette.text.primary,
      fontFamily: "'Poppins', 'Segoe UI', sans-serif",
    },
    "& .rbc-toolbar": {
      marginBottom: theme.spacing(1.25),
      gap: theme.spacing(1),
      flexWrap: "wrap",
      padding: theme.spacing(1),
      borderRadius: 12,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor:
        theme.mode === "light" ? "rgba(255,255,255,0.8)" : "rgba(15,23,42,0.64)",
    },
    "& .rbc-toolbar .rbc-toolbar-label": {
      fontWeight: 700,
      letterSpacing: 0.2,
      fontSize: "0.95rem",
      color: theme.palette.text.primary,
    },
    "& .rbc-toolbar .rbc-btn-group button": {
      borderRadius: 10,
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor:
        theme.mode === "light" ? "rgba(255,255,255,0.92)" : "rgba(30,41,59,0.75)",
      color: theme.palette.text.primary,
      fontWeight: 600,
      boxShadow: "none",
      transition: "all 0.18s ease",
    },
    "& .rbc-toolbar .rbc-btn-group button:hover": {
      backgroundColor:
        theme.mode === "light" ? "rgba(239,246,255,1)" : "rgba(51,65,85,0.9)",
      borderColor: theme.palette.primary.main,
    },
    "& .rbc-toolbar .rbc-btn-group button.rbc-active": {
      backgroundColor: theme.palette.primary.main,
      borderColor: theme.palette.primary.main,
      color: "#ffffff",
      boxShadow:
        theme.mode === "light"
          ? "0 8px 18px rgba(37, 99, 235, 0.28)"
          : "0 8px 18px rgba(2, 6, 23, 0.45)",
    },
    "& .rbc-month-view, & .rbc-time-view, & .rbc-agenda-view": {
      borderRadius: 12,
      overflow: "hidden",
      border: `1px solid ${theme.palette.divider}`,
      backgroundColor:
        theme.mode === "light" ? "rgba(255,255,255,0.95)" : "rgba(15,23,42,0.7)",
    },
    "& .rbc-header": {
      padding: theme.spacing(0.8, 0.5),
      fontWeight: 700,
      fontSize: "0.75rem",
      letterSpacing: 0.35,
      textTransform: "uppercase",
      color: theme.palette.text.secondary,
      backgroundColor:
        theme.mode === "light" ? "rgba(248,250,252,0.95)" : "rgba(15,23,42,0.95)",
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
    "& .rbc-date-cell": {
      padding: theme.spacing(0.45),
    },
    "& .rbc-date-cell button": {
      fontWeight: 600,
      color: theme.palette.text.secondary,
      borderRadius: 8,
      padding: theme.spacing(0.2, 0.6),
    },
    "& .rbc-today": {
      backgroundColor:
        theme.mode === "light" ? "rgba(219, 234, 254, 0.45)" : "rgba(30, 58, 138, 0.22)",
    },
    "& .rbc-off-range-bg": {
      backgroundColor:
        theme.mode === "light" ? "rgba(248,250,252,0.7)" : "rgba(2,6,23,0.35)",
    },
    "& .rbc-month-row + .rbc-month-row": {
      borderTop: `1px solid ${theme.palette.divider}`,
    },
    "& .rbc-day-bg + .rbc-day-bg": {
      borderLeft: `1px solid ${theme.palette.divider}`,
    },
    "& .rbc-time-content, & .rbc-time-header-content": {
      borderLeft: `1px solid ${theme.palette.divider}`,
    },
  },
  calendarToolbar: {
    "& .rbc-event": {
      border: "none",
      borderRadius: 10,
      background:
        theme.mode === "light"
          ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
          : "linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)",
      boxShadow:
        theme.mode === "light"
          ? "0 8px 18px rgba(37, 99, 235, 0.3)"
          : "0 8px 18px rgba(2, 132, 199, 0.35)",
      color: "#ffffff",
      padding: theme.spacing(0.45, 0.55),
    },
    "& .rbc-event:focus": {
      outline: "none",
    },
    "& .rbc-show-more": {
      color: theme.palette.primary.main,
      fontWeight: 700,
    },
  },
}));

const Schedules = () => {
  const classes = useStyles();
  const history = useHistory();

  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);


  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [schedules, dispatch] = useReducer(reducer, []);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [contactId, setContactId] = useState(+getUrlParam("contactId"));

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useSchedules) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
  }, [user, history, getPlanCompany]);

  const fetchSchedules = useCallback(async () => {
    try {
      const { data } = await api.get("/schedules", {
        params: { searchParam, pageNumber },
      });

      dispatch({ type: "LOAD_SCHEDULES", payload: data.schedules });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  }, [searchParam, pageNumber]);

  const handleOpenScheduleModalFromContactId = useCallback(() => {
    if (contactId) {
      handleOpenScheduleModal();
    }
  }, [contactId]);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchSchedules();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [
    searchParam,
    pageNumber,
    contactId,
    fetchSchedules,
    handleOpenScheduleModalFromContactId,
  ]);

  useEffect(() => {
    // handleOpenScheduleModalFromContactId();
    // const socket = socketManager.GetSocket(user.companyId, user.id);


    const onCompanySchedule = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_SCHEDULES", payload: data.schedule });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_SCHEDULE", payload: +data.scheduleId });
      }
    }

    socket.on(`company${user.companyId}-schedule`, onCompanySchedule)

    return () => {
      socket.off(`company${user.companyId}-schedule`, onCompanySchedule)
    };
  }, [socket, user.companyId]);

  const cleanContact = () => {
    setContactId("");
  };

  const handleOpenScheduleModal = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setSelectedSchedule(null);
    setScheduleModalOpen(false);
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setScheduleModalOpen(true);
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await api.delete(`/schedules/${scheduleId}`);
      toast.success(i18n.t("schedules.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingSchedule(null);
    setSearchParam("");
    setPageNumber(1);

    dispatch({ type: "RESET" });
    setPageNumber(1);
    await fetchSchedules();
  };

  const loadMore = () => {
    setPageNumber((prevState) => prevState + 1);
  };

  const handleScroll = (e) => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  return (
    <div className={classes.pageRoot}>
      <ConfirmationModal
        title={
          deletingSchedule &&
          `${i18n.t("schedules.confirmationModal.deleteTitle")}`
        }
        open={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={() => handleDeleteSchedule(deletingSchedule.id)}
      >
        {i18n.t("schedules.confirmationModal.deleteMessage")}
      </ConfirmationModal>
      {scheduleModalOpen && (
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={handleCloseScheduleModal}
          reload={fetchSchedules}
          // aria-labelledby="form-dialog-title"
          scheduleId={
            selectedSchedule ? selectedSchedule.id : null
          }
          contactId={contactId}
          cleanContact={cleanContact}
        />
      )}
      <MainHeader>
        <Grid container style={{ width: "100%" }}>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.pageHeader}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography className={classes.pageHeaderTitle}>
                    {i18n.t("schedules.title")}
                  </Typography>
                  <Typography className={classes.pageHeaderSubtitle}>
                    Organize seus envios e compromissos com visão clara do calendário.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                  <Chip
                    icon={<EventNoteIcon style={{ color: "#2f4b7c", fontSize: 14 }} />}
                    label={`${schedules.length} agendamentos`}
                    className={classes.headerChip}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.controlsPaper}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8} md={9}>
                  <TextField
                    fullWidth
                    placeholder={i18n.t("contacts.searchPlaceholder")}
                    type="search"
                    value={searchParam}
                    onChange={handleSearch}
                    variant="outlined"
                    className={classes.searchField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon style={{ color: "gray" }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    onClick={handleOpenScheduleModal}
                    className={classes.actionButton}
                    startIcon={<AddIcon />}
                  >
                    {i18n.t("schedules.buttons.add")}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </MainHeader>
      <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
        <div className={`${classes.calendarWrap} schedule-calendar`}>
          <Calendar
            messages={defaultMessages}
            formats={{
              agendaDateFormat: "DD/MM ddd",
              weekdayFormat: "dddd"
            }}
            localizer={localizer}
            events={schedules.map((schedule) => ({
              title: (
                <div key={schedule.id} className="event-container">
                  <div className="event-title">{schedule?.contact?.name}</div>
                  <DeleteOutlineIcon
                    onClick={() => handleDeleteSchedule(schedule.id)}
                    className="delete-icon"
                  />
                  <EditIcon
                    onClick={() => {
                      handleEditSchedule(schedule);
                      setScheduleModalOpen(true);
                    }}
                    className="edit-icon"
                  />
                </div>
              ),
              start: new Date(schedule.sendAt),
              end: new Date(schedule.sendAt),
            }))}
            startAccessor="start"
            endAccessor="end"
            style={{ height: "100%" }}
            className={classes.calendarToolbar}
          />
        </div>
      </Paper>
    </div>
  );
};

export default Schedules;
