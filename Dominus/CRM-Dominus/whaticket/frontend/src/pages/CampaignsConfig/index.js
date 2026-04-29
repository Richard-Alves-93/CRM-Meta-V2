import React, { useEffect, useState, useContext } from "react";
import { useHistory } from "react-router-dom";
import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import { toast } from "react-toastify";

import MainHeader from "../../components/MainHeader";
import api from "../../services/api";
import usePlans from "../../hooks/usePlans";
import { i18n } from "../../translate/i18n";
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Chip,
} from "@material-ui/core";
import ForbiddenPage from "../../components/ForbiddenPage";
import TuneIcon from "@material-ui/icons/Tune";

import { AuthContext } from "../../context/Auth/AuthContext";

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
  mainPaper: {
    flex: 1,
    padding: theme.spacing(1.25),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  textRight: {
    textAlign: "right",
  },
  sectionTitle: {
    fontSize: "0.86rem",
    fontWeight: 600,
    color: theme.palette.text.secondary,
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.75rem",
    padding: theme.spacing(0.8, 1.4),
    boxShadow: "0 6px 14px rgba(7, 64, 171, 0.14)",
  },
  tabPanelsContainer: {
    padding: theme.spacing(0.5),
  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
  },

}));

const initialSettings = {
  messageInterval: 20,
  longerIntervalAfter: 20,
  greaterInterval: 60,
  variables: [],
  sabado: "false",
  domingo: "false",
  startHour: "09:00",
  endHour: "18:00"
};

