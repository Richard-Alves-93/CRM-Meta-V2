import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Typography
} from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import StorageIcon from "@material-ui/icons/Storage";
import MemoryIcon from "@material-ui/icons/Memory";
import AccessTimeIcon from "@material-ui/icons/AccessTime";
import DnsIcon from "@material-ui/icons/Dns";
import CloudQueueIcon from "@material-ui/icons/CloudQueue";
import DeveloperBoardIcon from "@material-ui/icons/DeveloperBoard";
import AutorenewIcon from "@material-ui/icons/Autorenew";

import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import ForbiddenPage from "../../components/ForbiddenPage";
import { AuthContext } from "../../context/Auth/AuthContext";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    background:
      theme.mode === "light"
        ? "linear-gradient(180deg, #f6faff 0%, #eef4ff 100%)"
        : "linear-gradient(180deg, #0b1324 0%, #0f1a30 100%)"
  },
  pageContainer: {
    width: "100%",
    maxWidth: "100%",
    padding: theme.spacing(2),
    height: "calc(100% - 48px)",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1)
    }
  },
  contentWrapper: {
    width: "100%",
    maxWidth: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column"
  },
  pageBody: {
    ...theme.scrollbarStyles,
    overflowY: "auto",
    flex: 1,
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.mode === "light" ? "0 16px 36px rgba(15, 23, 42, 0.08)" : "0 16px 36px rgba(0, 0, 0, 0.35)",
    padding: theme.spacing(2)
  },
  hero: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
    borderRadius: 14,
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.divider}`,
    background:
      theme.mode === "light"
        ? "linear-gradient(120deg, #ffffff 0%, #edf4ff 100%)"
        : "linear-gradient(120deg, #13203a 0%, #172744 100%)"
  },
  subtitle: {
    fontSize: "0.82rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.35)
  },
  heroChip: {
    backgroundColor: theme.mode === "light" ? "#e8f0ff" : "#213b67",
    color: theme.mode === "light" ? "#20437a" : "#cce0ff",
    border: `1px solid ${theme.mode === "light" ? "#cfe0ff" : "#2f548d"}`,
    fontWeight: 700,
    height: 26
  },
  sectionTitle: {
    fontWeight: 700,
    color: theme.palette.text.primary,
    marginBottom: theme.spacing(0.5),
    fontSize: "0.88rem"
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: theme.spacing(0.4, 0),
    borderBottom: `1px dashed ${theme.palette.divider}`,
    "&:last-child": {
      borderBottom: "none"
    }
  },
  rowLabel: {
    color: theme.palette.text.secondary,
    fontSize: "0.74rem"
  },
  rowValue: {
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: "0.76rem",
    textAlign: "right"
  },
  metricValue: {
    fontWeight: 800,
    color: theme.palette.text.primary,
    fontSize: "1.15rem",
    letterSpacing: "-0.02em"
  },
  card: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1.5),
    height: "100%",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)"
  },
}));

const formatBytes = (bytes) => {
  const num = Number(bytes || 0);
  if (!num) return "0 B";

  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(num) / Math.log(1024)), sizes.length - 1);
  const value = num / Math.pow(1024, i);
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const formatSeconds = (seconds) => {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
  return `${minutes}m ${secs}s`;
};

const ServerMetrics = () => {
  const classes = useStyles();
  const theme = useTheme();
  const { user, socket } = useContext(AuthContext); // Injetando socket do contexto

  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (!user?.super) return;

    // Busca inicial via API
    const fetchInitialMetrics = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/server-metrics");
        setMetrics(data);
      } catch (error) {
        toastError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialMetrics();

    // Ouvinte em tempo real via Socket.io
    if (socket) {
      socket.on("server-metrics-update", (data) => {
        setMetrics(data);
      });
    }

    return () => {
      if (socket) {
        socket.off("server-metrics-update");
      }
    };
  }, [user?.super, socket]);

  const statusData = useMemo(() => {
    const redisStatus = metrics?.redis?.status || "offline";
    return {
      server: metrics?.status || "offline",
      redis: redisStatus,
      redisColor: redisStatus === "online" ? "#039855" : redisStatus === "degraded" ? "#f79009" : "#d92d20"
    };
  }, [metrics]);

  if (!user?.super) {
    return <ForbiddenPage />;
  }

  return (
    <div className={classes.root}>
      <Container maxWidth={false} className={classes.pageContainer}>
        <div className={classes.contentWrapper}>
          <MainHeader>
            <Paper elevation={0} className={classes.hero}>
              <Box>
                <Title>Dados do Servidor</Title>
                <Typography className={classes.subtitle}>
                  Monitoramento em tempo real dos recursos da VPS via WebSockets.
                </Typography>
              </Box>
              <Chip
                icon={<AutorenewIcon style={{ fontSize: 16 }} className={loading ? "MuiIcon-spin" : ""} />}
                label={loading ? "Conectando..." : "Tempo Real (2s)"}
                className={classes.heroChip}
              />
            </Paper>
          </MainHeader>

          <Paper className={classes.pageBody} elevation={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={0} className={classes.card}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography className={classes.metricLabel}>Status servidor</Typography>
                    <Avatar className={classes.iconBadge}><StorageIcon fontSize="small" /></Avatar>
                  </Box>
                  <Typography className={classes.metricValue}>{String(statusData.server).toUpperCase()}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={0} className={classes.card}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography className={classes.metricLabel}>Uptime servidor</Typography>
                    <Avatar className={classes.iconBadge}><AccessTimeIcon fontSize="small" /></Avatar>
                  </Box>
                  <Typography className={classes.metricValue}>{formatSeconds(metrics?.uptimeSeconds)}</Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Paper elevation={0} className={classes.card}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography className={classes.metricLabel}>Hora servidor</Typography>
                    <Avatar className={classes.iconBadge}><DnsIcon fontSize="small" /></Avatar>
                  </Box>
                  <Typography className={classes.metricValue}>
                    {metrics?.serverTime ? new Date(metrics.serverTime).toLocaleString("pt-BR") : "-"}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={0} className={classes.card}>
                  <Typography className={classes.sectionTitle}>Informações gerais</Typography>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Hostname</Typography><Typography className={classes.rowValue}>{metrics?.general?.hostname || "-"}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Plataforma</Typography><Typography className={classes.rowValue}>{metrics?.general?.platform || "-"}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Kernel / Release</Typography><Typography className={classes.rowValue}>{metrics?.general?.release || "-"}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Arquitetura</Typography><Typography className={classes.rowValue}>{metrics?.general?.arch || "-"}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Node</Typography><Typography className={classes.rowValue}>{metrics?.general?.nodeVersion || "-"}</Typography></Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={0} className={classes.card}>
                  <Typography className={classes.sectionTitle}>Memória</Typography>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Total</Typography><Typography className={classes.rowValue}>{formatBytes(metrics?.memory?.total)}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Em uso</Typography><Typography className={classes.rowValue}>{formatBytes(metrics?.memory?.used)}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Livre</Typography><Typography className={classes.rowValue}>{formatBytes(metrics?.memory?.free)}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Uso (%)</Typography><Typography className={classes.rowValue}>{Number(metrics?.memory?.usedPercent || 0).toFixed(1)}%</Typography></Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={0} className={classes.card}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography className={classes.sectionTitle}>CPU</Typography>
                    <MemoryIcon style={{ color: theme.palette.primary.main }} />
                  </Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Modelo</Typography><Typography className={classes.rowValue}>{metrics?.cpu?.model || "-"}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Núcleos</Typography><Typography className={classes.rowValue}>{metrics?.cpu?.cores || 0}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Load 1m</Typography><Typography className={classes.rowValue}>{Number(metrics?.cpu?.loadAverage1m || 0).toFixed(2)}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Load 5m</Typography><Typography className={classes.rowValue}>{Number(metrics?.cpu?.loadAverage5m || 0).toFixed(2)}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Load 15m</Typography><Typography className={classes.rowValue}>{Number(metrics?.cpu?.loadAverage15m || 0).toFixed(2)}</Typography></Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper elevation={0} className={classes.card}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography className={classes.sectionTitle}>Disco e Redis</Typography>
                    <DeveloperBoardIcon style={{ color: theme.palette.primary.main }} />
                  </Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Disco (mount)</Typography><Typography className={classes.rowValue}>{metrics?.disk?.mount || "/"}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Disco total</Typography><Typography className={classes.rowValue}>{formatBytes(metrics?.disk?.total)}</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Disco usado</Typography><Typography className={classes.rowValue}>{formatBytes(metrics?.disk?.used)} ({Number(metrics?.disk?.usedPercent || 0).toFixed(0)}%)</Typography></Box>
                  <Box className={classes.row}><Typography className={classes.rowLabel}>Disco livre</Typography><Typography className={classes.rowValue}>{formatBytes(metrics?.disk?.free)}</Typography></Box>
                  <Box className={classes.row}>
                    <Typography className={classes.rowLabel}>Redis status</Typography>
                    <Box display="flex" alignItems="center" style={{ gap: 8 }}>
                      <CloudQueueIcon style={{ color: statusData.redisColor, fontSize: 16 }} />
                      <Typography className={classes.rowValue}>{String(statusData.redis).toUpperCase()}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </div>
      </Container>
    </div>
  );
};

export default ServerMetrics;
