import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography
} from "@mui/material";
import {
  AccessTime,
  AssignmentTurnedIn,
  Autorenew,
  Download,
  HourglassTop,
  InfoOutlined,
  QueryStats
} from "@mui/icons-material";
import { isArray } from "lodash";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { useTheme as useThemeV4 } from "@material-ui/core/styles";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import { AuthContext } from "../../context/Auth/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import ForbiddenPage from "../../components/ForbiddenPage";
import TableAttendantsStatus from "../../components/Dashboard/TableAttendantsStatus";
import { ChatsUser } from "./ChartsUser";
import { ChartsDate } from "./ChartsDate";
import ChartDonut from "./ChartDonut";
import { i18n } from "../../translate/i18n";

const DashboardTab = ({ active, label, onClick }) => (
  <Button
    onClick={onClick}
    disableElevation
    sx={{
      textTransform: "none",
      px: 2,
      py: 0.75,
      borderRadius: 1.4,
      border: "1px solid",
      borderColor: active ? "primary.main" : "#dbe1e8",
      color: active ? "primary.main" : "#64748b",
      backgroundColor: active ? "rgba(37,99,235,0.08)" : "#fff",
      fontWeight: active ? 700 : 600,
      fontSize: 13,
      "&:hover": {
        backgroundColor: active ? "rgba(37,99,235,0.12)" : "#f8fafc",
        borderColor: active ? "primary.main" : "#cbd5e1"
      }
    }}
  >
    {label}
  </Button>
);

