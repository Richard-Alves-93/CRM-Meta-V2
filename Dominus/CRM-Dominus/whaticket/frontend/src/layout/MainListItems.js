import React, { useContext, useEffect, useReducer, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import useHelps from "../hooks/useHelps";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListSubheader from "@material-ui/core/ListSubheader";
import Divider from "@material-ui/core/Divider";
import Avatar from "@material-ui/core/Avatar";
import Badge from "@material-ui/core/Badge";
import Collapse from "@material-ui/core/Collapse";
import List from "@material-ui/core/List";
import Tooltip from "@material-ui/core/Tooltip";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import Chip from "@material-ui/core/Chip";

import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import DashboardOutlinedIcon from "@material-ui/icons/DashboardOutlined";
import SettingsOutlinedIcon from "@material-ui/icons/SettingsOutlined";
import PeopleAltOutlinedIcon from "@material-ui/icons/PeopleAltOutlined";
import ContactPhoneOutlinedIcon from "@material-ui/icons/ContactPhoneOutlined";
import AccountTreeOutlinedIcon from "@material-ui/icons/AccountTreeOutlined";
import FlashOnIcon from "@material-ui/icons/FlashOn";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import CodeRoundedIcon from "@material-ui/icons/CodeRounded";
import ViewKanban from "@mui/icons-material/ViewKanban";
import Schedule from "@material-ui/icons/Schedule";
import LocalOfferIcon from "@material-ui/icons/LocalOffer";
import EventAvailableIcon from "@material-ui/icons/EventAvailable";
import RouterIcon from "@material-ui/icons/Router";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import PeopleIcon from "@material-ui/icons/People";
import ListIcon from "@material-ui/icons/ListAlt";
import AnnouncementIcon from "@material-ui/icons/Announcement";
import ForumIcon from "@material-ui/icons/Forum";
import LocalAtmIcon from "@material-ui/icons/LocalAtm";
import {
  AllInclusive,
  AttachFile,
  Dashboard,
  Description,
  DeviceHubOutlined,
  SettingsApplications
} from "@material-ui/icons";

// NOVO ÍCONE PARA CONEXÕES
import SignalCellularConnectedNoInternet4BarIcon from "@material-ui/icons/SignalCellularConnectedNoInternet4Bar";

import { WhatsAppsContext } from "../context/WhatsApp/WhatsAppsContext";
import { AuthContext } from "../context/Auth/AuthContext";
import { useActiveMenu } from "../context/ActiveMenuContext";

import { Can } from "../components/Can";

import { isArray } from "lodash";
import api from "../services/api";
import toastError from "../errors/toastError";
import usePlans from "../hooks/usePlans";
import useVersion from "../hooks/useVersion";
import { i18n } from "../translate/i18n";
import { ShapeLine, Webhook } from "@mui/icons-material";

const iconStyles = new Proxy({
  default: { color: "rgba(255, 255, 255, 0.7)", activeColor: "#ffffff", gradient: "rgba(255, 255, 255, 0.15)" }
}, {
  get: (target, name) => target[name] || target.default
});

const useStyles = makeStyles((theme) => ({
  menuRoot: {
    padding: "8px 10px 12px",
  },
  listItem: {
    height: 40,
    marginBottom: 4,
    borderRadius: 8,
    paddingLeft: 10,
    paddingRight: 10,
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: "rgba(255, 255, 255, 0.05)",
      transform: "translateX(2px)",
    },
  },
  listItemIconOnly: {
    justifyContent: "center",
    paddingLeft: 4,
    paddingRight: 4,
  },
  listItemCompact: {
    height: 36,
    marginBottom: 2,
    marginLeft: 8,
    marginRight: 8,
    paddingLeft: 8,
  },
  listItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    "& $listItemLabel": {
      fontWeight: 700,
      color: "#ffffff",
    },
  },
  listItemIcon: {
    minWidth: 42,
  },
  listItemIconOnlyWrap: {
    minWidth: "auto",
    margin: 0,
  },
  listItemText: {
    margin: 0,
  },
  listItemLabel: {
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: "0.01em",
    color: "rgba(255, 255, 255, 0.75)",
    lineHeight: 1.15,
  },
  sectionDivider: {
    margin: "12px 4px 8px",
    opacity: theme.mode === "light" ? 0.55 : 0.35,
  },
  listSubheader: {
    marginBottom: 6,
    paddingLeft: 14,
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "rgba(255, 255, 255, 0.5)",
    lineHeight: "20px",
    background: "transparent",
  },
  iconHoverActive: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    height: 30,
    width: 30,
    transition: "all 0.2s ease",
    "& .MuiSvgIcon-root": {
      fontSize: "1.15rem",
    },
  },
  submenuSection: {
    margin: "2px 0 8px",
    padding: "6px 0",
    borderRadius: 8,
    background: "rgba(0, 0, 0, 0.15)",
  },
  groupExpandIcon: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: "1.05rem",
  },
  versionWrap: {
    padding: "12px 14px 8px",
    textAlign: "center",
  },
  versionChip: {
    background:
      "linear-gradient(135deg, rgba(21,94,239,0.18) 0%, rgba(14,147,132,0.24) 100%)",
    border:
      theme.mode === "light"
        ? "1px solid rgba(21, 94, 239, 0.18)"
        : "1px solid rgba(125, 211, 252, 0.2)",
    color: theme.mode === "light" ? "#1d2939" : "#e2e8f0",
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.04em",
  },
}));

