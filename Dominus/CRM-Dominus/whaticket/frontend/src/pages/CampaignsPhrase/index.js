import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import ConfirmationModal from "../../components/ConfirmationModal";
import MainHeader from "../../components/MainHeader";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import { AddCircle, TextFields, Campaign as CampaignIcon } from "@mui/icons-material";
import { CircularProgress, Grid, Stack } from "@mui/material";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import toastError from "../../errors/toastError";
import { Can } from "../../components/Can";
import { AuthContext } from "../../context/Auth/AuthContext";
import CampaignModalPhrase from "../../components/CampaignModalPhrase";

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
  },
  pageHeaderTitle: {
    fontWeight: 600,
    letterSpacing: 0.1,
    fontSize: "1.2rem",
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
    textTransform: "none",
  },
  mainPaper: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  tableHeader: {
    padding: "10px 8px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: "0.76rem",
    fontWeight: 700,
  },
  row: {
    padding: "10px 8px",
    borderRadius: 10,
    marginTop: theme.spacing(0.7),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor:
        theme.palette.type === "dark"
          ? "rgba(255,255,255,0.03)"
          : "rgba(15, 23, 42, 0.035)",
    },
  },
  rowText: {
    color: theme.palette.text.primary,
    fontSize: "0.78rem",
  },
  statusText: {
    color: theme.palette.text.secondary,
    fontSize: "0.78rem",
  },
  actionIconButton: {
    border: `1px solid ${theme.palette.divider}`,
    margin: theme.spacing(0, 0.2),
  },
}));

const CampaignsPhrase = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deletingFlow, setDeletingFlow] = useState(null);

  const [campaignFlows, setCampaignFlows] = useState([]);
  const [modalOpenPhrase, setModalOpenPhrase] = useState(false);
  const [campaignFlowSelected, setCampaignFlowSelected] = useState();

  const getCampaigns = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/flowcampaign");
      setCampaignFlows(data.flow || []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCampaigns();
  }, []);

  const handleDeleteCampaign = async (campaignId) => {
    try {
      await api.delete(`/flowcampaign/${campaignId}`);
      toast.success("Frase deletada");
      setDeletingFlow(null);
      getCampaigns();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className={classes.pageRoot}>
      <ConfirmationModal
        title={
          deletingFlow &&
          `${i18n.t("campaigns.confirmationModal.deleteTitle")} ${deletingFlow.name}?`
        }
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={() => handleDeleteCampaign(deletingFlow.id)}
      >
        {i18n.t("campaigns.confirmationModal.deleteMessage")}
      </ConfirmationModal>

      <CampaignModalPhrase
        open={modalOpenPhrase}
        onClose={() => setModalOpenPhrase(false)}
        FlowCampaignId={campaignFlowSelected}
        onSave={getCampaigns}
      />

      <MainHeader>
        <Grid container style={{ width: "100%" }}>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.pageHeader}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography className={classes.pageHeaderTitle}>Campanhas</Typography>
                  <Typography className={classes.pageHeaderSubtitle}>
                    Configure fluxos de campanha com regras e textos para disparos automáticos.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                  <Chip
                    icon={<CampaignIcon style={{ color: "#2f4b7c", fontSize: 14 }} />}
                    label={`${campaignFlows.length} campanhas`}
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
                    onClick={() => {
                      setCampaignFlowSelected();
                      setModalOpenPhrase(true);
                    }}
                    color="primary"
                    className={classes.actionButton}
                  >
                    <Stack direction="row" gap={1}>
                      <AddCircle />
                      <span>Campanha</span>
                    </Stack>
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </MainHeader>

      <Paper className={classes.mainPaper} variant="outlined">
        <Stack>
          <Grid container className={classes.tableHeader}>
            <Grid item xs={4}>Nome</Grid>
            <Grid item xs={4} align="center">Status</Grid>
            <Grid item xs={4} align="end">{i18n.t("contacts.table.actions")}</Grid>
          </Grid>

          {!loading &&
            campaignFlows.map((flow) => (
              <Grid container key={flow.id} className={classes.row}>
                <Grid item xs={4}>
                  <Stack justifyContent="center" height="100%" className={classes.rowText}>
                    <Stack direction="row">
                      <TextFields fontSize="small" />
                      <Stack justifyContent="center" marginLeft={1}>{flow.name}</Stack>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={4} align="center" className={classes.statusText}>
                  <Stack justifyContent="center" height="100%">
                    {flow.status ? "Ativo" : "Desativado"}
                  </Stack>
                </Grid>
                <Grid item xs={4} align="end">
                  <IconButton
                    size="small"
                    className={classes.actionIconButton}
                    onClick={() => {
                      setCampaignFlowSelected(flow.id);
                      setModalOpenPhrase(true);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <Can
                    role={user.profile}
                    perform="contacts-page:deleteContact"
                    yes={() => (
                      <IconButton
                        size="small"
                        className={classes.actionIconButton}
                        onClick={() => {
                          setConfirmModalOpen(true);
                          setDeletingFlow(flow);
                        }}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    )}
                  />
                </Grid>
              </Grid>
            ))}

          {loading && (
            <Stack justifyContent="center" alignItems="center" minHeight="50vh">
              <CircularProgress />
            </Stack>
          )}
        </Stack>
      </Paper>
    </div>
  );
};

export default CampaignsPhrase;