const CampaignsConfig = () => {
  const classes = useStyles();
  const history = useHistory();

  const [settings, setSettings] = useState(initialSettings);
  const { user } = useContext(AuthContext);

  const { getPlanCompany } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const companyId = user.companyId;
      const planConfigs = await getPlanCompany(undefined, companyId);
      if (!planConfigs.plan.useCampaigns) {
        toast.error("Esta empresa não possui permissão para acessar essa página! Estamos lhe redirecionando.");
        setTimeout(() => {
          history.push(`/`)
        }, 1000);
      }
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    api.get("/campaign-settings").then(({ data }) => {
      const settingsList = [];
      console.log(data)
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          settingsList.push([item.key, item.value]);
        });
        setSettings(Object.fromEntries(settingsList));
      }
    });
  }, []);

  const handleOnChangeSettings = (e) => {
    const changedProp = {};
    changedProp[e.target.name] = e.target.value;
    setSettings((prev) => ({ ...prev, ...changedProp }));
  };

  const saveSettings = async () => {
    await api.post("/campaign-settings", { settings });
    toast.success("Configurações salvas");
  };

  return (
    <div className={classes.pageRoot}>
      {
        user.profile === "user" ?
          <ForbiddenPage />
          :
          <>
            <MainHeader>
              <Grid style={{ width: "100%" }} container>
                <Grid item xs={12}>
                  <Paper elevation={0} className={classes.pageHeader}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Typography className={classes.pageHeaderTitle}>
                          {i18n.t("campaignsConfig.title")}
                        </Typography>
                        <Typography className={classes.pageHeaderSubtitle}>
                          Ajuste intervalos e regras de envio para melhorar performance de campanhas.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                        <Chip
                          icon={<TuneIcon style={{ color: "#2f4b7c", fontSize: 14 }} />}
                          label="Parâmetros de disparo"
                          className={classes.headerChip}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </MainHeader>

            <Paper className={classes.mainPaper} variant="outlined">

              {/* <Typography component={"h1"}>Período de Disparo das Campanhas &nbsp;</Typography>
        <Paper className={classes.paper}>
          <TextField
            id="buttonText"
            label="Começar o envio que hora?"
            margin="dense"
            variant="outlined"
            fullWidth
            value={startHour}
            onChange={(e) => setStartHour(e.target.value)}
            style={{ marginRight: "10px" }}
          />

          <TextField
            id="buttonText"
            label="Terminar o envio que hora?"
            margin="dense"
            variant="outlined"
            fullWidth
            value={endHour}
            onChange={(e) => setEndHour(e.target.value)}
            style={{ marginRight: "10px" }}
          />

          <FormControlLabel
            control={<Checkbox checked={sabado} onChange={handleChange} name="sabado" />}
            label="Sábado"
          />

          <FormControlLabel
            control={<Checkbox checked={domingo} onChange={handleChange} name="domingo" />}
            label="Domigo"
          />

          <Button
            variant="contained"
            color="primary"
            className={classes.button}
            onClick={() => {
              handleSaveTimeMass();
            }}
            style={{ marginRight: "10px" }}
          >
            Salvar
          </Button>

        </Paper> */}

              <Box className={classes.tabPanelsContainer}>
                <Grid spacing={1} container>
                  <Grid xs={12} item>
                    <Typography component={"h1"} className={classes.sectionTitle}>Intervalos</Typography>
                  </Grid>

                  {/* TEMPO ENTRE DISPAROS */}
                  {/* <Grid xs={12} md={3} item>
              <FormControl
                variant="outlined"
                className={classes.formControl}
                fullWidth
              >
                <InputLabel id="messageInterval-label">
                  Tempo entre Disparos
                </InputLabel>
                <Select
                  name="messageInterval"
                  id="messageInterval"
                  labelId="messageInterval-label"
                  label="Intervalo Randômico de Disparo"
                  value={settings.messageInterval}
                  onChange={(e) => handleOnChangeSettings(e)}
                >
                  <MenuItem value={0}>Sem Intervalo</MenuItem>
                  <MenuItem value={5}>5 segundos</MenuItem>
                  <MenuItem value={10}>10 segundos</MenuItem>
                  <MenuItem value={15}>15 segundos</MenuItem>
                  <MenuItem value={20}>20 segundos</MenuItem>
                </Select>
              </FormControl>
            </Grid> */}

                  <Grid xs={12} md={3} item>
                    <FormControl
                      variant="outlined"
                      className={classes.formControl}
                      fullWidth
                    >
                      <InputLabel id="messageInterval-label">
                        {i18n.t("campaigns.settings.randomInterval")}
                      </InputLabel>
                      <Select
                        name="messageInterval"
                        id="messageInterval"
                        labelId="messageInterval-label"
                        label={i18n.t("campaigns.settings.randomInterval")}
                        value={settings.messageInterval}
                        onChange={(e) => handleOnChangeSettings(e)}
                      >
                        <MenuItem value={0}>{i18n.t("campaigns.settings.noBreak")}</MenuItem>
                        <MenuItem value={5}>5 segundos</MenuItem>
                        <MenuItem value={10}>10 segundos</MenuItem>
                        <MenuItem value={15}>15 segundos</MenuItem>
                        <MenuItem value={20}>20 segundos</MenuItem>
                        <MenuItem value={30}>30 segundos</MenuItem>
                        <MenuItem value={60}>40 segundos</MenuItem>
                        <MenuItem value={70}>60 segundos</MenuItem>
                        <MenuItem value={80}>80 segundos</MenuItem>
                        <MenuItem value={100}>100 segundos</MenuItem>
                        <MenuItem value={120}>120 segundos</MenuItem>                                                `` ``
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={3} item>
                    <FormControl
                      variant="outlined"
                      className={classes.formControl}
                      fullWidth
                    >
                      <InputLabel id="longerIntervalAfter-label">
                        {i18n.t("campaigns.settings.intervalGapAfter")}
                      </InputLabel>
                      <Select
                        name="longerIntervalAfter"
                        id="longerIntervalAfter"
                        labelId="longerIntervalAfter-label"
                        label={i18n.t("campaigns.settings.intervalGapAfter")}
                        value={settings.longerIntervalAfter}
                        onChange={(e) => handleOnChangeSettings(e)}
                      >
                        <MenuItem value={0}>{i18n.t("campaigns.settings.undefined")}</MenuItem>
                        <MenuItem value={5}>5 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={10}>10 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={15}>15 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={20}>20 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={30}>30 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={40}>40 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={50}>50 {i18n.t("campaigns.settings.messages")}</MenuItem>
                        <MenuItem value={60}>60 {i18n.t("campaigns.settings.messages")}</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={3} item>
                    <FormControl
                      variant="outlined"
                      className={classes.formControl}
                      fullWidth
                    >
                      <InputLabel id="greaterInterval-label">
                        {i18n.t("campaigns.settings.laggerTriggerRange")}
                      </InputLabel>
                      <Select
                        name="greaterInterval"
                        id="greaterInterval"
                        labelId="greaterInterval-label"
                        label={i18n.t("campaigns.settings.laggerTriggerRange")}
                        value={settings.greaterInterval}
                        onChange={(e) => handleOnChangeSettings(e)}
                      >
                        <MenuItem value={0}>{i18n.t("campaigns.settings.noBreak")}</MenuItem>
                        <MenuItem value={20}>20 segundos</MenuItem>
                        <MenuItem value={30}>30 segundos</MenuItem>
                        <MenuItem value={40}>40 segundos</MenuItem>
                        <MenuItem value={50}>50 segundos</MenuItem>
                        <MenuItem value={60}>60 segundos</MenuItem>
                        <MenuItem value={70}>70 segundos</MenuItem>
                        <MenuItem value={80}>80 segundos</MenuItem>
                        <MenuItem value={90}>90 segundos</MenuItem>
                        <MenuItem value={100}>100 segundos</MenuItem>
                        <MenuItem value={110}>110 segundos</MenuItem>
                        <MenuItem value={120}>120 segundos</MenuItem>
                        <MenuItem value={130}>130 segundos</MenuItem>
                        <MenuItem value={140}>140 segundos</MenuItem>
                        <MenuItem value={150}>150 segundos</MenuItem>
                        <MenuItem value={160}>160 segundos</MenuItem>
                        <MenuItem value={170}>170 segundos</MenuItem>
                        <MenuItem value={180}>180 segundos</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} className={classes.textRight} item>
                    {/* <Button
                onClick={() => setShowVariablesForm(!showVariablesForm)}
                color="primary"
                style={{ marginRight: 10 }}
              >
                {i18n.t("campaigns.settings.addVar")}
              </Button> */}
                    <Button
                      onClick={saveSettings}
                      color="primary"
                      variant="contained"
                      className={classes.actionButton}
                    >
                      {i18n.t("campaigns.settings.save")}
                    </Button>
                  </Grid>
                  {/* {showVariablesForm && (
              <>
                <Grid xs={12} md={6} item>
                  <TextField
                    label={i18n.t("campaigns.settings.shortcut")}
                    variant="outlined"
                    value={variable.key}
                    name="key"
                    onChange={handleOnChangeVariable}
                    fullWidth
                  />
                </Grid>
                <Grid xs={12} md={6} item>
                  <TextField
                    label={i18n.t("campaigns.settings.content")}
                    variant="outlined"
                    value={variable.value}
                    name="value"
                    onChange={handleOnChangeVariable}
                    fullWidth
                  />
                </Grid>
                <Grid xs={12} className={classes.textRight} item>
                  <Button
                    onClick={() => setShowVariablesForm(!showVariablesForm)}
                    color="primary"
                    style={{ marginRight: 10 }}
                  >
                    {i18n.t("campaigns.settings.close")}
                  </Button>
                  <Button
                    onClick={addVariable}
                    color="primary"
                    variant="contained"
                  >
                    {i18n.t("campaigns.settings.add")}
                  </Button>
                </Grid>
              </>
            )}
            {settings.variables.length > 0 && (
              <Grid xs={12} className={classes.textRight} item>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell style={{ width: "1%" }}></TableCell>
                      <TableCell>{i18n.t("campaigns.settings.shortcut")}
                      </TableCell>
                      <TableCell>{i18n.t("campaigns.settings.content")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(settings.variables) &&
                      settings.variables.map((v, k) => (
                        <TableRow key={k}>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedKey(v.key);
                                setConfirmationOpen(true);
                              }}
                            >
                              <DeleteOutlineIcon />
                            </IconButton>
                          </TableCell>
                          <TableCell>{"{" + v.key + "}"}</TableCell>
                          <TableCell>{v.value}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Grid>
            )} */}
                </Grid>
              </Box>
            </Paper>
          </>}
    </div>
  );
};

export default CampaignsConfig;
