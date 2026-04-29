import React, { useState, useCallback, useContext, useEffect } from "react";
import { toast } from "react-toastify";
import { add, format, parseISO } from "date-fns";

import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import PopupState, { bindTrigger, bindMenu } from "material-ui-popup-state";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import {
  Button,
  Chip,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Table,
  TableHead,
  Paper,
  Tooltip,
  Typography,
  CircularProgress,
  Box,
  Card,
  CardContent,
} from "@material-ui/core";
import {
  Edit,
  CheckCircle,
  SignalCellularConnectedNoInternet2Bar,
  SignalCellularConnectedNoInternet0Bar,
  SignalCellular4Bar,
  CropFree,
  DeleteOutline,
  Facebook,
  Instagram,
  WhatsApp,
} from "@material-ui/icons";

import FacebookLogin from "react-facebook-login/dist/facebook-login-render-props";

import TableRowSkeleton from "../../components/TableRowSkeleton";

import api from "../../services/api";
import WhatsAppModal from "../../components/WhatsAppModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import QrcodeModal from "../../components/QrcodeModal";
import { i18n } from "../../translate/i18n";
import { WhatsAppsContext } from "../../context/WhatsApp/WhatsAppsContext";
import toastError from "../../errors/toastError";
import formatSerializedId from "../../utils/formatSerializedId";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../../hooks/usePlans";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import ForbiddenPage from "../../components/ForbiddenPage";
import { Can } from "../../components/Can";

const useStyles = makeStyles((theme) => ({
  pageRoot: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    padding: theme.spacing(2),
    height: "calc(100% - 48px)",
    overflowY: "hidden",
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
  },
  controlsActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    alignItems: "center",
  },
  mainPaper: {
    flex: 1,
    overflowY: "auto",
    ...theme.scrollbarStyles,
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  customTableCell: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  tooltip: {
    backgroundColor: "#f5f5f9",
    color: "rgba(0, 0, 0, 0.87)",
    fontSize: theme.typography.pxToRem(14),
    border: "1px solid #dadde9",
    maxWidth: 450,
  },
  tooltipPopper: {
    textAlign: "center",
  },
  buttonProgress: {
    color: green[500],
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
  tableCellText: {
    fontSize: "0.78rem",
  },
  actionIconButton: {
    border: `1px solid ${theme.palette.divider}`,
    margin: theme.spacing(0, 0.2),
  },
  statusCard: {
    margin: "0 auto 12px",
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
    maxWidth: 640,
    width: "100%",
  },
  statusCardContent: {
    padding: theme.spacing(1.5, 2),
  },
  statusTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#1e2a44",
    textAlign: "center",
  },
  statusText: {
    fontSize: "0.8rem",
  },
}));

function CircularProgressWithLabel(props) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="caption"
          component="div"
          color="textSecondary"
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

const CustomToolTip = ({ title, content, children }) => {
  const classes = useStyles();

  return (
    <Tooltip
      arrow
      classes={{
        tooltip: classes.tooltip,
        popper: classes.tooltipPopper,
      }}
      title={
        <React.Fragment>
          <Typography gutterBottom color="inherit">
            {title}
          </Typography>
          {content && <Typography>{content}</Typography>}
        </React.Fragment>
      }
    >
      {children}
    </Tooltip>
  );
};

const IconChannel = (channel) => {
  switch (channel) {
    case "facebook":
      return <Facebook style={{ color: "#3b5998" }} />;
    case "instagram":
      return <Instagram style={{ color: "#e1306c" }} />;
    case "whatsapp":
      return <WhatsApp style={{ color: "#25d366" }} />;
    default:
      return "error";
  }
};