function ListItemLink(props) {
  const { icon, primary, to, tooltip, showBadge, iconKey, small } = props;
  const classes = useStyles();
  const theme = useTheme();
  const { activeMenu } = useActiveMenu();
  const location = useLocation();
  const isActive = activeMenu === to || location.pathname === to;

  const renderLink = React.useMemo(
    () =>
      React.forwardRef((itemProps, ref) => (
        <RouterLink to={to} ref={ref} {...itemProps} />
      )),
    [to]
  );

  const iconStyle = iconStyles[iconKey] || iconStyles.default;
  const isIconOnly = !!tooltip;
  const iconSurfaceStyle = isActive
    ? {
        color: "#ffffff",
        background: "rgba(255, 255, 255, 0.15)",
        boxShadow: "none",
      }
    : {
        color: "rgba(255, 255, 255, 0.55)",
        background: "transparent",
        border: "none",
      };

  const ConditionalTooltip = ({ children, tooltipEnabled }) =>
    tooltipEnabled ? (
      <Tooltip
        placement="right"
        arrow
        title={
          <Typography style={{ fontWeight: 700, fontSize: "0.9rem" }}>
            {primary}
          </Typography>
        }
      >
        {children}
      </Tooltip>
    ) : (
      children
    );

  return (
    <ConditionalTooltip tooltipEnabled={!!tooltip}>
      <li>
        <ListItem
          button
          component={renderLink}
          className={`${classes.listItem} ${
            isActive ? classes.listItemActive : ""
          } ${small ? classes.listItemCompact : ""} ${
            isIconOnly ? classes.listItemIconOnly : ""
          }`}
        >
          {icon ? (
            <ListItemIcon
              className={`${classes.listItemIcon} ${
                isIconOnly ? classes.listItemIconOnlyWrap : ""
              }`}
            >
              {showBadge ? (
                <Badge
                  badgeContent="!"
                  color="error"
                  overlap="circular"
                  className={classes.badge}
                >
                  <Avatar
                    variant="rounded"
                    className={classes.iconHoverActive}
                    style={iconSurfaceStyle}
                  >
                    {icon}
                  </Avatar>
                </Badge>
              ) : (
                <Avatar
                  variant="rounded"
                  className={classes.iconHoverActive}
                  style={iconSurfaceStyle}
                >
                  {icon}
                </Avatar>
              )}
            </ListItemIcon>
          ) : null}
          {!isIconOnly && (
            <ListItemText
              className={classes.listItemText}
              primary={
                <Typography className={classes.listItemLabel}>
                  {primary}
                </Typography>
              }
            />
          )}
        </ListItem>
      </li>
    </ConditionalTooltip>
  );
}

