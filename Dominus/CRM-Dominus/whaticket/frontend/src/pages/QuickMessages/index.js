import React, { useState, useEffect, useReducer, useContext } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import AddIcon from "@material-ui/icons/Add";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import DescriptionOutlinedIcon from "@material-ui/icons/DescriptionOutlined";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import MainHeader from "../../components/MainHeader";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import QuickMessageDialog from "../../components/QuickMessageDialog";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
import { Grid } from "@material-ui/core";
import { isArray } from "lodash";
import { AuthContext } from "../../context/Auth/AuthContext";

const reducer = (state, action) => {
  if (action.type === "LOAD_QUICKMESSAGES") {
    const quickmessages = action.payload;
    const newQuickmessages = [];

    if (isArray(quickmessages)) {
      quickmessages.forEach((quickemessage) => {
        const quickemessageIndex = state.findIndex((u) => u.id === quickemessage.id);
        if (quickemessageIndex !== -1) {
          state[quickemessageIndex] = quickemessage;
        } else {
          newQuickmessages.push(quickemessage);
        }
      });
    }

    return [...state, ...newQuickmessages];
  }

  if (action.type === "UPDATE_QUICKMESSAGES") {
    const quickemessage = action.payload;
    const quickemessageIndex = state.findIndex((u) => u.id === quickemessage.id);

    if (quickemessageIndex !== -1) {
      state[quickemessageIndex] = quickemessage;
      return [...state];
    }
    return [quickemessage, ...state];
  }

  if (action.type === "DELETE_QUICKMESSAGE") {
    const quickemessageId = action.payload;

    const quickemessageIndex = state.findIndex((u) => u.id === quickemessageId);
    if (quickemessageIndex !== -1) {
      state.splice(quickemessageIndex, 1);
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
  quickChip: {
    backgroundColor: "#EAF1FF",
    color: "#2f4b7c",
    border: "1px solid #d7e5ff",
    fontWeight: 500,
    fontSize: "0.72rem",
    height: 24,
  },
  metricsWrap: {
    marginBottom: theme.spacing(2),
  },
  metricCard: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1.5, 1.75),
    backgroundColor: theme.palette.background.paper,
    height: "100%",
  },
  metricLabel: {
    fontSize: 10,
    color: theme.palette.text.secondary,
    textTransform: "uppercase",
    fontWeight: 600,
    letterSpacing: 0.3,
    marginBottom: theme.spacing(0.4),
  },
  metricValue: {
    fontWeight: 600,
    fontSize: 19,
    lineHeight: 1.2,
    color: theme.palette.text.primary,
  },
  controlsPaper: {
    marginBottom: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
    padding: theme.spacing(1.25),
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
  createButton: {
    height: "100%",
    minHeight: 42,
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.75rem",
    padding: theme.spacing(0.8, 1.4),
    boxShadow: "0 6px 14px rgba(7, 64, 171, 0.14)",
  },
  mainPaper: {
    flex: 1,
    borderRadius: 14,
    overflowY: "auto",
    ...theme.scrollbarStyles,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  tableHeaderCell: {
    fontWeight: 600,
    fontSize: "0.76rem",
    color: theme.palette.text.secondary,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(255,255,255,0.04)"
        : "rgba(15, 23, 42, 0.03)",
  },
  tableRow: {
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor:
        theme.palette.type === "dark"
          ? "rgba(255,255,255,0.03)"
          : "rgba(15, 23, 42, 0.035)",
    },
  },
  shortcodeCell: {
    fontWeight: 600,
    fontSize: "0.78rem",
  },
  mediaCell: {
    color: theme.palette.text.secondary,
    fontSize: "0.78rem",
  },
  statusCellIcon: {
    color: "#1e8e3e",
  },
  emptyStatusMark: {
    color: theme.palette.text.disabled,
    fontWeight: 700,
  },
  actionCell: {
    minWidth: 120,
  },
  actionIconButton: {
    border: `1px solid ${theme.palette.divider}`,
    margin: theme.spacing(0, 0.4),
  },
}));

