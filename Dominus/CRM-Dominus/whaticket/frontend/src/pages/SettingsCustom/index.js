import React, { useState, useEffect, useContext } from "react";
import MainHeader from "../../components/MainHeader";
import Title from "../../components/Title";
import { makeStyles, Paper, Tabs, Tab, Box, Typography, Chip } from "@material-ui/core";

import TabPanel from "../../components/TabPanel";

import SchedulesForm from "../../components/SchedulesForm";
import CompaniesManager from "../../components/CompaniesManager";
import PlansManager from "../../components/PlansManager";
import HelpsManager from "../../components/HelpsManager";
import Options from "../../components/Settings/Options";
import Whitelabel from "../../components/Settings/Whitelabel";

import { i18n } from "../../translate/i18n.js";
import { toast } from "react-toastify";

import useCompanies from "../../hooks/useCompanies";
import { AuthContext } from "../../context/Auth/AuthContext";

import OnlyForSuperUser from "../../components/OnlyForSuperUser";
import useCompanySettings from "../../hooks/useSettings/companySettings";
import useSettings from "../../hooks/useSettings";
import ForbiddenPage from "../../components/ForbiddenPage/index.js";

const useStyles = makeStyles((theme) => ({
  pageRoot: {
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    padding: theme.spacing(2),
    height: "calc(100% - 48px)",
    display: "flex",
    flexDirection: "column",
    background:
      theme.mode === "light"
        ? "linear-gradient(180deg, #f6f9ff 0%, #eef3fb 100%)"
        : "linear-gradient(180deg, #0f1724 0%, #111b2f 100%)",
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1),
    },
  },
  pageWrap: {
    width: "100%",
    maxWidth: "100%",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
  },
  mainPaper: {
    ...theme.scrollbarStyles,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flex: 1,
    minHeight: 0,
    borderRadius: 16,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.mode === "light" ? "0 16px 36px rgba(15, 23, 42, 0.08)" : "0 16px 36px rgba(0, 0, 0, 0.35)",
    padding: theme.spacing(2),
  },
  headerCard: {
    width: "100%",
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.mode === "light" ? "#ffffff" : "#142036",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing(1.5),
    [theme.breakpoints.down("sm")]: {
      flexDirection: "column",
      alignItems: "flex-start",
    },
  },
  headerMeta: {
    fontSize: "0.78rem",
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(0.5),
  },
  topChip: {
    height: 26,
    borderRadius: 8,
    backgroundColor: theme.mode === "light" ? "#e9f0ff" : "#1a2a47",
    color: theme.mode === "light" ? "#26467a" : "#c9d8ff",
    border: `1px solid ${theme.mode === "light" ? "#d4e2ff" : "#30466f"}`,
    fontWeight: 600,
    fontSize: "0.72rem",
  },
  tabsShell: {
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.mode === "light" ? "#f8fbff" : "#122038",
    padding: theme.spacing(0.5),
    marginBottom: theme.spacing(2),
  },
  tabsRoot: {
    ...theme.scrollbarStyles,
    minHeight: 44,
    "& .MuiTabs-indicator": {
      display: "none",
    },
    "& .MuiTab-root": {
      minHeight: 40,
      borderRadius: 10,
      textTransform: "none",
      fontWeight: 600,
      fontSize: "0.8rem",
      color: theme.palette.text.secondary,
      transition: "all 0.2s ease",
      marginRight: theme.spacing(0.5),
    },
    "& .Mui-selected": {
      color: theme.palette.primary.main,
      backgroundColor: theme.mode === "light" ? "#ffffff" : "#1a2a47",
      boxShadow: theme.mode === "light" ? "0 4px 12px rgba(15, 23, 42, 0.08)" : "0 4px 12px rgba(0, 0, 0, 0.3)",
    },
  },
  panelPaper: {
    ...theme.scrollbarStyles,
    overflowY: "auto",
    flex: 1,
    minHeight: 0,
    padding: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.mode === "light" ? "#ffffff" : "#13213a",
    width: "100%",
  },
  container: {
    width: "100%",
    maxHeight: "100%",
  },
  pageTitle: {
    fontWeight: 700,
    letterSpacing: 0.1,
    color: theme.palette.text.primary,
  },
  control: {
    padding: theme.spacing(1),
  },
  textfield: {
    width: "100%",
  },
}));