const Connections = () => {
  const classes = useStyles();

  const { whatsApps, loading } = useContext(WhatsAppsContext);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [statusImport, setStatusImport] = useState([]);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedWhatsApp, setSelectedWhatsApp] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const history = useHistory();
  const confirmationModalInitialState = {
    action: "",
    title: "",
    message: "",
    whatsAppId: "",
    open: false,
  };
  const [confirmModalInfo, setConfirmModalInfo] = useState(
    confirmationModalInitialState
  );
  const [planConfig, setPlanConfig] = useState(false);
  const [supportWhatsapp, setSupportWhatsapp] = useState("");

  //   const socketManager = useContext(SocketContext);
  const { user, socket } = useContext(AuthContext);

  const companyId = user.companyId;

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const planConfigs = await getPlanCompany(undefined, companyId);
      setPlanConfig(planConfigs);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const responseFacebook = (response) => {
    if (response.status !== "unknown") {
      const { accessToken, userID } = response;

      api
        .post("/facebook", {
          facebookUserId: userID,
          facebookUserToken: accessToken,
        })
        .then((response) => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch((error) => {
          toastError(error);
        });
    }
  };

  const responseInstagram = (response) => {
    if (response.status !== "unknown") {
      const { accessToken, userID } = response;

      api
        .post("/facebook", {
          addInstagram: true,
          facebookUserId: userID,
          facebookUserToken: accessToken,
        })
        .then((response) => {
          toast.success(i18n.t("connections.facebook.success"));
        })
        .catch((error) => {
          toastError(error);
        });
    }
  };

  useEffect(() => {
    const onImportMessages = (data) => {
      if (data.action === "refresh") {
        setStatusImport([]);
        history.go(0);
      }
      if (data.action === "update") {
        setStatusImport(data.status);
      }
    };

    socket.on(`importMessages-${user.companyId}`, onImportMessages);

    return () => {
      socket.off(`importMessages-${user.companyId}`, onImportMessages);
    };
  }, [socket, user.companyId, history]);

  // Buscar WhatsApp de suporte (Whitelabel → fallback .env)
  useEffect(() => {
    const fetchSupportWhatsapp = async () => {
      try {
        const { data } = await api.get("/global-config/public-branding");

        const fromPanel = data?.loginWhatsapp;
        const fromEnv = process.env.REACT_APP_NUMBER_SUPPORT
          ? `https://wa.me/${process.env.REACT_APP_NUMBER_SUPPORT}`
          : "";

        setSupportWhatsapp(fromPanel || fromEnv);
      } catch (err) {
        console.error("Erro ao carregar número de suporte:", err);

        if (process.env.REACT_APP_NUMBER_SUPPORT) {
          setSupportWhatsapp(
            `https://wa.me/${process.env.REACT_APP_NUMBER_SUPPORT}`
          );
        }
      }
    };

    fetchSupportWhatsapp();
  }, []);

  const handleStartWhatsAppSession = async (whatsAppId) => {
    try {
      await api.post(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleRequestNewQrCode = async (whatsAppId) => {
    try {
      await api.put(`/whatsappsession/${whatsAppId}`);
    } catch (err) {
      toastError(err);
    }
  };

  const handleOpenWhatsAppModal = () => {
    setSelectedWhatsApp(null);
    setWhatsAppModalOpen(true);
  };

  const handleCloseWhatsAppModal = useCallback(() => {
    setWhatsAppModalOpen(false);
    setSelectedWhatsApp(null);
  }, [setSelectedWhatsApp, setWhatsAppModalOpen]);

  const handleOpenQrModal = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setQrModalOpen(true);
  };

  const handleCloseQrModal = useCallback(() => {
    setSelectedWhatsApp(null);
    setQrModalOpen(false);
  }, [setQrModalOpen, setSelectedWhatsApp]);

  const handleEditWhatsApp = (whatsApp) => {
    setSelectedWhatsApp(whatsApp);
    setWhatsAppModalOpen(true);
  };

  const openInNewTab = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenConfirmationModal = (action, whatsAppId) => {
    if (action === "disconnect") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.disconnectTitle"),
        message: i18n.t("connections.confirmationModal.disconnectMessage"),
        whatsAppId: whatsAppId,
      });
    }

    if (action === "delete") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.deleteTitle"),
        message: i18n.t("connections.confirmationModal.deleteMessage"),
        whatsAppId: whatsAppId,
      });
    }
    if (action === "closedImported") {
      setConfirmModalInfo({
        action: action,
        title: i18n.t("connections.confirmationModal.closedImportedTitle"),
        message: i18n.t("connections.confirmationModal.closedImportedMessage"),
        whatsAppId: whatsAppId,
      });
    }
    setConfirmModalOpen(true);
  };

  const handleSubmitConfirmationModal = async () => {
    if (confirmModalInfo.action === "disconnect") {
      try {
        await api.delete(`/whatsappsession/${confirmModalInfo.whatsAppId}`);
      } catch (err) {
        toastError(err);
      }
    }

    if (confirmModalInfo.action === "delete") {
      try {
        await api.delete(`/whatsapp/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.deleted"));
      } catch (err) {
        toastError(err);
      }
    }
    if (confirmModalInfo.action === "closedImported") {
      try {
        await api.post(`/closedimported/${confirmModalInfo.whatsAppId}`);
        toast.success(i18n.t("connections.toasts.closedimported"));
      } catch (err) {
        toastError(err);
      }
    }

    setConfirmModalInfo(confirmationModalInitialState);
  };

  const renderImportButton = (whatsApp) => {
    if (whatsApp?.statusImportMessages === "renderButtonCloseTickets") {
      return (
        <Button
          style={{ marginLeft: 12 }}
          size="small"
          variant="outlined"
          color="primary"
          onClick={() => {
            handleOpenConfirmationModal("closedImported", whatsApp.id);
          }}
        >
          {i18n.t("connections.buttons.closedImported")}
        </Button>
      );
    }

    if (whatsApp?.importOldMessages) {
      let isTimeStamp = !isNaN(
        new Date(Math.floor(whatsApp?.statusImportMessages)).getTime()
      );

      if (isTimeStamp) {
        const ultimoStatus = new Date(
          Math.floor(whatsApp?.statusImportMessages)
        ).getTime();
        const dataLimite = +add(ultimoStatus, { seconds: +35 }).getTime();
        if (dataLimite > new Date().getTime()) {
          return (
            <>
              <Button
                disabled
                style={{ marginLeft: 12 }}
                size="small"
                endIcon={
                  <CircularProgress
                    size={12}
                    className={classes.buttonProgress}
                  />
                }
                variant="outlined"
                color="primary"
              >
                {i18n.t("connections.buttons.preparing")}
              </Button>
            </>
          );
        }
      }
    }
  };

  const renderActionButtons = (whatsApp) => {
    return (
      <>
        {whatsApp.status === "qrcode" && (
          <Can
            role={
              user.profile === "user" && user.allowConnections === "enabled"
                ? "admin"
                : user.profile
            }
            perform="connections-page:addConnection"
            yes={() => (
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={() => handleOpenQrModal(whatsApp)}
              >
                {i18n.t("connections.buttons.qrcode")}
              </Button>
            )}
          />
        )}
        {whatsApp.status === "DISCONNECTED" && (
          <Can
            role={
              user.profile === "user" && user.allowConnections === "enabled"
                ? "admin"
                : user.profile
            }
            perform="connections-page:addConnection"
            yes={() => (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="primary"
                  onClick={() => handleStartWhatsAppSession(whatsApp.id)}
                >
                  {i18n.t("connections.buttons.tryAgain")}
                </Button>{" "}
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleRequestNewQrCode(whatsApp.id)}
                >
                  {i18n.t("connections.buttons.newQr")}
                </Button>
              </>
            )}
          />
        )}
        {(whatsApp.status === "CONNECTED" ||
          whatsApp.status === "PAIRING" ||
          whatsApp.status === "TIMEOUT") && (
          <Can
            role={user.profile}
            perform="connections-page:addConnection"
            yes={() => (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
                  onClick={() => {
                    handleOpenConfirmationModal("disconnect", whatsApp.id);
                  }}
                >
                  {i18n.t("connections.buttons.disconnect")}
                </Button>

                {renderImportButton(whatsApp)}
              </>
            )}
          />
        )}
        {whatsApp.status === "OPENING" && (
          <Button size="small" variant="outlined" disabled color="default">
            {i18n.t("connections.buttons.connecting")}
          </Button>
        )}
      </>
    );
  };

  const renderStatusToolTips = (whatsApp) => {
    return (
      <div className={classes.customTableCell}>
        {whatsApp.status === "DISCONNECTED" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.disconnected.title")}
            content={i18n.t("connections.toolTips.disconnected.content")}
          >
            <SignalCellularConnectedNoInternet0Bar color="secondary" />
          </CustomToolTip>
        )}
        {whatsApp.status === "OPENING" && (
          <CircularProgress size={24} className={classes.buttonProgress} />
        )}
        {whatsApp.status === "qrcode" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.qrcode.title")}
            content={i18n.t("connections.toolTips.qrcode.content")}
          >
            <CropFree />
          </CustomToolTip>
        )}
        {whatsApp.status === "CONNECTED" && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.connected.title")}
          >
            <SignalCellular4Bar style={{ color: green[500] }} />
          </CustomToolTip>
        )}
        {(whatsApp.status === "TIMEOUT" || whatsApp.status === "PAIRING") && (
          <CustomToolTip
            title={i18n.t("connections.toolTips.timeout.title")}
            content={i18n.t("connections.toolTips.timeout.content")}
          >
            <SignalCellularConnectedNoInternet2Bar color="secondary" />
          </CustomToolTip>
        )}
      </div>
    );
  };

  const restartWhatsapps = async () => {
    try {
      await api.post(`/whatsapp-restart/`);
      toast.success(i18n.t("connections.waitConnection"));
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div className={classes.pageRoot}>
      <ConfirmationModal
        title={confirmModalInfo.title}
        open={confirmModalOpen}
        onClose={setConfirmModalOpen}
        onConfirm={handleSubmitConfirmationModal}
      >
        {confirmModalInfo.message}
      </ConfirmationModal>
      {qrModalOpen && (
        <QrcodeModal
          open={qrModalOpen}
          onClose={handleCloseQrModal}
          whatsAppId={!whatsAppModalOpen && selectedWhatsApp?.id}
        />
      )}
      <WhatsAppModal
        open={whatsAppModalOpen}
        onClose={handleCloseWhatsAppModal}
        whatsAppId={!qrModalOpen && selectedWhatsApp?.id}
      />
      {user.profile === "user" && user.allowConnections === "disabled" ? (
        <ForbiddenPage />
      ) : (
        <>
          <Paper className={classes.pageHeader} elevation={0}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              style={{ gap: 8 }}
            >
              <Box>
                <Typography className={classes.pageHeaderTitle}>
                  {i18n.t("connections.title")}
                </Typography>
                <Typography className={classes.pageHeaderSubtitle}>
                  Gerencie canais conectados, sessões e status em um único painel.
                </Typography>
              </Box>
              <Chip
                className={classes.headerChip}
                label={`${whatsApps.length} conexões`}
              />
            </Box>
          </Paper>

          <Paper className={classes.controlsPaper} variant="outlined">
            <div className={classes.controlsActions}>
              <Button
                className={classes.actionButton}
                variant="contained"
                color="primary"
                onClick={restartWhatsapps}
              >
                {i18n.t("connections.restartConnections")}
              </Button>

              <Button
                className={classes.actionButton}
                variant="contained"
                color="primary"
                onClick={() => openInNewTab(supportWhatsapp)}
              >
                {i18n.t("connections.callSupport")}
              </Button>
              <PopupState variant="popover" popupId="demo-popup-menu">
                {(popupState) => (
                  <React.Fragment>
                    <Can
                      role={user.profile}
                      perform="connections-page:addConnection"
                      yes={() => (
                        <>
                          <Button
                            className={classes.actionButton}
                            variant="contained"
                            color="primary"
                            {...bindTrigger(popupState)}
                          >
                            {i18n.t("connections.newConnection")}
                          </Button>
                          <Menu {...bindMenu(popupState)}>
                            {/* WHATSAPP */}
                            <MenuItem
                              disabled={
                                planConfig?.plan?.useWhatsapp ? false : true
                              }
                              onClick={() => {
                                handleOpenWhatsAppModal();
                                popupState.close();
                              }}
                            >
                              <WhatsApp
                                fontSize="small"
                                style={{
                                  marginRight: "10px",
                                  color: "#25D366",
                                }}
                              />
                              WhatsApp
                            </MenuItem>
                            {/* FACEBOOK */}
                            <FacebookLogin
                              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                              autoLoad={false}
                              fields="name,email,picture"
                              version="9.0"
                              scope={
                                process.env.REACT_APP_REQUIRE_BUSINESS_MANAGEMENT?.toUpperCase() ===
                                "TRUE"
                                  ? "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                                  : "public_profile,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement"
                              }
                              callback={responseFacebook}
                              render={(renderProps) => (
                                <MenuItem
                                  disabled={
                                    planConfig?.plan?.useFacebook
                                      ? false
                                      : true
                                  }
                                  onClick={renderProps.onClick}
                                >
                                  <Facebook
                                    fontSize="small"
                                    style={{
                                      marginRight: "10px",
                                      color: "#3b5998",
                                    }}
                                  />
                                  Facebook
                                </MenuItem>
                              )}
                            />
                            {/* INSTAGRAM */}
                            <FacebookLogin
                              appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                              autoLoad={false}
                              fields="name,email,picture"
                              version="9.0"
                              scope={
                                process.env.REACT_APP_REQUIRE_BUSINESS_MANAGEMENT?.toUpperCase() ===
                                "TRUE"
                                  ? "public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement,business_management"
                                  : "public_profile,instagram_basic,instagram_manage_messages,pages_messaging,pages_show_list,pages_manage_metadata,pages_read_engagement"
                              }
                              callback={responseInstagram}
                              render={(renderProps) => (
                                <MenuItem
                                  disabled={
                                    planConfig?.plan?.useInstagram
                                      ? false
                                      : true
                                  }
                                  onClick={renderProps.onClick}
                                >
                                  <Instagram
                                    fontSize="small"
                                    style={{
                                      marginRight: "10px",
                                      color: "#e1306c",
                                    }}
                                  />
                                  Instagram
                                </MenuItem>
                              )}
                            />
                          </Menu>
                        </>
                      )}
                    />
                  </React.Fragment>
                )}
              </PopupState>
            </div>
          </Paper>

          {statusImport?.all ? (
            <>
              <div>
                <Card className={classes.statusCard}>
                  <CardContent className={classes.statusCardContent}>
                    <Typography className={classes.statusTitle}>
                      {statusImport?.this === -1
                        ? i18n.t("connections.buttons.preparing")
                        : i18n.t("connections.buttons.importing")}
                    </Typography>
                    {statusImport?.this === -1 ? (
                      <Typography className={classes.statusText} align="center">
                        <CircularProgress size={24} />
                      </Typography>
                    ) : (
                      <>
                        <Typography className={classes.statusText} align="center">
                          {`${i18n.t(
                            `connections.typography.processed`
                          )} ${statusImport?.this} ${i18n.t(
                            `connections.typography.in`
                          )} ${statusImport?.all}  ${i18n.t(
                            `connections.typography.date`
                          )}: ${statusImport?.date} `}
                        </Typography>
                        <Typography align="center">
                          <CircularProgressWithLabel
                            style={{ margin: "auto" }}
                            value={
                              (statusImport?.this / statusImport?.all) * 100
                            }
                          />
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          <Paper className={classes.mainPaper} variant="outlined">
                <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    Channel
                  </TableCell>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    {i18n.t("connections.table.name")}
                  </TableCell>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    {i18n.t("connections.table.number")}
                  </TableCell>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    {i18n.t("connections.table.status")}
                  </TableCell>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    {i18n.t("connections.table.session")}
                  </TableCell>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    {i18n.t("connections.table.lastUpdate")}
                  </TableCell>
                  <TableCell className={classes.tableHeaderCell} align="center">
                    {i18n.t("connections.table.default")}
                  </TableCell>
                  <Can
                    role={
                      user.profile === "user" &&
                      user.allowConnections === "enabled"
                        ? "admin"
                        : user.profile
                    }
                    perform="connections-page:addConnection"
                    yes={() => (
                      <TableCell className={classes.tableHeaderCell} align="center">
                        {i18n.t("connections.table.actions")}
                      </TableCell>
                    )}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRowSkeleton />
                ) : (
                  <>
                    {whatsApps?.length > 0 &&
                      whatsApps.map((whatsApp) => (
                        <TableRow key={whatsApp.id}>
                          <TableCell align="center">
                            {IconChannel(whatsApp.channel)}
                          </TableCell>
                          <TableCell className={classes.tableCellText} align="center">
                            {whatsApp.name}
                          </TableCell>
                          <TableCell className={classes.tableCellText} align="center">
                            {whatsApp.number &&
                            whatsApp.channel === "whatsapp" ? (
                              <>{formatSerializedId(whatsApp.number)}</>
                            ) : (
                              whatsApp.number
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {renderStatusToolTips(whatsApp)}
                          </TableCell>
                          <TableCell align="center">
                            {renderActionButtons(whatsApp)}
                          </TableCell>
                          <TableCell className={classes.tableCellText} align="center">
                            {format(
                              parseISO(whatsApp.updatedAt),
                              "dd/MM/yy HH:mm"
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {whatsApp.isDefault && (
                              <div className={classes.customTableCell}>
                                <CheckCircle style={{ color: green[500] }} />
                              </div>
                            )}
                          </TableCell>
                          <Can
                            role={user.profile}
                            perform="connections-page:addConnection"
                            yes={() => (
                              <TableCell align="center">
                                <IconButton
                                  className={classes.actionIconButton}
                                  size="small"
                                  onClick={() =>
                                    handleEditWhatsApp(whatsApp)
                                  }
                                >
                                  <Edit />
                                </IconButton>

                                <IconButton
                                  className={classes.actionIconButton}
                                  size="small"
                                  onClick={(e) => {
                                    handleOpenConfirmationModal(
                                      "delete",
                                      whatsApp.id
                                    );
                                  }}
                                >
                                  <DeleteOutline />
                                </IconButton>
                              </TableCell>
                            )}
                          />
                        </TableRow>
                      ))}
                  </>
                )}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </div>
  );
};

export default Connections;