const KpiCard = ({ title, value, hint, icon, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.2,
      borderRadius: 1.5,
      border: "1px solid #e7edf3",
      minHeight: 92,
      backgroundColor: "#fff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "translateY(-2px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
      }
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
      <Box>
        <Typography sx={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>{title}</Typography>
        <Typography sx={{ color: "#0f172a", fontSize: 24, lineHeight: 1, mt: 0.2, fontWeight: 800 }}>
          {value}
        </Typography>
      </Box>
      <Avatar sx={{ width: 32, height: 32, backgroundColor: `${color}15`, color }}>{icon}</Avatar>
    </Stack>

    <Stack direction="row" spacing={0.6} alignItems="center" sx={{ mt: 0.8 }}>
      <InfoOutlined sx={{ fontSize: 13, color: "#cbd5e1" }} />
      <Typography sx={{ color: "#94a3b8", fontSize: 10.5, fontWeight: 500 }}>{hint}</Typography>
    </Stack>
  </Paper>
);

const StatusBar = ({ label, value, color, total }) => {
  const safeTotal = total > 0 ? total : 1;
  const width = Math.max(4, Math.round((value / safeTotal) * 100));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>{value}</Typography>
      </Stack>
      <Box sx={{ height: 9, borderRadius: 9, backgroundColor: "#eaf0f6", overflow: "hidden" }}>
        <Box sx={{ width: `${width}%`, height: "100%", borderRadius: 9, backgroundColor: color }} />
      </Box>
    </Box>
  );
};

const InsightDonut = ({ title, data, colors }) => {
  const cleanData = data.filter((item) => Number(item.value) > 0);
  const chartData = cleanData.length > 0 ? cleanData : [{ name: "Sem dados", value: 1, empty: true }];
  const total = data.reduce((acc, item) => acc + Number(item.value || 0), 0);

  return (
    <Paper elevation={0} sx={{ p: 1.4, borderRadius: 1.4, border: "1px solid #edf2f7", height: "100%" }}>
      <Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 700, mb: 1 }}>{title}</Typography>
      <Box sx={{ height: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={68}
              paddingAngle={2}
            >
              {chartData.map((entry, index) => (
                <Cell key={`donut-${entry.name}-${index}`} fill={entry.empty ? "#e2e8f0" : colors[index % colors.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>

      <Stack spacing={0.75} sx={{ mt: 0.4 }}>
        {data.map((item, index) => {
          const value = Number(item.value || 0);
          const percent = total > 0 ? Math.round((value / total) * 100) : 0;
          return (
            <Stack key={`${title}-${item.name}`} direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ minWidth: 0 }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: colors[index % colors.length] }} />
                <Typography sx={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.name}
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 12, color: "#334155", fontWeight: 700 }}>
                {value.toLocaleString("pt-BR")} ({percent}%)
              </Typography>
            </Stack>
          );
        })}
      </Stack>
    </Paper>
  );
};

const Dashboard = () => {
  const themeV4 = useThemeV4();
  const primary = themeV4?.palette?.primary?.main || "#2563eb";

  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [counters, setCounters] = useState({});
  const [attendants, setAttendants] = useState([]);

  const { user, socket } = useContext(AuthContext);
  const { find } = useDashboard();

  const [serverStatus, setServerStatus] = useState("online");

  useEffect(() => {
    if (socket && user?.super) {
      socket.on("server-metrics-update", (data) => {
        if (data?.status) {
          setServerStatus(data.status);
        }
      });
    }
    return () => {
      if (socket) socket.off("server-metrics-update");
    };
  }, [socket, user?.super]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const params = {
          date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
          date_to: new Date().toISOString().slice(0, 10)
        };

        const data = await find(params);
        setCounters(data?.counters || {});
        if (isArray(data?.attendants)) {
          setAttendants(data.attendants);
        }
      } catch {
        toast.error("Nao foi possivel carregar os dados do dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const metrics = useMemo(() => {
    const supportHappening = Number(counters?.supportHappening || 0);
    const supportPending = Number(counters?.supportPending || 0);
    const supportFinished = Number(counters?.supportFinished || 0);

    const totalAttendances = supportHappening + supportPending + supportFinished;

    return {
      supportHappening,
      supportPending,
      supportFinished,
      totalAttendances,
      avgSupportTime: Number(counters?.avgSupportTime || 0),
      avgWaitTime: Number(counters?.avgWaitTime || 0),
      withRating: Number(counters?.withRating || 0),
      withoutRating: Number(counters?.withoutRating || 0),
      waitRating: Number(counters?.waitRating || 0),
      activeTickets: Number(counters?.activeTickets || 0),
      passiveTickets: Number(counters?.passiveTickets || 0),
      supportGroups: Number(counters?.supportGroups || 0),
      leads: Number(counters?.leads || 0),
      npsScore: Number(counters?.npsScore || 0),
      npsPromotersPerc: Number(counters?.npsPromotersPerc || 0),
      npsPassivePerc: Number(counters?.npsPassivePerc || 0),
      npsDetractorsPerc: Number(counters?.npsDetractorsPerc || 0),
      percRating: Math.round(Number(counters?.percRating || 0)),
      waitingRate: totalAttendances > 0 ? Math.round((supportPending / totalAttendances) * 100) : 0,
      finishedRate: totalAttendances > 0 ? Math.round((supportFinished / totalAttendances) * 100) : 0,
      happeningRate: totalAttendances > 0 ? Math.round((supportHappening / totalAttendances) * 100) : 0
    };
  }, [counters]);

  const npsChartData = useMemo(
    () => [
      { name: i18n.t("dashboard.assessments.prosecutors"), value: metrics.npsPromotersPerc },
      { name: i18n.t("dashboard.assessments.neutral"), value: metrics.npsPassivePerc },
      { name: i18n.t("dashboard.assessments.detractors"), value: metrics.npsDetractorsPerc }
    ],
    [metrics.npsDetractorsPerc, metrics.npsPassivePerc, metrics.npsPromotersPerc]
  );

  const ranking = useMemo(() => {
    if (!attendants.length) return [];

    return [...attendants]
      .sort((a, b) => Number(b?.tickets || 0) - Number(a?.tickets || 0))
      .slice(0, 7)
      .map((agent) => ({
        name: agent?.name || "-",
        tickets: Number(agent?.tickets || 0)
      }));
  }, [attendants]);

  const exportToExcel = () => {
    try {
      const table = document.getElementById("grid-attendants");
      if (!table) return;
      const worksheet = XLSX.utils.table_to_sheet(table);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Atendentes");
      XLSX.writeFile(workbook, "dashboard-atendentes.xlsx");
    } catch {
      toast.error("Erro ao exportar a planilha de atendentes.");
    }
  };

  if (user.profile === "user" && user.showDashboard === "disabled") {
    return <ForbiddenPage />;
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100% - 48px)",
        py: { xs: 0.5, md: 1 },
        px: { xs: 0.5, md: 1.5 },
        backgroundColor: "#f4f6f8",
        fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif"
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          mb: 1,
          p: 1.2,
          borderRadius: 1.5,
          color: "#1e2a44",
          background: "linear-gradient(90deg, #EDF4FF 0%, #F8FAFF 100%)",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
          border: "1px solid rgba(37,99,235,0.06)"
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
          <Box>
            <Typography sx={{ fontSize: { xs: 17, md: 19 }, lineHeight: 1, fontWeight: 800, color: "#0f172a" }}>
              {i18n.t("dashboard.title")}
            </Typography>
            <Typography sx={{ mt: 0.2, fontSize: 11.5, color: "rgba(30,42,68,0.7)" }}>
              Visao geral da operacao de atendimento e desempenho da equipe.
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`Periodo: ${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString("pt-BR")} - ${new Date().toLocaleDateString("pt-BR")}`}
            sx={{
              borderRadius: 1,
              color: "#2f4b7c",
              backgroundColor: "#EAF1FF",
              border: "1px solid #d7e5ff",
              fontWeight: 700,
              fontSize: 11
            }}
          />
        </Stack>
      </Paper>

      <Box>
        <Grid container spacing={1.2}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title={i18n.t("dashboard.cards.inAttendance")}
              value={metrics.supportHappening.toLocaleString("pt-BR")}
              hint="Atendimentos em andamento agora"
              icon={<Autorenew sx={{ fontSize: 17 }} />}
              color="#2563eb"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title={i18n.t("dashboard.cards.waiting")}
              value={metrics.supportPending.toLocaleString("pt-BR")}
              hint="Tickets aguardando atendimento"
              icon={<HourglassTop sx={{ fontSize: 17 }} />}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title={i18n.t("dashboard.cards.finalized")}
              value={metrics.supportFinished.toLocaleString("pt-BR")}
              hint="Atendimentos finalizados no periodo"
              icon={<AssignmentTurnedIn sx={{ fontSize: 17 }} />}
              color="#10b981"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title={i18n.t("dashboard.users.totalAttendances")}
              value={metrics.totalAttendances.toLocaleString("pt-BR")}
              hint="Soma real de em andamento + aguardando + finalizados"
              icon={<QueryStats sx={{ fontSize: 17 }} />}
              color="#7c3aed"
            />
          </Grid>
        </Grid>

        <Paper
          elevation={0}
          sx={{
            mt: 1.25,
            borderRadius: 1.8,
            border: "1px solid #e7edf3",
            backgroundColor: "#fff"
          }}
        >
          <Box sx={{ px: 2, py: 1.2 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ xs: "stretch", md: "center" }}>
              <Stack direction="row" spacing={1}>
                <DashboardTab active={tab === "overview"} label={i18n.t("dashboard.tabs.indicators")} onClick={() => setTab("overview")} />
                <DashboardTab active={tab === "nps"} label={i18n.t("dashboard.tabs.assessments")} onClick={() => setTab("nps")} />
                <DashboardTab active={tab === "attendants"} label={i18n.t("dashboard.tabs.attendants")} onClick={() => setTab("attendants")} />
              </Stack>

              <Chip
                label={`Periodo: ${new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString("pt-BR")} - ${new Date().toLocaleDateString("pt-BR")}`}
                size="small"
                sx={{
                  borderRadius: 1,
                  color: primary,
                  backgroundColor: `${primary}14`,
                  fontWeight: 700,
                  maxWidth: "100%",
                  fontSize: 11
                }}
              />
            </Stack>
          </Box>

          <Divider />

          {tab === "overview" && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={8}>
                  <Paper elevation={0} sx={{ p: 1.6, borderRadius: 1.4, border: "1px solid #edf2f7", backgroundColor: "#fcfdff" }}>
                    <Typography sx={{ fontSize: 15, color: "#334155", fontWeight: 700, mb: 1.3 }}>Volume de atendimentos</Typography>
                    <ChartsDate />
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper elevation={0} sx={{ p: 1.6, borderRadius: 1.4, border: "1px solid #edf2f7", mb: 1.2 }}>
                    <Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 700, mb: 1.2 }}>Distribuicao atual</Typography>
                    <Stack spacing={1.05}>
                      <StatusBar label="Em atendimento" value={metrics.supportHappening} color="#2563eb" total={metrics.totalAttendances} />
                      <StatusBar label="Aguardando" value={metrics.supportPending} color="#f59e0b" total={metrics.totalAttendances} />
                      <StatusBar label="Finalizados" value={metrics.supportFinished} color="#10b981" total={metrics.totalAttendances} />
                    </Stack>
                    <Grid container spacing={1} sx={{ mt: 1.25 }}>
                      <Grid item xs={4}>
                        <Paper elevation={0} sx={{ p: 1, borderRadius: 1.2, backgroundColor: "#eff6ff", textAlign: "center" }}>
                          <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Taxa fila</Typography>
                          <Typography sx={{ fontSize: 17, color: "#2563eb", fontWeight: 800, lineHeight: 1.1 }}>
                            {metrics.waitingRate}%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper elevation={0} sx={{ p: 1, borderRadius: 1.2, backgroundColor: "#ecfdf5", textAlign: "center" }}>
                          <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Resolucao</Typography>
                          <Typography sx={{ fontSize: 17, color: "#059669", fontWeight: 800, lineHeight: 1.1 }}>
                            {metrics.finishedRate}%
                          </Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={4}>
                        <Paper elevation={0} sx={{ p: 1, borderRadius: 1.2, backgroundColor: "#fefce8", textAlign: "center" }}>
                          <Typography sx={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Em curso</Typography>
                          <Typography sx={{ fontSize: 17, color: "#ca8a04", fontWeight: 800, lineHeight: 1.1 }}>
                            {metrics.happeningRate}%
                          </Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Paper>

                  <Paper elevation={0} sx={{ p: 1.6, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                    <Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 700, mb: 1.2 }}>Top atendentes</Typography>
                    {ranking.length > 0 ? (
                      <Stack spacing={1.05}>
                        {ranking.map((agent, index) => (
                          <Stack key={`${agent.name}-${index}`} direction="row" justifyContent="space-between" alignItems="center">
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                              <Avatar
                                sx={{
                                  width: 22,
                                  height: 22,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  bgcolor: index < 3 ? "#1e3a8a" : "#dbe7ff",
                                  color: index < 3 ? "#fff" : "#1e3a8a"
                                }}
                              >
                                {index + 1}
                              </Avatar>
                              <Typography sx={{ fontSize: 13, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>
                                {agent.name}
                              </Typography>
                            </Stack>
                            <Typography sx={{ fontSize: 13, color: "#334155", fontWeight: 700 }}>{agent.tickets.toLocaleString("pt-BR")}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    ) : (
                      <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>Sem dados de atendentes para o periodo.</Typography>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              <Grid container spacing={1.2} sx={{ mt: 0.1 }}>
                <Grid item xs={12} md={4}>
                  <InsightDonut
                    title="Status dos atendimentos"
                    data={[
                      { name: "Em atendimento", value: metrics.supportHappening },
                      { name: "Aguardando", value: metrics.supportPending },
                      { name: "Finalizados", value: metrics.supportFinished }
                    ]}
                    colors={["#2563eb", "#f59e0b", "#10b981"]}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InsightDonut
                    title="Origem operacional"
                    data={[
                      { name: "Tickets ativos", value: metrics.activeTickets },
                      { name: "Tickets passivos", value: metrics.passiveTickets },
                      { name: "Grupos", value: metrics.supportGroups }
                    ]}
                    colors={["#7c3aed", "#0ea5e9", "#6366f1"]}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <InsightDonut
                    title="Ciclo de avaliacao"
                    data={[
                      { name: "Com avaliacao", value: metrics.withRating },
                      { name: "Sem avaliacao", value: metrics.withoutRating },
                      { name: "Aguardando NPS", value: metrics.waitRating }
                    ]}
                    colors={["#16a34a", "#ef4444", "#f59e0b"]}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1.2} sx={{ mt: 0.1 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.3, borderRadius: 1.4, border: "1px solid #edf2f7", backgroundColor: "#fff" }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Leads no periodo</Typography>
                    <Typography sx={{ fontSize: 23, color: "#0f172a", fontWeight: 800, mt: 0.2 }}>
                      {metrics.leads.toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.3, borderRadius: 1.4, border: "1px solid #edf2f7", backgroundColor: "#fff" }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Tickets ativos</Typography>
                    <Typography sx={{ fontSize: 23, color: "#0f172a", fontWeight: 800, mt: 0.2 }}>
                      {metrics.activeTickets.toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.3, borderRadius: 1.4, border: "1px solid #edf2f7", backgroundColor: "#fff" }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Tickets passivos</Typography>
                    <Typography sx={{ fontSize: 23, color: "#0f172a", fontWeight: 800, mt: 0.2 }}>
                      {metrics.passiveTickets.toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.3, borderRadius: 1.4, border: "1px solid #edf2f7", backgroundColor: "#fff" }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Atendimentos em grupo</Typography>
                    <Typography sx={{ fontSize: 23, color: "#0f172a", fontWeight: 800, mt: 0.2 }}>
                      {metrics.supportGroups.toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}

          {tab === "nps" && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={1.2}>
                <Grid item xs={12} md={5}>
                  <Paper elevation={0} sx={{ p: 1.6, borderRadius: 1.4, border: "1px solid #edf2f7", height: "100%" }}>
                    <Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 700, mb: 1 }}>NPS geral</Typography>
                    <ChartDonut data={npsChartData} value={Math.round(metrics.npsScore)} colors={["#16a34a", "#eab308", "#ef4444"]} />
                    <Typography sx={{ fontSize: 12, color: "#64748b", textAlign: "center" }}>
                      Indice calculado por promotores - detratores no periodo
                    </Typography>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={7}>
                  <Grid container spacing={1.2}>
                    {[{
                      label: i18n.t("dashboard.assessments.prosecutors"),
                      value: metrics.npsPromotersPerc,
                      color: "#16a34a"
                    }, {
                      label: i18n.t("dashboard.assessments.neutral"),
                      value: metrics.npsPassivePerc,
                      color: "#eab308"
                    }, {
                      label: i18n.t("dashboard.assessments.detractors"),
                      value: metrics.npsDetractorsPerc,
                      color: "#ef4444"
                    }].map((row) => (
                      <Grid item xs={12} sm={4} key={row.label}>
                        <Paper elevation={0} sx={{ p: 1.4, borderRadius: 1.4, border: "1px solid #edf2f7", height: "100%" }}>
                          <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>{row.label}</Typography>
                          <Typography sx={{ fontSize: 26, lineHeight: 1.1, mt: 0.5, color: row.color, fontWeight: 800 }}>
                            {Math.round(row.value)}%
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container spacing={1.2} sx={{ mt: 0.2 }}>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 1.4, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Aguardando avaliacao</Typography>
                        <Typography sx={{ fontSize: 24, lineHeight: 1.1, mt: 0.5, color: "#0f172a", fontWeight: 700 }}>
                          {metrics.waitRating.toLocaleString("pt-BR")}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 1.4, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Com avaliacao</Typography>
                        <Typography sx={{ fontSize: 24, lineHeight: 1.1, mt: 0.5, color: "#0f172a", fontWeight: 700 }}>
                          {metrics.withRating.toLocaleString("pt-BR")}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Paper elevation={0} sx={{ p: 1.4, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Indice de avaliacao</Typography>
                        <Typography sx={{ fontSize: 24, lineHeight: 1.1, mt: 0.5, color: "#0f172a", fontWeight: 700 }}>
                          {metrics.percRating}%
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}

          {tab === "attendants" && (
            <Box sx={{ p: 2 }}>
              <Grid container spacing={1.2} sx={{ mb: 1.2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, backgroundColor: "#dbeafe", color: "#1d4ed8" }}>
                        <AccessTime sx={{ fontSize: 17 }} />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>T.M. espera</Typography>
                        <Typography sx={{ fontSize: 18, color: "#0f172a", fontWeight: 700 }}>
                          {Math.round(metrics.avgWaitTime)} min
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar sx={{ width: 28, height: 28, backgroundColor: "#dcfce7", color: "#15803d" }}>
                        <AccessTime sx={{ fontSize: 17 }} />
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>T.M. atendimento</Typography>
                        <Typography sx={{ fontSize: 18, color: "#0f172a", fontWeight: 700 }}>
                          {Math.round(metrics.avgSupportTime)} min
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Atendentes online</Typography>
                    <Typography sx={{ fontSize: 18, color: "#0f172a", fontWeight: 700, mt: 0.4 }}>
                      {attendants.filter((agent) => agent.online).length.toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper elevation={0} sx={{ p: 1.5, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                    <Typography sx={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Atendentes no periodo</Typography>
                    <Typography sx={{ fontSize: 18, color: "#0f172a", fontWeight: 700, mt: 0.4 }}>
                      {attendants.length.toLocaleString("pt-BR")}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{ p: 1.6, borderRadius: 1.4, border: "1px solid #edf2f7", mb: 1.2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.4 }}>
                  <Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 700 }}>{i18n.t("dashboard.tabs.attendants")}</Typography>
                  <Button
                    size="small"
                    startIcon={<Download sx={{ fontSize: 16 }} />}
                    onClick={exportToExcel}
                    sx={{ textTransform: "none", fontWeight: 700, color: "#334155" }}
                  >
                    Exportar
                  </Button>
                </Stack>
                <div id="grid-attendants">
                  {attendants.length > 0 ? (
                    <TableAttendantsStatus attendants={attendants} loading={loading} />
                  ) : (
                    <Typography sx={{ fontSize: 13, color: "#94a3b8" }}>Sem dados de atendentes para o periodo.</Typography>
                  )}
                </div>
              </Paper>

              <Paper elevation={0} sx={{ p: 1.6, borderRadius: 1.4, border: "1px solid #edf2f7" }}>
                <Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 700, mb: 1.2 }}>{i18n.t("dashboard.charts.userPerformance")}</Typography>
                <ChatsUser />
              </Paper>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default Dashboard;
