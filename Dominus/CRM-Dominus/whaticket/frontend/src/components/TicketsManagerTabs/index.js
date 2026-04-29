import React, { useContext, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useTheme } from "@material-ui/core/styles";
import { useHistory } from "react-router-dom";
import {
  makeStyles,
  Paper,
  InputBase,
  Tabs,
  Tab,
  Badge,
  IconButton,
  Typography,
  Grid,
  Tooltip,
  Switch,
} from "@material-ui/core";
import {
  Group,
  MoveToInbox as MoveToInboxIcon,
  CheckBox as CheckBoxIcon,
  MessageSharp as MessageSharpIcon,
  AccessTime as ClockIcon,
  Search as SearchIcon,
  Add as AddIcon,
  TextRotateUp,
  TextRotationDown,
} from "@material-ui/icons";
import VisibilityIcon from "@material-ui/icons/Visibility";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import ToggleButton from "@material-ui/lab/ToggleButton";

import { FilterAltOff, FilterAlt, PlaylistAddCheckOutlined } from "@mui/icons-material";

import NewTicketModal from "../NewTicketModal";
import TicketsList from "../TicketsListCustom";
import TabPanel from "../TabPanel";
import { Can } from "../Can";
import TicketsQueueSelect from "../TicketsQueueSelect";
import { TagsFilter } from "../TagsFilter";
import { UsersFilter } from "../UsersFilter";
import { StatusFilter } from "../StatusFilter";
import { WhatsappsFilter } from "../WhatsappsFilter";
import { Button, Snackbar } from "@material-ui/core";

import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { QueueSelectedContext } from "../../context/QueuesSelected/QueuesSelectedContext";

import api from "../../services/api";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

