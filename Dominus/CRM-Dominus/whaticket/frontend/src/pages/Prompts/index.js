import React, { useContext, useEffect, useReducer, useState } from "react";

import {
  Button,
  Chip,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@material-ui/core";

import { makeStyles } from "@material-ui/core/styles";

import MainHeader from "../../components/MainHeader";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import api from "../../services/api";
import { DeleteOutline, Edit, Add } from "@material-ui/icons";
import PromptModal from "../../components/PromptModal";
import { toast } from "react-toastify";
import ConfirmationModal from "../../components/ConfirmationModal";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ForbiddenPage from "../../components/ForbiddenPage";

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
    overflowY: "auto",
    ...theme.scrollbarStyles,
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  tableHeaderCell: {
    fontWeight: 700,
    color: theme.palette.text.secondary,
    backgroundColor:
      theme.palette.type === "dark"
        ? "rgba(255,255,255,0.04)"
        : "rgba(15, 23, 42, 0.03)",
    fontSize: "0.76rem",
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
  tableCellText: {
    fontSize: "0.78rem",
  },
  actionCell: {
    minWidth: 120,
  },
  actionIconButton: {
    border: `1px solid ${theme.palette.divider}`,
    margin: theme.spacing(0, 0.2),
  },
}));

const reducer = (state, action) => {
  if (action.type === "LOAD_PROMPTS") {
    const prompts = action.payload;
    const newPrompts = [];

    prompts.forEach((prompt) => {
      const promptIndex = state.findIndex((p) => p.id === prompt.id);
      if (promptIndex !== -1) {
        state[promptIndex] = prompt;
      } else {
        newPrompts.push(prompt);
      }
    });

    return [...state, ...newPrompts];
  }

  if (action.type === "UPDATE_PROMPTS") {
    const prompt = action.payload;
    const promptIndex = state.findIndex((p) => p.id === prompt.id);

    if (promptIndex !== -1) {
      state[promptIndex] = prompt;
      return [...state];
    }
    return [prompt, ...state];
  }

  if (action.type === "DELETE_PROMPT") {
    const promptId = action.payload;
    const promptIndex = state.findIndex((p) => p.id === promptId);
    if (promptIndex !== -1) {
      state.splice(promptIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const Prompts = () => {
  const classes = useStyles();

  const [prompts, dispatch] = useReducer(reducer, []);
  const [loading, setLoading] = useState(false);

  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { user, socket } = useContext(AuthContext);

  const { getPlanCompany } = usePlans();
  const history = useHistory();
  const companyId = user.companyId;

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useOpenAi) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`);
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/prompt");
        dispatch({ type: "LOAD_PROMPTS", payload: data.prompts });
      } catch (err) {
        toastError(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onPromptEvent = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_PROMPTS", payload: data.prompt });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_PROMPT", payload: data.promptId });
      }
    };

    socket.on(`company-${companyId}-prompt`, onPromptEvent);
    return () => {
      socket.off(`company-${companyId}-prompt`, onPromptEvent);
    };
  }, [socket, companyId]);

  const handleOpenPromptModal = () => {
    setPromptModalOpen(true);
    setSelectedPrompt(null);
  };

  const handleClosePromptModal = () => {
    setPromptModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleEditPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setPromptModalOpen(true);
  };

  const handleCloseConfirmationModal = () => {
    setConfirmModalOpen(false);
    setSelectedPrompt(null);
  };

  const handleDeletePrompt = async (promptId) => {
    try {
      const { data } = await api.delete(`/prompt/${promptId}`);
      toast.info(i18n.t(data.message));
    } catch (err) {
      toastError(err);
    }
    setSelectedPrompt(null);
  };

  return (
    <div className={classes.pageRoot}>
      <ConfirmationModal
        title={
          selectedPrompt &&
          `${i18n.t("prompts.confirmationModal.deleteTitle")} ${selectedPrompt.name}?`
        }
        open={confirmModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={() => handleDeletePrompt(selectedPrompt.id)}
      >
        {i18n.t("prompts.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <PromptModal
        open={promptModalOpen}
        onClose={handleClosePromptModal}
        promptId={selectedPrompt?.id}
      />

      {user.profile === "user" ? (
        <ForbiddenPage />
      ) : (
        <>
          <MainHeader>
            <Grid container style={{ width: "100%" }}>
              <Grid item xs={12}>
                <Paper elevation={0} className={classes.pageHeader}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={8}>
                      <Typography className={classes.pageHeaderTitle}>{i18n.t("prompts.title")}</Typography>
                      <Typography className={classes.pageHeaderSubtitle}>
                        Gerencie prompts de IA com foco em consistência e produtividade da equipe.
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                      <Chip
                        icon={<Add style={{ color: "#2f4b7c", fontSize: 14 }} />}
                        label={`${prompts.length} prompts`}
                        className={classes.headerChip}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Paper elevation={0} className={classes.controlsPaper}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={handleOpenPromptModal}
                        className={classes.actionButton}
                        startIcon={<Add />}
                      >
                        {i18n.t("prompts.buttons.add")}
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </MainHeader>

          <Paper className={classes.mainPaper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell align="left" className={classes.tableHeaderCell}>
                    {i18n.t("prompts.table.name")}
                  </TableCell>
                  <TableCell align="left" className={classes.tableHeaderCell}>
                    {i18n.t("prompts.table.queue")}
                  </TableCell>
                  <TableCell align="left" className={classes.tableHeaderCell}>
                    {i18n.t("prompts.table.max_tokens")}
                  </TableCell>
                  <TableCell align="center" className={classes.tableHeaderCell}>
                    {i18n.t("prompts.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <>
                  {prompts.map((prompt) => (
                    <TableRow key={prompt.id} className={classes.tableRow}>
                      <TableCell align="left" className={classes.tableCellText}>{prompt.name}</TableCell>
                      <TableCell align="left" className={classes.tableCellText}>{prompt.queue.name}</TableCell>
                      <TableCell align="left" className={classes.tableCellText}>{prompt.maxTokens}</TableCell>
                      <TableCell align="center" className={classes.actionCell}>
                        <IconButton
                          size="small"
                          className={classes.actionIconButton}
                          onClick={() => handleEditPrompt(prompt)}
                        >
                          <Edit />
                        </IconButton>

                        <IconButton
                          size="small"
                          className={classes.actionIconButton}
                          onClick={() => {
                            setSelectedPrompt(prompt);
                            setConfirmModalOpen(true);
                          }}
                        >
                          <DeleteOutline />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {loading && <TableRowSkeleton columns={4} />}
                </>
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </div>
  );
};

export default Prompts;