const SettingsCustom = () => {
  const classes = useStyles();
  const [tab, setTab] = useState("options");
  const [schedules, setSchedules] = useState([]);
  const [company, setCompany] = useState({});
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({});
  const [settings, setSettings] = useState({});
  const [oldSettings, setOldSettings] = useState({});
  const [schedulesEnabled, setSchedulesEnabled] = useState(false);

  const { find, updateSchedules } = useCompanies();

  //novo hook
  const { getAll: getAllSettings } = useCompanySettings();
  const { getAll: getAllSettingsOld } = useSettings();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    async function findData() {
      setLoading(true);
      try {
        const companyId = user.companyId;
        const company = await find(companyId);

        const settingList = await getAllSettings(companyId);

        const settingListOld = await getAllSettingsOld();

        setCompany(company);
        setSchedules(company.schedules);
        setSettings(settingList);
        setOldSettings(settingListOld);

        /*  if (Array.isArray(settingList)) {
           const scheduleType = settingList.find(
             (d) => d.key === "scheduleType"
           );
           if (scheduleType) {
             setSchedulesEnabled(scheduleType.value === "company");
           }
         } */
        setSchedulesEnabled(settingList.scheduleType === "company");
        setCurrentUser(user);
      } catch (e) {
        toast.error(e);
      }
      setLoading(false);
    }
    findData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleSubmitSchedules = async (data) => {
    setLoading(true);
    try {
      setSchedules(data);
      await updateSchedules({ id: company.id, schedules: data });
      toast.success("Horários atualizados com sucesso.");
    } catch (e) {
      toast.error(e);
    }
    setLoading(false);
  };

  const isSuper = () => {
    return currentUser.super;
  };

  return (
    <div className={classes.pageRoot}>
      {user.profile === "user" ?
        <ForbiddenPage />
        :
        <div className={classes.pageWrap}>
          <MainHeader>
            <Paper elevation={0} className={classes.headerCard}>
              <Box>
                <Title className={classes.pageTitle}>{i18n.t("settings.title")}</Title>
                <Typography className={classes.headerMeta}>
                  Centralize preferências operacionais, automações e identidade visual da sua conta.
                </Typography>
              </Box>
              <Chip
                label={isSuper() ? "Modo super admin" : "Configurações da empresa"}
                className={classes.topChip}
              />
            </Paper>
          </MainHeader>
          <Paper className={classes.mainPaper} elevation={0}>
            <Paper elevation={0} className={classes.tabsShell}>
              <Tabs
                value={tab}
                scrollButtons="on"
                variant="scrollable"
                onChange={handleTabChange}
                className={classes.tabsRoot}
              >
                <Tab label={i18n.t("settings.tabs.options")} value={"options"} />
                {schedulesEnabled && <Tab label="Horários" value={"schedules"} />}
                {isSuper() ? <Tab label="Empresas" value={"companies"} /> : null}
                {isSuper() ? <Tab label={i18n.t("settings.tabs.plans")} value={"plans"} /> : null}
                {isSuper() ? <Tab label={i18n.t("settings.tabs.helps")} value={"helps"} /> : null}
                {isSuper() ? <Tab label="Whitelabel" value={"whitelabel"} /> : null}
              </Tabs>
            </Paper>
            <Paper className={classes.panelPaper} elevation={0}>
              <TabPanel
                className={classes.container}
                value={tab}
                name={"schedules"}
              >
                <SchedulesForm
                  loading={loading}
                  onSubmit={handleSubmitSchedules}
                  initialValues={schedules}
                />
              </TabPanel>
              <OnlyForSuperUser
                user={currentUser}
                yes={() => (
                  <>
                    <TabPanel
                      className={classes.container}
                      value={tab}
                      name={"companies"}
                    >
                      <CompaniesManager />
                    </TabPanel>

                    <TabPanel
                      className={classes.container}
                      value={tab}
                      name={"plans"}
                    >
                      <PlansManager />
                    </TabPanel>

                    <TabPanel
                      className={classes.container}
                      value={tab}
                      name={"helps"}
                    >
                      <HelpsManager />
                    </TabPanel>
                    <TabPanel
                      className={classes.container}
                      value={tab}
                      name={"whitelabel"}
                    >
                      <Whitelabel
                        settings={oldSettings}
                      />
                    </TabPanel>
                  </>
                )}
              />
              <TabPanel className={classes.container} value={tab} name={"options"}>
                <Options
                  settings={settings}
                  oldSettings={oldSettings}
                  user={currentUser}
                  scheduleTypeChanged={(value) =>
                    setSchedulesEnabled(value === "company")
                  }
                />
              </TabPanel>
            </Paper>
          </Paper>
        </div>}
    </div>
  );
};

export default SettingsCustom;