const useStyles = makeStyles((theme) => ({
  ticketsWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
    width: "100%",
    maxWidth: "100%",
    flexDirection: "column",
    overflow: "visible",
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    backgroundColor: "transparent",
  },

  tabsHeader: {
    minWidth: 0,
    width: "100%",
    maxWidth: "100%",
    borderRadius: 8,
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),
    marginRight: theme.spacing(0.5),
  },

  settingsIcon: {
    alignSelf: "center",
    marginLeft: "auto",
    padding: theme.spacing(1),
  },

  tab: {
    minWidth: "auto",
    width: "auto",
    padding: theme.spacing(0.5, 1),
    borderRadius: 8,
    transition: "0.3s",
    borderColor: "#aaa",
    borderWidth: "1px",
    borderStyle: "solid",
    marginRight: theme.spacing(0.5),
    marginLeft: theme.spacing(0.5),

    [theme.breakpoints.down("lg")]: {
      fontSize: "0.9rem",
      padding: theme.spacing(0.4, 0.8),
      marginRight: theme.spacing(0.4),
      marginLeft: theme.spacing(0.4),
    },

    [theme.breakpoints.down("md")]: {
      fontSize: "0.8rem",
      padding: theme.spacing(0.3, 0.6),
      marginRight: theme.spacing(0.3),
      marginLeft: theme.spacing(0.3),
    },

    "&:hover": {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },

    // "&$selected": {
    //   color: "#FFF",
    //   backgroundColor: theme.palette.primary.main,
    // },
  },

  customTabsContainer: {
    display: "flex",
    width: "calc(100% - 24px)",
    margin: "12px 12px 8px 12px",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 3,
    gap: 2,
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.06)",
    boxSizing: "border-box",
  },
  customTabItem: {
    flex: 1,
    position: "relative",
    textAlign: "center",
    padding: "10px 4px",
    fontSize: "0.78rem",
    fontWeight: 700,
    borderRadius: 9,
    cursor: "pointer",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    color: "#64748B",
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 0,
    border: "none",
    background: "transparent",
    "&:hover": {
      color: "#1E293B",
    }
  },
  customTabItemActive: {
    backgroundColor: "#FFFFFF",
    color: "#0F172A !important",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 4,
    backgroundColor: "#EF4444",
    color: "#FFFFFF",
    fontSize: "0.62rem",
    fontWeight: 800,
    minWidth: 16,
    height: 16,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 4px",
    border: "2px solid #F1F5F9", // Borda para separar do fundo quando não ativa
    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.2)",
    transition: "all 0.3s ease",
    zIndex: 10,
  },
  notificationBadgeActive: {
    border: "2px solid #FFFFFF", // Borda branca quando a aba está ativa
  },

  tabIndicator: {
    display: "none",
  },
  tabsBadge: {
    top: "-26%",
    right: "-10%",
    transform: "none",
    whiteSpace: "nowrap",
    borderRadius: "9px",
    padding: "0 6px",
    backgroundColor: theme.mode === "light" ? theme.palette.primary.main : "#FFF",
    color: theme.mode === "light" ? "#FFF" : theme.palette.primary.main,
    boxShadow: "0 6px 12px rgba(0,0,0,0.12)",
    fontSize: "0.58rem",
    fontWeight: 700,
  },
  ticketOptionsBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "transparent",
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(0.5),
    padding: theme.spacing(0.5, 0),
  },

  headerContainer: {
    padding: theme.spacing(2, 2, 1, 2),
    background: "transparent",
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(1),
  },
  headerTitle: {
    fontSize: "1.3rem",
    fontWeight: 700,
    color: theme.mode === "light" ? "#0f172a" : "#f8fafc",
    letterSpacing: "-0.01em",
  },
  serachInputWrapper: {
    width: "100%",
    marginTop: 8,
    height: 40,
    background: "#F9FAFB",
    display: "flex",
    alignItems: "center",
    borderRadius: 8,
    padding: "0 12px",
    transition: "all 0.2s ease",
    border: `1px solid #E5E7EB`,
    "&:focus-within": {
      background: "#ffffff",
      borderColor: "#4F46E5",
      boxShadow: `0 0 0 3px rgba(79, 70, 229, 0.1)`,
    }
  },
  searchIcon: {
    color: "#64748b",
    marginRight: 8,
    fontSize: 18,
  },
  searchInput: {
    flex: 1,
    fontSize: "13px",
    color: "#6B7280",
  },

  badge: {
    // right: "-10px",
  },

  customBadge: {
    top: 1,
    right: -5,
    backgroundColor: theme.mode === "light" ? "#ef4444" : "#f87171",
    color: "#fff",
    fontWeight: 700,
    minWidth: 16,
    height: 16,
    fontSize: "0.58rem",
    lineHeight: "16px",
    padding: "0 4px",
  },
  tabBadgeWrap: {
    marginRight: theme.spacing(0.55),
    position: "relative",
  },

  show: {
    display: "block",
  },

  hide: {
    display: "none !important",
  },

  closeAllFab: {
    backgroundColor: "red",
    marginBottom: "4px",
    "&:hover": {
      backgroundColor: "darkred",
    },
  },

  speedDial: {
    position: "absolute",
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    "& .MuiFab-root": {
      width: "40px",
      height: "40px",
      marginTop: "4px",
    },
    "& .MuiFab-label": {
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  },

  snackbar: {
    display: "flex",
    justifyContent: "space-between",
    backgroundColor: theme.palette.primary.main,
    color: "white",
    borderRadius: 30,
    [theme.breakpoints.down("sm")]: {
      fontSize: "0.8em",
    },
    [theme.breakpoints.up("md")]: {
      fontSize: "1em",
    },
  },

  yesButton: {
    backgroundColor: "#FFF",
    color: "rgba(0, 100, 0, 1)",
    padding: "4px 4px",
    fontSize: "1em",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginRight: theme.spacing(1),
    "&:hover": {
      backgroundColor: "darkGreen",
      color: "#FFF",
    },
    borderRadius: 30,
  },
  noButton: {
    backgroundColor: "#FFF",
    color: "rgba(139, 0, 0, 1)",
    padding: "4px 4px",
    fontSize: "1em",
    fontWeight: "bold",
    textTransform: "uppercase",
    "&:hover": {
      backgroundColor: "darkRed",
      color: "#FFF",
    },
    borderRadius: 30,
  },
  filterIcon: {
    marginRight: 2,
    alignSelf: "center",
    color: theme.mode === "light" ? "#475569" : "#e2e8f0",
    cursor: "pointer",
  },
  ticketOptionsBox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(1, 0),
    marginTop: theme.spacing(0.5),
  },
  actionButtonsGroup: {
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: 10,
    padding: 0,
    transition: "all 0.2s ease",
    background: "transparent",
    color: "#64748b",
    "&:hover": {
      background: theme.mode === "light" ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)",
      color: theme.palette.primary.main,
    },
  },
  buttonOpen: {
    background: theme.mode === "light" ? "rgba(37, 99, 235, 0.1)" : "rgba(37, 99, 235, 0.2)",
    color: theme.palette.primary.main,
    "&:hover": {
      background: theme.mode === "light" ? "rgba(37, 99, 235, 0.15)" : "rgba(37, 99, 235, 0.25)",
    }
  },
  icon: {
    fontSize: 20,
  },
  statusTabs: {
    marginBottom: theme.spacing(1),
    borderRadius: 0,
    background: "transparent",
    padding: 0,
    minHeight: 40,
    width: "100%",
    overflow: "hidden",
    "& .MuiTabs-flexContainer": {
      gap: 0,
      flexWrap: "nowrap",
    },
    "& .MuiTabs-indicator": {
      display: "none",
    }
  },
  listPanel: {
    margin: theme.spacing(0, 1, 0.8),
    borderRadius: 12,
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.mode === "light" ? "rgba(255,255,255,0.92)" : "rgba(15,23,42,0.78)",
    overflow: "hidden",
  },
  // Removido duplicata
  statusTabLabel: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    textTransform: "none",
  },
  statusTabTitle: {
    fontSize: "0.8rem",
    fontWeight: 600,
  },
  statusTabIcon: {
    fontSize: "1.1rem",
  },
}));