const reducer = (state, action) => {
  if (action.type === "LOAD_CHATS") {
    const chats = action.payload;
    const newChats = [];

    if (isArray(chats)) {
      chats.forEach((chat) => {
        const chatIndex = state.findIndex((u) => u.id === chat.id);
        if (chatIndex !== -1) {
          state[chatIndex] = chat;
        } else {
          newChats.push(chat);
        }
      });
    }

    return [...state, ...newChats];
  }

  if (action.type === "UPDATE_CHATS") {
    const chat = action.payload;
    const chatIndex = state.findIndex((u) => u.id === chat.id);

    if (chatIndex !== -1) {
      state[chatIndex] = chat;
      return [...state];
    } else {
      return [chat, ...state];
    }
  }

  if (action.type === "DELETE_CHAT") {
    const chatId = action.payload;

    const chatIndex = state.findIndex((u) => u.id === chatId);
    if (chatIndex !== -1) {
      state.splice(chatIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }

  if (action.type === "CHANGE_CHAT") {
    const changedChats = state.map((chat) => {
      if (chat.id === action.payload.chat.id) {
        return action.payload.chat;
      }
      return chat;
    });
    return changedChats;
  }
};

const MainListItems = ({ collapsed, drawerClose }) => {
  const theme = useTheme();
  const classes = useStyles();
  const { whatsApps } = useContext(WhatsAppsContext);
  const { user, socket } = useContext(AuthContext);
  const { setActiveMenu } = useActiveMenu();
  const location = useLocation();

  const [connectionWarning, setConnectionWarning] = useState(false);
  const [openCampaignSubmenu, setOpenCampaignSubmenu] = useState(false);
  const [openFlowSubmenu, setOpenFlowSubmenu] = useState(false);
  const [openDashboardSubmenu, setOpenDashboardSubmenu] = useState(false);
  const [showCampaigns, setShowCampaigns] = useState(false);
  const [showKanban, setShowKanban] = useState(false);
  const [showOpenAi, setShowOpenAi] = useState(false);
  const [showIntegrations, setShowIntegrations] = useState(false);

  const [showSchedules, setShowSchedules] = useState(false);
  const [showInternalChat, setShowInternalChat] = useState(false);
  const [showExternalApi, setShowExternalApi] = useState(false);

  const [invisible, setInvisible] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam] = useState("");
  const [chats, dispatch] = useReducer(reducer, []);
  const [, setVersion] = useState(false);
  const [managementHover, setManagementHover] = useState(false);
  const [campaignHover, setCampaignHover] = useState(false);
  const [flowHover, setFlowHover] = useState(false);
  const { list } = useHelps();
  const [hasHelps, setHasHelps] = useState(false);

  useEffect(() => {
    async function checkHelps() {
      try {
        const helps = await list();
        setHasHelps(helps.length > 0);
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error("Erro ao carregar helps", error);
        }
      }
    }
    checkHelps();
  }, []);

  const isManagementActive =
    location.pathname === "/" ||
    location.pathname.startsWith("/reports") ||
    location.pathname.startsWith("/moments") ||
    location.pathname.startsWith("/server-metrics");

  const isCampaignRouteActive =
    location.pathname === "/campaigns" ||
    location.pathname.startsWith("/contact-lists") ||
    location.pathname.startsWith("/campaigns-config");

  const isFlowbuilderRouteActive =
    location.pathname.startsWith("/phrase-lists") ||
    location.pathname.startsWith("/flowbuilders");
  const inactiveIconSurface = {
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
  };

  useEffect(() => {
    if (location.pathname.startsWith("/tickets")) {
      setActiveMenu("/tickets");
    } else {
      setActiveMenu("");
    }
  }, [location, setActiveMenu]);

  const { getPlanCompany } = usePlans();

  const { getVersion } = useVersion();

  useEffect(() => {
    async function fetchVersion() {
      try {
        const _version = await getVersion();
        setVersion(_version.version);
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error("Erro ao carregar versão", error);
        }
      }
    }
    fetchVersion();
  }, []);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    async function fetchData() {
      try {
        const companyId = user.companyId;
        const planConfigs = await getPlanCompany(undefined, companyId);

        setShowCampaigns(planConfigs.plan.useCampaigns);
        setShowKanban(planConfigs.plan.useKanban);
        setShowOpenAi(planConfigs.plan.useOpenAi);
        setShowIntegrations(planConfigs.plan.useIntegrations);
        setShowSchedules(planConfigs.plan.useSchedules);
        setShowInternalChat(planConfigs.plan.useInternalChat);
        setShowExternalApi(planConfigs.plan.useExternalApi);
      } catch (error) {
        if (error?.response?.status !== 401) {
          console.error("Erro ao carregar plano", error);
        }
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchChats();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber]);

  useEffect(() => {
    if (user.id) {
      const companyId = user.companyId;
      const onCompanyChatMainListItems = (data) => {
        if (data.action === "new-message") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
        if (data.action === "update") {
          dispatch({ type: "CHANGE_CHAT", payload: data });
        }
      };

      socket.on(`company-${companyId}-chat`, onCompanyChatMainListItems);
      return () => {
        socket.off(`company-${companyId}-chat`, onCompanyChatMainListItems);
      };
    }
  }, [socket]);

  useEffect(() => {
    let unreadsCount = 0;
    if (chats.length > 0) {
      for (let chat of chats) {
        for (let chatUser of chat.users) {
          if (chatUser.userId === user.id) {
            unreadsCount += chatUser.unreads;
          }
        }
      }
    }
    if (unreadsCount > 0) {
      setInvisible(false);
    } else {
      setInvisible(true);
    }
  }, [chats, user.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (whatsApps.length > 0) {
        const offlineWhats = whatsApps.filter((whats) => {
          return (
            whats.status === "qrcode" ||
            whats.status === "PAIRING" ||
            whats.status === "DISCONNECTED" ||
            whats.status === "TIMEOUT" ||
            whats.status === "OPENING"
          );
        });
        if (offlineWhats.length > 0) {
          setConnectionWarning(true);
        } else {
          setConnectionWarning(false);
        }
      }
    }, 2000);
    return () => clearTimeout(delayDebounceFn);
  }, [whatsApps]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get("/chats/", {
        params: { searchParam, pageNumber },
      });
      dispatch({ type: "LOAD_CHATS", payload: data.records });
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <div onClick={drawerClose} className={classes.menuRoot}>
      <Can
        role={
          (user.profile === "user" && user.showDashboard === "enabled") ||
          user.allowRealTime === "enabled"
            ? "admin"
            : user.profile
        }
        perform={"drawer-admin-items:view"}
        yes={() => (
          <>
            <Tooltip
              placement="right"
              arrow
              title={
                collapsed ? (
                  <Typography
                    style={{ fontWeight: 700, fontSize: "0.9rem" }}
                  >
                    {i18n.t("mainDrawer.listItems.management")}
                  </Typography>
                ) : (
                  ""
                )
              }
            >
              <ListItem
                dense
                button
                className={`${classes.listItem} ${
                  isManagementActive ? classes.listItemActive : ""
                } ${collapsed ? classes.listItemIconOnly : ""}`}
                onClick={() =>
                  setOpenDashboardSubmenu((prev) => !prev)
                }
                onMouseEnter={() => setManagementHover(true)}
                onMouseLeave={() => setManagementHover(false)}
              >
                <ListItemIcon
                  className={`${classes.listItemIcon} ${
                    collapsed ? classes.listItemIconOnlyWrap : ""
                  }`}
                >
                  <Avatar
                    variant="rounded"
                    className={classes.iconHoverActive}
                    style={
                      isManagementActive || managementHover
                        ? {
                            color: "#ffffff",
                            background: iconStyles.dashboard.gradient,
                            boxShadow:
                              "0 8px 16px -12px rgba(15, 23, 42, 0.65)",
                          }
                        : {
                            color: iconStyles.dashboard.color,
                            ...inactiveIconSurface,
                          }
                    }
                  >
                    <Dashboard />
                  </Avatar>
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    className={classes.listItemText}
                    primary={
                      <Typography className={classes.listItemLabel}>
                        {i18n.t("mainDrawer.listItems.management")}
                      </Typography>
                    }
                  />
                )}
                {!collapsed &&
                  (openDashboardSubmenu ? (
                    <ExpandLessIcon className={classes.groupExpandIcon} />
                  ) : (
                    <ExpandMoreIcon className={classes.groupExpandIcon} />
                  ))}
              </ListItem>
            </Tooltip>
            <Collapse
              in={!collapsed && openDashboardSubmenu}
              timeout="auto"
              unmountOnExit
              className={classes.submenuSection}
            >
              <Can
                role={
                  user.profile === "user" &&
                  user.showDashboard === "enabled"
                    ? "admin"
                    : user.profile
                }
                perform={"drawer-admin-items:view"}
                yes={() => (
                  <>
                    <ListItemLink
                      small
                      to="/"
                      primary="Dashboard"
                      icon={<DashboardOutlinedIcon />}
                      iconKey="dashboard"
                      tooltip={collapsed}
                    />
                    {user.super && (
                      <ListItemLink
                        small
                        to="/server-metrics"
                        primary="Dados do Servidor"
                        icon={<RouterIcon />}
                        iconKey="server"
                        tooltip={collapsed}
                      />
                    )}
                    <ListItemLink
                      small
                      to="/reports"
                      primary={i18n.t(
                        "mainDrawer.listItems.reports"
                      )}
                      icon={<Description />}
                      iconKey="dashboard"
                      tooltip={collapsed}
                    />
                  </>
                )}
              />
            </Collapse>
          </>
        )}
      />
      <ListItemLink
        to="/tickets"
        primary={i18n.t("mainDrawer.listItems.tickets")}
        icon={<WhatsAppIcon />}
        iconKey="tickets"
        tooltip={collapsed}
      />

      <ListItemLink
        to="/quick-messages"
        primary={i18n.t("mainDrawer.listItems.quickMessages")}
        icon={<FlashOnIcon />}
        iconKey="messages"
        tooltip={collapsed}
      />

      {showKanban && (
        <>
          <ListItemLink
            to="/kanban"
            primary={i18n.t("mainDrawer.listItems.kanban")}
            icon={<ViewKanban />}
            iconKey="kanban"
            tooltip={collapsed}
          />
        </>
      )}

      <ListItemLink
        to="/contacts"
        primary={i18n.t("mainDrawer.listItems.contacts")}
        icon={<ContactPhoneOutlinedIcon />}
        iconKey="contacts"
        tooltip={collapsed}
      />

      {showSchedules && (
        <>
          <ListItemLink
            to="/schedules"
            primary={i18n.t("mainDrawer.listItems.schedules")}
            icon={<Schedule />}
            iconKey="schedules"
            tooltip={collapsed}
          />
        </>
      )}

      <ListItemLink
        to="/tags"
        primary={i18n.t("mainDrawer.listItems.tags")}
        icon={<LocalOfferIcon />}
        iconKey="tags"
        tooltip={collapsed}
      />

      {showInternalChat && (
        <>
          <ListItemLink
            to="/chats"
            primary={i18n.t("mainDrawer.listItems.chats")}
            icon={
              <Badge
                color="secondary"
                variant="dot"
                overlap="rectangular"
                invisible={invisible}
              >
                <ForumIcon />
              </Badge>
            }
            iconKey="chats"
            tooltip={collapsed}
          />
        </>
      )}

      {hasHelps && (
        <ListItemLink
          to="/helps"
          primary={i18n.t("mainDrawer.listItems.helps")}
          icon={<HelpOutlineIcon />}
          iconKey="helps"
          tooltip={collapsed}
        />
      )}

      <Can
        role={
          user.profile === "user" &&
          user.allowConnections === "enabled"
            ? "admin"
            : user.profile
        }
        perform="dashboard:view"
        yes={() => (
          <>
            {!collapsed && (
              <>
                <Divider className={classes.sectionDivider} />
                <ListSubheader inset className={classes.listSubheader}>
                  {i18n.t("mainDrawer.listItems.administration")}
                </ListSubheader>
              </>
            )}
            {showCampaigns && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <>
                    <Tooltip
                      placement="right"
                      arrow
                      title={
                        collapsed ? (
                          <Typography
                            style={{
                              fontWeight: 700,
                              fontSize: "0.9rem",
                            }}
                          >
                            {i18n.t(
                              "mainDrawer.listItems.campaigns"
                            )}
                          </Typography>
                        ) : (
                          ""
                        )
                      }
                    >
                      <ListItem
                        dense
                        button
                        className={`${classes.listItem} ${
                          isCampaignRouteActive
                            ? classes.listItemActive
                            : ""
                        } ${collapsed ? classes.listItemIconOnly : ""}`}
                        onClick={() =>
                          setOpenCampaignSubmenu((prev) => !prev)
                        }
                        onMouseEnter={() => setCampaignHover(true)}
                        onMouseLeave={() => setCampaignHover(false)}
                      >
                        <ListItemIcon
                          className={`${classes.listItemIcon} ${
                            collapsed ? classes.listItemIconOnlyWrap : ""
                          }`}
                        >
                          <Avatar
                            variant="rounded"
                            className={classes.iconHoverActive}
                            style={
                              isCampaignRouteActive || campaignHover
                                ? {
                                    color: "#ffffff",
                                    background:
                                      iconStyles.campaigns.gradient,
                                    boxShadow:
                                      "0 8px 16px -12px rgba(15, 23, 42, 0.65)",
                                  }
                                : {
                                    color: iconStyles.campaigns.color,
                                    ...inactiveIconSurface,
                                  }
                            }
                          >
                            <EventAvailableIcon />
                          </Avatar>
                        </ListItemIcon>
                        {!collapsed && (
                          <ListItemText
                            className={classes.listItemText}
                            primary={
                              <Typography className={classes.listItemLabel}>
                                {i18n.t(
                                  "mainDrawer.listItems.campaigns"
                                )}
                              </Typography>
                            }
                          />
                        )}
                        {!collapsed &&
                          (openCampaignSubmenu ? (
                            <ExpandLessIcon
                              className={classes.groupExpandIcon}
                            />
                          ) : (
                            <ExpandMoreIcon
                              className={classes.groupExpandIcon}
                            />
                          ))}
                      </ListItem>
                    </Tooltip>
                    <Collapse
                      in={!collapsed && openCampaignSubmenu}
                      timeout="auto"
                      unmountOnExit
                      className={classes.submenuSection}
                    >
                      <List dense component="div" disablePadding>
                        <ListItemLink
                          to="/campaigns"
                          primary={i18n.t(
                            "campaigns.subMenus.list"
                          )}
                          icon={<ListIcon />}
                          iconKey="campaigns"
                          tooltip={collapsed}
                        />
                        <ListItemLink
                          to="/contact-lists"
                          primary={i18n.t(
                            "campaigns.subMenus.listContacts"
                          )}
                          icon={<PeopleIcon />}
                          iconKey="campaigns"
                          tooltip={collapsed}
                        />
                        <ListItemLink
                          to="/campaigns-config"
                          primary={i18n.t(
                            "campaigns.subMenus.settings"
                          )}
                          icon={<SettingsOutlinedIcon />}
                          iconKey="campaigns"
                          tooltip={collapsed}
                        />
                      </List>
                    </Collapse>
                  </>
                )}
              />
            )}

            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <>
                  <Tooltip
                    placement="right"
                    arrow
                    title={
                      collapsed ? (
                        <Typography
                          style={{
                            fontWeight: 700,
                            fontSize: "0.9rem",
                          }}
                        >
                          {i18n.t(
                            "mainDrawer.listItems.flowbuilder"
                          )}
                        </Typography>
                      ) : (
                        ""
                      )
                    }
                  >
                    <ListItem
                      dense
                      button
                      className={`${classes.listItem} ${
                        isFlowbuilderRouteActive
                          ? classes.listItemActive
                          : ""
                      } ${collapsed ? classes.listItemIconOnly : ""}`}
                      onClick={() =>
                        setOpenFlowSubmenu((prev) => !prev)
                      }
                      onMouseEnter={() => setFlowHover(true)}
                      onMouseLeave={() => setFlowHover(false)}
                    >
                      <ListItemIcon
                        className={`${classes.listItemIcon} ${
                          collapsed ? classes.listItemIconOnlyWrap : ""
                        }`}
                      >
                        <Avatar
                          variant="rounded"
                          className={classes.iconHoverActive}
                          style={
                            isFlowbuilderRouteActive || flowHover
                              ? {
                                  color: "#ffffff",
                                  background:
                                    iconStyles.flowbuilder.gradient,
                                  boxShadow:
                                    "0 8px 16px -12px rgba(15, 23, 42, 0.65)",
                                }
                              : {
                                  color: iconStyles.flowbuilder.color,
                                  ...inactiveIconSurface,
                                }
                          }
                        >
                          <Webhook />
                        </Avatar>
                      </ListItemIcon>
                      {!collapsed && (
                        <ListItemText
                          className={classes.listItemText}
                          primary={
                            <Typography className={classes.listItemLabel}>
                              {i18n.t(
                                "mainDrawer.listItems.flowbuilder"
                              )}
                            </Typography>
                          }
                        />
                      )}
                      {!collapsed &&
                        (openFlowSubmenu ? (
                          <ExpandLessIcon
                            className={classes.groupExpandIcon}
                          />
                        ) : (
                          <ExpandMoreIcon
                            className={classes.groupExpandIcon}
                          />
                        ))}
                    </ListItem>
                  </Tooltip>

                  <Collapse
                    in={!collapsed && openFlowSubmenu}
                    timeout="auto"
                    unmountOnExit
                    className={classes.submenuSection}
                  >
                    <List dense component="div" disablePadding>
                      <ListItemLink
                        to="/phrase-lists"
                        primary={i18n.t(
                          "flowbuilder.subMenus.campaign"
                        )}
                        icon={<EventAvailableIcon />}
                        iconKey="flowbuilder"
                        tooltip={collapsed}
                      />

                      <ListItemLink
                        to="/flowbuilders"
                        primary={i18n.t(
                          "flowbuilder.subMenus.conversation"
                        )}
                        icon={<ShapeLine />}
                        iconKey="flowbuilder"
                        tooltip={collapsed}
                      />
                    </List>
                  </Collapse>
                </>
              )}
            />

            {user.super && (
              <ListItemLink
                to="/announcements"
                primary={i18n.t(
                  "mainDrawer.listItems.annoucements"
                )}
                icon={<AnnouncementIcon />}
                iconKey="announcements"
                tooltip={collapsed}
              />
            )}

            {showExternalApi && (
              <>
                <Can
                  role={user.profile}
                  perform="dashboard:view"
                  yes={() => (
                    <ListItemLink
                      to="/messages-api"
                      primary={i18n.t(
                        "mainDrawer.listItems.messagesAPI"
                      )}
                      icon={<CodeRoundedIcon />}
                      iconKey="api"
                      tooltip={collapsed}
                    />
                  )}
                />
              </>
            )}
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/users"
                  primary={i18n.t("mainDrawer.listItems.users")}
                  icon={<PeopleAltOutlinedIcon />}
                  iconKey="users"
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/queues"
                  primary={i18n.t("mainDrawer.listItems.queues")}
                  icon={<AccountTreeOutlinedIcon />}
                  iconKey="queues"
                  tooltip={collapsed}
                />
              )}
            />

            {showOpenAi && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/prompts"
                    primary={i18n.t(
                      "mainDrawer.listItems.prompts"
                    )}
                    icon={<AllInclusive />}
                    iconKey="prompts"
                    tooltip={collapsed}
                  />
                )}
              />
            )}

            {showIntegrations && (
              <Can
                role={user.profile}
                perform="dashboard:view"
                yes={() => (
                  <ListItemLink
                    to="/queue-integration"
                    primary={i18n.t(
                      "mainDrawer.listItems.queueIntegration"
                    )}
                    icon={<DeviceHubOutlined />}
                    iconKey="integrations"
                    tooltip={collapsed}
                  />
                )}
              />
            )}
            <Can
              role={
                user.profile === "user" &&
                user.allowConnections === "enabled"
                  ? "admin"
                  : user.profile
              }
              perform={"drawer-admin-items:view"}
              yes={() => (
                <ListItemLink
                  to="/connections"
                  primary={i18n.t(
                    "mainDrawer.listItems.connections"
                  )}
                  icon={
                    <SignalCellularConnectedNoInternet4BarIcon />
                  }
                  iconKey="connections"
                  showBadge={connectionWarning}
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/files"
                  primary={i18n.t("mainDrawer.listItems.files")}
                  icon={<AttachFile />}
                  iconKey="files"
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/financeiro"
                  primary={i18n.t(
                    "mainDrawer.listItems.financeiro"
                  )}
                  icon={<LocalAtmIcon />}
                  iconKey="financial"
                  tooltip={collapsed}
                />
              )}
            />
            <Can
              role={user.profile}
              perform="dashboard:view"
              yes={() => (
                <ListItemLink
                  to="/settings"
                  primary={i18n.t(
                    "mainDrawer.listItems.settings"
                  )}
                  icon={<SettingsOutlinedIcon />}
                  iconKey="settings"
                  tooltip={collapsed}
                />
              )}
            />

            {user.super && (
              <ListItemLink
                to="/global-config"
                primary={i18n.t(
                  "globalConfig.title",
                  "Configurações Globais"
                )}
                icon={<SettingsApplications />}
                iconKey="globalConfig"
                tooltip={collapsed}
              />
            )}
          </>
        )}
      />
      {!collapsed && (
        <React.Fragment>
          <Divider className={classes.sectionDivider} />
          <Box className={classes.versionWrap}>
            <Chip
              label="V15.0.3"
              size="small"
              className={classes.versionChip}
            />
          </Box>
        </React.Fragment>
      )}
    </div>
  );
};

export default MainListItems;