const Quickemessages = () => {
  const classes = useStyles();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedQuickemessage, setSelectedQuickemessage] = useState(null);
  const [deletingQuickemessage, setDeletingQuickemessage] = useState(null);
  const [quickemessageModalOpen, setQuickMessageDialogOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [searchParam, setSearchParam] = useState("");
  const [quickemessages, dispatch] = useReducer(reducer, []);
  const { user, socket } = useContext(AuthContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      fetchQuickemessages();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParam, pageNumber]);

  useEffect(() => {
    const companyId = user.companyId;

    const onQuickMessageEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_QUICKMESSAGES", payload: data.record });
      }
      if (data.action === "delete") {
        dispatch({ type: "DELETE_QUICKMESSAGE", payload: +data.id });
      }
    };
    socket.on(`company-${companyId}-quickemessage`, onQuickMessageEvent);

    return () => {
      socket.off(`company-${companyId}-quickemessage`, onQuickMessageEvent);
    };
  }, [socket, user.companyId]);

  const fetchQuickemessages = async () => {
    try {
      const { data } = await api.get("/quick-messages", {
        params: { searchParam, pageNumber },
      });

      dispatch({ type: "LOAD_QUICKMESSAGES", payload: data.records });
      setHasMore(data.hasMore);
      setLoading(false);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenQuickMessageDialog = () => {
    setSelectedQuickemessage(null);
    setQuickMessageDialogOpen(true);
  };

  const handleCloseQuickMessageDialog = () => {
    setSelectedQuickemessage(null);
    setQuickMessageDialogOpen(false);
    fetchQuickemessages();
  };

  const handleSearch = (event) => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleEditQuickemessage = (quickemessage) => {
    setSelectedQuickemessage(quickemessage);
    setQuickMessageDialogOpen(true);
  };

  const handleDeleteQuickemessage = async (quickemessageId) => {
    try {
      await api.delete(`/quick-messages/${quickemessageId}`);
      toast.success(i18n.t("quickemessages.toasts.deleted"));
    } catch (err) {
      toastError(err);
    }
    setDeletingQuickemessage(null);
    setSearchParam("");
    setPageNumber(1);
    fetchQuickemessages();
    dispatch({ type: "RESET" });
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

  const totalQuickMessages = quickemessages.length;
  const messagesWithAttachment = quickemessages.filter((item) => !!item.mediaName).length;
  const editableMessages = quickemessages.filter((item) => item.geral === true).length;

  return (
    <div className={classes.pageRoot}>
      <ConfirmationModal
        title={
          deletingQuickemessage &&
          `${i18n.t("quickMessages.confirmationModal.deleteTitle")} ${
            deletingQuickemessage.shortcode
          }?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteQuickemessage(deletingQuickemessage.id)}
      >
        {i18n.t("quickMessages.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <QuickMessageDialog
        resetPagination={() => {
          setPageNumber(1);
          fetchQuickemessages();
        }}
        open={quickemessageModalOpen}
        onClose={handleCloseQuickMessageDialog}
        aria-labelledby="form-dialog-title"
        quickemessageId={selectedQuickemessage && selectedQuickemessage.id}
      />

      <MainHeader>
        <Grid container style={{ width: "100%" }}>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.pageHeader}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" className={classes.pageHeaderTitle}>
                    {i18n.t("quickMessages.title")}
                  </Typography>
                  <Typography variant="body2" className={classes.pageHeaderSubtitle}>
                    Centralize, padronize e acelere o atendimento com atalhos organizados.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                  <Chip
                    icon={<FlashOnIcon style={{ color: "#2f4b7c" }} />}
                    label={`${totalQuickMessages} atalhos cadastrados`}
                    className={classes.quickChip}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} className={classes.metricsWrap}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} className={classes.metricCard}>
                  <Typography className={classes.metricLabel}>Total</Typography>
                  <Typography className={classes.metricValue}>{totalQuickMessages}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} className={classes.metricCard}>
                  <Typography className={classes.metricLabel}>Com arquivo</Typography>
                  <Typography className={classes.metricValue}>{messagesWithAttachment}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Paper elevation={0} className={classes.metricCard}>
                  <Typography className={classes.metricLabel}>Permitem edição</Typography>
                  <Typography className={classes.metricValue}>{editableMessages}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12}>
            <Paper elevation={0} className={classes.controlsPaper}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8} md={9}>
                  <TextField
                    fullWidth
                    placeholder={i18n.t("quickMessages.searchPlaceholder")}
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
                    onClick={handleOpenQuickMessageDialog}
                    color="primary"
                    className={classes.createButton}
                    startIcon={<AddIcon />}
                  >
                    {i18n.t("quickMessages.buttons.add")}
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

        </Grid>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined" onScroll={handleScroll}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" className={classes.tableHeaderCell}>
                {i18n.t("quickMessages.table.shortcode")}
              </TableCell>
              <TableCell align="center" className={classes.tableHeaderCell}>
                {i18n.t("quickMessages.table.mediaName")}
              </TableCell>
              <TableCell align="center" className={classes.tableHeaderCell}>
                {i18n.t("quickMessages.table.status")}
              </TableCell>
              <TableCell align="center" className={classes.tableHeaderCell}>
                {i18n.t("quickMessages.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <>
              {quickemessages.map((quickemessage) => (
                <TableRow key={quickemessage.id} className={classes.tableRow}>
                  <TableCell align="center" className={classes.shortcodeCell}>
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<DescriptionOutlinedIcon />}
                      label={quickemessage.shortcode}
                    />
                  </TableCell>

                  <TableCell align="center" className={classes.mediaCell}>
                    {quickemessage.mediaName ?? i18n.t("quickMessages.noAttachment")}
                  </TableCell>

                  <TableCell align="center">
                    {quickemessage.geral === true ? (
                      <CheckCircleIcon className={classes.statusCellIcon} />
                    ) : (
                      <span className={classes.emptyStatusMark}>-</span>
                    )}
                  </TableCell>

                  <TableCell align="center" className={classes.actionCell}>
                    <IconButton
                      size="small"
                      className={classes.actionIconButton}
                      onClick={() => handleEditQuickemessage(quickemessage)}
                    >
                      <EditIcon />
                    </IconButton>

                    <IconButton
                      size="small"
                      className={classes.actionIconButton}
                      onClick={() => {
                        setConfirmModalOpen(true);
                        setDeletingQuickemessage(quickemessage);
                      }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {loading && <TableRowSkeleton columns={5} />}
            </>
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

export default Quickemessages;