const TicketsManagerTabs = () => {
  const theme = useTheme();
  const classes = useStyles();
  const history = useHistory();

  const [searchParam, setSearchParam] = useState("");
  const [tab, setTab] = useState("open");
  // const [tabOpen, setTabOpen] = useState("open");
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [showAllTickets, setShowAllTickets] = useState(false);
  const [sortTickets, setSortTickets] = useState(false);

  const searchInputRef = useRef();
  const [searchOnMessages, setSearchOnMessages] = useState(false);

  const { user } = useContext(AuthContext);
  const { profile } = user;
  const { setSelectedQueuesMessage } = useContext(QueueSelectedContext);
  const { tabOpen, setTabOpen } = useContext(TicketsContext);

  const [openCount, setOpenCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [groupingCount, setGroupingCount] = useState(0);

  const userQueueIds = user.queues.map((q) => q.id);
  const [selectedQueueIds, setSelectedQueueIds] = useState(userQueueIds || []);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedWhatsapp, setSelectedWhatsapp] = useState([]);
  const [forceSearch, setForceSearch] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [filter, setFilter] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [hoveredButton, setHoveredButton] = useState(null);
  const [isHoveredAll, setIsHoveredAll] = useState(false);
  const [isHoveredNew, setIsHoveredNew] = useState(false);
  const [isHoveredResolve, setIsHoveredResolve] = useState(false);
  const [isHoveredOpen, setIsHoveredOpen] = useState(false);
  const [isHoveredClosed, setIsHoveredClosed] = useState(false);
  const [isHoveredSort, setIsHoveredSort] = useState(false);

  const [isFilterActive, setIsFilterActive] = useState(false);

  useEffect(() => {
    setSelectedQueuesMessage(selectedQueueIds);
  }, [selectedQueueIds]);

  useEffect(() => {
    if (user.profile.toUpperCase() === "ADMIN" || user.allUserChat.toUpperCase() === "ENABLED") {
      setShowAllTickets(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (tab === "search") {
      searchInputRef.current.focus();
    }
    setForceSearch(!forceSearch);
  }, [tab]);

  let searchTimeout;

  const handleSearch = (e) => {
    const searchedTerm = e.target.value.toLowerCase();

    clearTimeout(searchTimeout);

    if (searchedTerm === "") {
      setSearchParam(searchedTerm);
      setForceSearch(!forceSearch);
      // setFilter(false);
      setTab("open");
      return;
    } else if (tab !== "search") {
      handleFilter();
      setTab("search");
    }

    searchTimeout = setTimeout(() => {
      setSearchParam(searchedTerm);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleBack = () => {

    history.push("/tickets");
  };

  const handleChangeTab = (e, newValue) => {
    setTab(newValue);
  };

  const handleChangeTabOpen = (e, newValue) => {
    setTabOpen(newValue);
  };

  const applyPanelStyle = (status) => {
    if (tabOpen !== status) {
      return { width: 0, height: 0 };
    }
  };

  const handleSnackbarOpen = () => {
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const CloseAllTicket = async () => {
    try {
      const { data } = await api.post("/tickets/closeAll", {
        status: tabOpen,
        selectedQueueIds,
      });
      handleSnackbarClose();
    } catch (err) {
      console.log("Error: ", err);
    }
  };

  const handleCloseOrOpenTicket = (ticket) => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const handleSelectedTags = (selecteds) => {
    const tags = selecteds.map((t) => t.id);

    clearTimeout(searchTimeout);

    if (tags.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }

    searchTimeout = setTimeout(() => {
      setSelectedTags(tags);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleSelectedUsers = (selecteds) => {
    const users = selecteds.map((t) => t.id);

    clearTimeout(searchTimeout);

    if (users.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }
    searchTimeout = setTimeout(() => {
      setSelectedUsers(users);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleSelectedWhatsapps = (selecteds) => {
    const whatsapp = selecteds.map((t) => t.id);

    clearTimeout(searchTimeout);

    if (whatsapp.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }
    searchTimeout = setTimeout(() => {
      setSelectedWhatsapp(whatsapp);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleSelectedStatus = (selecteds) => {
    const statusFilter = selecteds.map((t) => t.status);

    clearTimeout(searchTimeout);

    if (statusFilter.length === 0) {
      setForceSearch(!forceSearch);
    } else if (tab !== "search") {
      setTab("search");
    }

    searchTimeout = setTimeout(() => {
      setSelectedStatus(statusFilter);
      setForceSearch(!forceSearch);
    }, 500);
  };

  const handleFilter = () => {
    if (filter) {
      setFilter(false);
      setTab("open");
    } else setFilter(true);
    setTab("search");
  };

  const [open, setOpen] = React.useState(false);
  const [hidden, setHidden] = React.useState(false);

  const handleVisibility = () => {
    setHidden((prevHidden) => !prevHidden);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClosed = () => {
    setOpen(false);
  };

  const tooltipTitleStyle = {
    fontSize: "10px",
  };

  return (
    <Paper elevation={0} className={classes.ticketsWrapper}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        onClose={(ticket) => {
          handleCloseOrOpenTicket(ticket);
        }}
      />

      <div className={classes.headerContainer}>
        {/* ROW 1: TITLE & MAIN TICKET CATEGORY (OPEN/CLOSED) */}
        <div className={classes.headerTitleRow}>
          <Typography className={classes.headerTitle}>Mensagens</Typography>
        </div>

        {/* ROW 2: MANUAL TABS */}
        {tab === "open" && (
          <div className={classes.customTabsContainer}>
            <button
              onClick={() => handleChangeTabOpen(null, "open")}
              className={clsx(classes.customTabItem, {
                [classes.customTabItemActive]: tabOpen === "open"
              })}
            >
              {i18n.t("ticketsList.assignedHeader")} 
              {openCount > 0 && (
                <span className={clsx(classes.notificationBadge, { [classes.notificationBadgeActive]: tabOpen === "open" })}>
                  {openCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleChangeTabOpen(null, "pending")}
              className={clsx(classes.customTabItem, {
                [classes.customTabItemActive]: tabOpen === "pending"
              })}
            >
              {i18n.t("ticketsList.pendingHeader")}
              {pendingCount > 0 && (
                <span className={clsx(classes.notificationBadge, { [classes.notificationBadgeActive]: tabOpen === "pending" })}>
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => handleChangeTabOpen(null, "group")}
              className={clsx(classes.customTabItem, {
                [classes.customTabItemActive]: tabOpen === "group"
              })}
            >
              {i18n.t("ticketsList.groupsHeader") === "ticketsList.groupsHeader" ? "Grupos" : i18n.t("ticketsList.groupsHeader")}
              {groupingCount > 0 && (
                <span className={clsx(classes.notificationBadge, { [classes.notificationBadgeActive]: tabOpen === "group" })}>
                  {groupingCount}
                </span>
              )}
            </button>
          </div>
        )}

        <div className={classes.serachInputWrapper}>
          <SearchIcon className={classes.searchIcon} />
          <InputBase
            className={classes.searchInput}
            inputRef={searchInputRef}
            placeholder={i18n.t("tickets.search.placeholder")}
            type="search"
            onChange={handleSearch}
          />
          <Tooltip title="Pesquisar em mensagens">
            <Switch
              size="small"
              checked={searchOnMessages}
              onChange={(e) => setSearchOnMessages(e.target.checked)}
              color="primary"
            />
          </Tooltip>
          <IconButton
            size="small"
            onClick={() => setIsFilterActive(!isFilterActive)}
            color={isFilterActive ? "primary" : "default"}
          >
            <FilterAlt style={{ fontSize: 20 }} />
          </IconButton>
        </div>

        {/* ROW 4: SUB-ACTIONS (FILTERS, VISIBILITY, SORT) */}
        <div className={classes.ticketOptionsBox}>
          <div className={classes.actionButtonsGroup}>
            <Tooltip title={i18n.t("tickets.inbox.open")}>
              <IconButton
                className={`${classes.button} ${tab === "open" ? classes.buttonOpen : ""}`}
                onClick={() => setTab("open")}
              >
                <MoveToInboxIcon className={classes.icon} />
              </IconButton>
            </Tooltip>
            <Tooltip title={i18n.t("tickets.inbox.resolverd")}>
              <IconButton
                className={`${classes.button} ${tab === "closed" ? classes.buttonOpen : ""}`}
                onClick={() => setTab("closed")}
              >
                <CheckBoxIcon className={classes.icon} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Novo Ticket">
              <IconButton
                className={classes.button}
                onClick={() => setNewTicketModalOpen(true)}
                style={{ 
                  background: theme.palette.primary.main, 
                  color: '#fff',
                  width: 34,
                  height: 34,
                  padding: 0,
                  minWidth: 0
                }}
              >
                <AddIcon className={classes.icon} />
              </IconButton>
            </Tooltip>

            <div style={{ width: 1, height: 24, background: theme.palette.divider, margin: '0 4px' }} />

            <Tooltip title="Visibilidade">
              <IconButton className={classes.button} onClick={() => setShowAllTickets(!showAllTickets)}>
                {showAllTickets ? <VisibilityIcon className={classes.icon} /> : <VisibilityOffIcon className={classes.icon} />}
              </IconButton>
            </Tooltip>

            {user.profile === "admin" && (
              <Tooltip title={i18n.t("tickets.inbox.closedAll")}>
                <IconButton className={classes.button} onClick={handleSnackbarOpen}>
                  <PlaylistAddCheckOutlined style={{ fontSize: 22, color: "green" }} />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={!sortTickets ? "Crescente" : "Decrescente"}>
              <IconButton className={classes.button} onClick={() => setSortTickets(!sortTickets)}>
                {!sortTickets ? <TextRotateUp className={classes.icon} /> : <TextRotationDown className={classes.icon} />}
              </IconButton>
            </Tooltip>
          </div>

          <TicketsQueueSelect
            selectedQueueIds={selectedQueueIds}
            userQueues={user?.queues}
            onChange={(values) => setSelectedQueueIds(values)}
          />
        </div>

        {isFilterActive && (
          <div style={{ padding: '8px 4px', borderTop: `1px solid ${theme.palette.divider}` }}>
            <TagsFilter onFiltered={handleSelectedTags} />
            <WhatsappsFilter onFiltered={setSelectedWhatsapp} />
            <StatusFilter onFiltered={handleSelectedStatus} />
            {profile === "admin" && (
              <UsersFilter onFiltered={setSelectedUsers} />
            )}
          </div>
        )}
      </div>

      <TabPanel value={tab} name="open" className={classes.ticketsWrapper}>
        <Paper className={classes.listPanel} elevation={0}>
          <TicketsList
            status="open"
            showAll={showAllTickets}
            sortTickets={sortTickets ? "ASC" : "DESC"}
            selectedQueueIds={selectedQueueIds}
            updateCount={(val) => setOpenCount(val)}
            style={applyPanelStyle("open")}
            setTabOpen={setTabOpen}
          />
          <TicketsList
            status="pending"
            selectedQueueIds={selectedQueueIds}
            sortTickets={sortTickets ? "ASC" : "DESC"}
            showAll={user.profile === "admin" || user.allUserChat === 'enabled' ? showAllTickets : false}
            updateCount={(val) => setPendingCount(val)}
            style={applyPanelStyle("pending")}
            setTabOpen={setTabOpen}
          />
          {user.allowGroup && (
            <TicketsList
              status="group"
              showAll={showAllTickets}
              sortTickets={sortTickets ? "ASC" : "DESC"}
              selectedQueueIds={selectedQueueIds}
              updateCount={(val) => setGroupingCount(val)}
              style={applyPanelStyle("group")}
              setTabOpen={setTabOpen}
            />
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tab} name="closed" className={classes.ticketsWrapper}>
        <TicketsList
          status="closed"
          showAll={showAllTickets}
          selectedQueueIds={selectedQueueIds}
          setTabOpen={setTabOpen}
        />
      </TabPanel>

      <TabPanel value={tab} name="search" className={classes.ticketsWrapper}>
        <TicketsList
          statusFilter={selectedStatus}
          searchParam={searchParam}
          showAll={showAllTickets}
          tags={selectedTags}
          users={selectedUsers}
          selectedQueueIds={selectedQueueIds}
          whatsappIds={selectedWhatsapp}
          forceSearch={forceSearch}
          searchOnMessages={searchOnMessages}
          status="search"
        />
      </TabPanel>

      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        message={i18n.t("tickets.inbox.closedAllTickets")}
        action={
          <>
            <Button color="secondary" size="small" onClick={CloseAllTicket}>
              {i18n.t("tickets.inbox.yes")}
            </Button>
            <Button color="secondary" size="small" onClick={handleSnackbarClose}>
              {i18n.t("tickets.inbox.no")}
            </Button>
          </>
        }
      />
    </Paper>
  );
};

export default TicketsManagerTabs;
