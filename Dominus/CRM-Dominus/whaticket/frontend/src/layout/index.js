import React, { useState, useContext, useEffect } from "react";
import clsx from "clsx";

import {
  makeStyles,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Divider,
  MenuItem,
  IconButton,
  Menu,
  useTheme,
  useMediaQuery,
  Avatar,
  Badge,
  withStyles,
  Chip,
} from "@material-ui/core";

import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import CachedIcon from "@material-ui/icons/Cached";

import MainListItems from "./MainListItems";
import NotificationsPopOver from "../components/NotificationsPopOver";
import NotificationsVolume from "../components/NotificationsVolume";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/Auth/AuthContext";
import BackdropLoading from "../components/BackdropLoading";
import { i18n } from "../translate/i18n";
import toastError from "../errors/toastError";
import AnnouncementsPopover from "../components/AnnouncementsPopover";
import ChatPopover from "../pages/Chat/ChatPopover";

import { useDate } from "../hooks/useDate";
import UserLanguageSelector from "../components/UserLanguageSelector";

import ColorModeContext from "./themeContext";
import Brightness4Icon from "@material-ui/icons/Brightness4";
import Brightness7Icon from "@material-ui/icons/Brightness7";
import { getBackendUrl } from "../config";
import useSettings from "../hooks/useSettings";
import VersionControl from "../components/VersionControl";

// logos (fallbacks)
import logo from "../assets/logo.png";
import logoDark from "../assets/logo-black.png";

const backendUrl = getBackendUrl();
const drawerWidth = 240;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    height: "100vh",
    overflow: "hidden", // Trava o scroll global do navegador
    [theme.breakpoints.down("sm")]: {
      height: "calc(100vh - 56px)",
    },
    backgroundColor: theme.palette.fancyBackground,
    "& .MuiButton-outlinedPrimary": {
      color: theme.palette.primary.main,
      border:
        theme.mode === "light"
          ? `1px solid ${theme.palette.primary.main}`
          : "1px solid rgba(255, 255, 255, 0.5)",
    },
    "& .MuiTab-textColorPrimary.Mui-selected": {
      color: theme.palette.primary,
    },
    // SCROLLBARS FINAS GLOBAIS (Estilo Premium)
    "& *::-webkit-scrollbar": {
      width: "5px",
      height: "5px",
    },
    "& *::-webkit-scrollbar-thumb": {
      backgroundColor: theme.mode === "light" ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.12)",
      borderRadius: "10px",
    },
    "& *::-webkit-scrollbar-thumb:hover": {
      backgroundColor: theme.mode === "light" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.25)",
    },
    "& *": {
      scrollbarWidth: "thin",
      scrollbarColor: theme.mode === "light" ? "rgba(0,0,0,0.12) transparent" : "rgba(255,255,255,0.12) transparent",
    }
  },

  chip: { background: "red", color: "white" },
  avatar: { width: "100%" },

  toolbar: {
    paddingRight: 16,
    paddingLeft: 10,
    color: "#ffffff", // Texto sempre branco para barras de cores sólidas/escuras
    background: theme.palette.barraSuperior,
    gap: theme.spacing(1),
    overflow: "visible", // não corta o scroller
    minHeight: 52,
    borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
    [theme.breakpoints.down("sm")]: {
      paddingRight: theme.spacing(1),
      paddingLeft: theme.spacing(1),
      minHeight: 48,
      gap: theme.spacing(0.5),
      display: "flex",
      alignItems: "center",
      flexWrap: "nowrap",
    },
  },

  // SCROLLER HORIZONTAL (ícones)
  topbarScroller: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.5),
    flex: "1 1 0%",
    minWidth: 0,
    maxWidth: "100%",
    flexWrap: "nowrap",

    // DESKTOP: alinhar à direita
    justifyContent: "flex-end",
    overflowX: "visible",

    // cada filho não encolhe => gera overflow quando somar mais que a largura
    "& > *": { flex: "0 0 auto" },

    // MOBILE: alinhar à esquerda + scroll horizontal invisível
    [theme.breakpoints.down("sm")]: {
      justifyContent: "flex-start",
      overflowX: "auto",
      overflowY: "hidden",
      WebkitOverflowScrolling: "touch",
      touchAction: "pan-x",
      overscrollBehaviorX: "contain",
      msOverflowStyle: "none",
      scrollbarWidth: "none",
      "&::-webkit-scrollbar": { display: "none" },
    },
  },
  topbarGreetingCard: {
    display: "flex",
    alignItems: "center",
    minHeight: 40,
    padding: "6px 14px",
    borderRadius: 8,
    background: theme.mode === "light" ? "rgba(15, 23, 42, 0.05)" : "rgba(255, 255, 255, 0.05)",
    border: theme.mode === "light" ? "1px solid rgba(15, 23, 42, 0.1)" : "1px solid rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(6px)",
    [theme.breakpoints.down("sm")]: { display: "none" },
  },
  topbarGreetingText: {
    fontSize: 13,
    fontWeight: 500,
    color: theme.mode === "light" ? "#0F172A" : "#f8fafc",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  },
  topbarActionsCard: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 6px",
    borderRadius: 14,
    background:
      theme.mode === "light"
        ? "rgba(15, 23, 42, 0.14)"
        : "rgba(2, 6, 23, 0.5)",
    border:
      theme.mode === "light"
        ? "1px solid rgba(255, 255, 255, 0.18)"
        : "1px solid rgba(148, 163, 184, 0.18)",
    backdropFilter: "blur(6px)",
  },
  topbarActionButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    minWidth: "auto",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    border:
      theme.mode === "light"
        ? "1px solid rgba(255, 255, 255, 0.16)"
        : "1px solid rgba(148, 163, 184, 0.16)",
    background:
      theme.mode === "light"
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(51, 65, 85, 0.45)",
    color: "#f8fafc",
    padding: 6,
    "&:hover": {
      transform: "translateY(-1px)",
      background:
        theme.mode === "light"
          ? "rgba(255, 255, 255, 0.2)"
          : "rgba(51, 65, 85, 0.72)",
    },
    "& .MuiSvgIcon-root": {
      fontSize: "1.08rem",
    },
  },
  topbarActionWrapper: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    "& .MuiIconButton-root": {
      width: 34,
      height: 34,
      borderRadius: 10,
      padding: 6,
      color: "#f8fafc",
      border:
        theme.mode === "light"
          ? "1px solid rgba(255, 255, 255, 0.16)"
          : "1px solid rgba(148, 163, 184, 0.16)",
      background:
        theme.mode === "light"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(51, 65, 85, 0.45)",
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "translateY(-1px)",
        background:
          theme.mode === "light"
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(51, 65, 85, 0.72)",
      },
    },
    "& .MuiButton-root": {
      width: 34,
      height: 34,
      minWidth: "auto",
      borderRadius: 10,
      padding: 6,
      color: "#f8fafc",
      border:
        theme.mode === "light"
          ? "1px solid rgba(255, 255, 255, 0.16)"
          : "1px solid rgba(148, 163, 184, 0.16)",
      background:
        theme.mode === "light"
          ? "rgba(255, 255, 255, 0.1)"
          : "rgba(51, 65, 85, 0.45)",
      transition: "all 0.2s ease",
      "&:hover": {
        transform: "translateY(-1px)",
        background:
          theme.mode === "light"
            ? "rgba(255, 255, 255, 0.2)"
            : "rgba(51, 65, 85, 0.72)",
      },
    },
  },

  toolbarIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundSize: "cover",
    padding: "0 8px",
    minHeight: "48px",
    [theme.breakpoints.down("sm")]: { height: "48px" },
  },

  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    // no mobile, não desloca a barra ao abrir o drawer temporário
    [theme.breakpoints.down("sm")]: {
      marginLeft: 0,
      width: "100%",
    },
  },

  menuButtonHidden: { display: "none" },

  title: {
    flexGrow: 0,
    fontSize: 13,
    color: "white",
    marginLeft: theme.spacing(1),
    [theme.breakpoints.down("sm")]: { display: "none" },
  },

  drawerPaper: {
    whiteSpace: "nowrap",
    width: drawerWidth,
    backgroundColor: "#0F172A",
    color: "rgba(255, 255, 255, 0.8)",
    borderRight: "1px solid rgba(255,255,255,0.05)",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column",
    height: "100vh",
  },
  drawerPaperClose: {
    overflowX: "hidden",
    overflowY: "hidden",
    transition: theme.transitions.create("width", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: theme.spacing(7),
    [theme.breakpoints.up("sm")]: { width: theme.spacing(9) },
  },

  appBarSpacer: { minHeight: 52 },

  content: {
    flex: 1,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // Mantém o scroll interno
    position: "relative",
    backgroundColor: theme.palette.background.default,
  },
  contentScroll: {
    flex: 1,
    overflowY: "auto",
    ...theme.scrollbarStylesSoft,
    padding: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      padding: theme.spacing(1),
    },
  },

  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },

  containerWithScroll: {
    flex: 1,
    overflowY: "scroll",
    overflowX: "hidden",
    ...theme.scrollbarStyles,
    borderRadius: "8px",
    border: "2px solid transparent",
    "&::-webkit-scrollbar": { display: "none" },
    "-ms-overflow-style": "none",
    "scrollbar-width": "none",
  },

  logoImg: {
    display: "block",
    margin: "0 auto",
    width: "100%",
    height: 45,
    maxWidth: 180,
    objectFit: "contain",
  },
  hideLogo: { display: "none" },

  avatar2: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    cursor: "pointer",
    borderRadius: "50%",
    border:
      theme.mode === "light"
        ? "2px solid rgba(255, 255, 255, 0.7)"
        : "2px solid rgba(148, 163, 184, 0.5)",
  },

  compressIconButton: {
    [theme.breakpoints.down("sm")]: { padding: 6 },
  },
}));

const StyledBadge = withStyles((theme) => ({
  badge: {
    backgroundColor: "#44b700",
    color: "#44b700",
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    "&::after": {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      borderRadius: "50%",
      animation: "$ripple 1.2s infinite ease-in-out",
      border: "1px solid currentColor",
      content: '""',
    },
  },
  "@keyframes ripple": {
    "0%": { transform: "scale(.8)", opacity: 1 },
    "100%": { transform: "scale(2.4)", opacity: 0 },
  },
}))(Badge);

const LoggedInLayout = ({ children }) => {
  const classes = useStyles();
  const [userToken, setUserToken] = useState("disabled");
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { handleLogout, loading } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerVariant, setDrawerVariant] = useState("permanent");
  const { user, socket } = useContext(AuthContext);

  const theme = useTheme();
  const { colorMode } = useContext(ColorModeContext);
  const greaterThenSm = useMediaQuery(theme.breakpoints.up("sm"));

  const [volume, setVolume] = useState(localStorage.getItem("volume") || 1);
  const [notificationSound, setNotificationSound] = useState(
    localStorage.getItem("notificationSound") || "classic"
  );
  const { dateToClient } = useDate();
  const [profileUrl, setProfileUrl] = useState(null);

  const settings = useSettings();

  // Detecção de rota para layout full-screen nos atendimentos
  const isTicketsPage = window.location.pathname.includes("/tickets");

  useEffect(() => {
    const getSetting = async () => {
      try {
        await settings.get("wtV");
        setUserToken("disabled");
      } catch (error) {
        // Ao deslogar, a API pode responder 401 antes do redirect para /login.
        // Não tratamos isso como erro fatal de tela.
        if (error?.response?.status !== 401) {
          console.error("Erro ao carregar setting wtV", error);
        }
      }
    };
    getSetting();
  }, [settings]);

  useEffect(() => {
    if (document.body.offsetWidth > 600) {
      if (user.defaultMenu === "closed") setDrawerOpen(false);
      else setDrawerOpen(true);
    }
    if (user.defaultTheme === "dark" && theme.mode === "light") {
      colorMode.toggleColorMode();
    }
  }, [user.defaultMenu, document.body.offsetWidth]);

  useEffect(() => {
    if (document.body.offsetWidth < 600) setDrawerVariant("temporary");
    else setDrawerVariant("permanent");
  }, [drawerOpen]);

  useEffect(() => {
    const companyId = user.companyId;
    const userId = user.id;
    if (companyId) {
      const ImageUrl = user.profileImage;
      if (ImageUrl !== undefined && ImageUrl !== null)
        setProfileUrl(`${backendUrl}/public/avatar/${ImageUrl}`);
      else setProfileUrl(`${process.env.FRONTEND_URL}/nopicture.png`);

      const onCompanyAuthLayout = (data) => {
        if (data.user.id === +userId) {
          toastError("Sua conta foi acessada em outro computador.");
          setTimeout(() => {
            localStorage.clear();
            window.location.reload();
          }, 1000);
        }
      };

      socket.on(`company-${companyId}-auth`, onCompanyAuthLayout);

      socket.emit("userStatus");
      const interval = setInterval(() => {
        socket.emit("userStatus");
      }, 1000 * 60 * 5);

      return () => {
        socket.off(`company-${companyId}-auth`, onCompanyAuthLayout);
        clearInterval(interval);
      };
    }
  }, [socket]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
    setMenuOpen(true);
  };
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuOpen(false);
  };
  const handleOpenUserModal = () => {
    setUserModalOpen(true);
    handleCloseMenu();
  };
  const handleClickLogout = () => {
    handleCloseMenu();
    handleLogout();
  };
  const handleRefreshPage = () => window.location.reload(false);

  if (loading) return <BackdropLoading />;

  // src da logo com fallback ao tema
  const logoSrc =
    theme.mode === "light"
      ? (typeof theme.calculatedLogoLight === "function"
          ? theme.calculatedLogoLight()
          : logo)
      : (typeof theme.calculatedLogoDark === "function"
          ? theme.calculatedLogoDark()
          : logoDark);

  return (
    <div className={classes.root}>
      <Drawer
        variant={drawerVariant}
        className={drawerOpen ? classes.drawerPaper : classes.drawerPaperClose}
        classes={{
          paper: clsx(classes.drawerPaper, !drawerOpen && classes.drawerPaperClose),
        }}
        open={drawerOpen}
      >
        <div className={classes.toolbarIcon}>
          {/* Logo visível no Drawer */}
          <img
            src={logoSrc}
            alt="logo"
            className={drawerOpen ? classes.logoImg : classes.hideLogo}
          />
          <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <List className={classes.containerWithScroll}>
          <MainListItems collapsed={!drawerOpen} />
        </List>
        <Divider />
      </Drawer>

      <AppBar
        position="fixed"
        className={clsx(classes.appBar, drawerOpen && classes.appBarShift)}
        color="primary"
      >
        <Toolbar variant="dense" className={classes.toolbar}>
          {/* Esquerda: botão do menu */}
          <IconButton
            edge="start"
            aria-label="open drawer"
            style={{ color: "white", flexShrink: 0 }}
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(drawerOpen && classes.menuButtonHidden)}
          >
            <MenuIcon />
          </IconButton>

          {/* Título (desktop apenas) */}
          <div className={classes.title}>
            <div className={classes.topbarGreetingCard}>
              <span className={classes.topbarGreetingText}>
                {greaterThenSm && user?.profile === "admin" && user?.company?.dueDate ? (
                  <>
                    {i18n.t("mainDrawer.appBar.user.message")} <b>{user.name}</b>,{" "}
                    {i18n.t("mainDrawer.appBar.user.messageEnd")} <b>{user?.company?.name}</b>! (
                    {i18n.t("mainDrawer.appBar.user.active")} {dateToClient(user?.company?.dueDate)})
                  </>
                ) : (
                  <>
                    {i18n.t("mainDrawer.appBar.user.message")} <b>{user.name}</b>,{" "}
                    {i18n.t("mainDrawer.appBar.user.messageEnd")} <b>{user?.company?.name}</b>!
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Direita: Ícones no scroller */}
          <div className={classes.topbarScroller}>
            <div className={classes.topbarActionsCard}>
              {userToken === "enabled" && user?.companyId === 1 && (
                <Chip className={classes.chip} label={i18n.t("mainDrawer.appBar.user.token")} />
              )}

              <div className={classes.topbarActionWrapper}>
                <VersionControl />
              </div>
              <div className={classes.topbarActionWrapper}>
                <UserLanguageSelector />
              </div>

              <IconButton
                onClick={colorMode.toggleColorMode}
                className={classes.topbarActionButton}
              >
                  {theme.mode === "dark" ? (
                    <Brightness7Icon style={{ color: "white" }} />
                  ) : (
                    <Brightness4Icon style={{ color: "white" }} />
                  )}
              </IconButton>

              <div className={classes.topbarActionWrapper}>
                <NotificationsVolume
                  setVolume={setVolume}
                  volume={volume}
                  notificationSound={notificationSound}
                  setNotificationSound={setNotificationSound}
                />
              </div>

              <IconButton
                onClick={handleRefreshPage}
                aria-label={i18n.t("mainDrawer.appBar.refresh")}
                color="inherit"
                className={classes.topbarActionButton}
              >
                <CachedIcon style={{ color: "white" }} />
              </IconButton>

              {user.id && (
                <div className={classes.topbarActionWrapper}>
                  <NotificationsPopOver
                    volume={volume}
                    notificationSound={notificationSound}
                  />
                </div>
              )}

              <div className={classes.topbarActionWrapper}>
                <AnnouncementsPopover />
              </div>
              <div className={classes.topbarActionWrapper}>
                <ChatPopover />
              </div>

              <div className={classes.topbarActionWrapper}>
                <StyledBadge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  variant="dot"
                  onClick={handleMenu}
                >
                  <Avatar alt="Multi100" className={classes.avatar2} src={profileUrl} />
                </StyledBadge>
              </div>
            </div>

            {/* Menu do usuário */}
            <UserModal
              open={userModalOpen}
              onClose={() => setUserModalOpen(false)}
              onImageUpdate={(newProfileUrl) => setProfileUrl(newProfileUrl)}
              userId={user?.id}
            />
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              getContentAnchorEl={null}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={menuOpen}
              onClose={handleCloseMenu}
            >
              <MenuItem onClick={handleOpenUserModal}>{i18n.t("mainDrawer.appBar.user.profile")}</MenuItem>
              <MenuItem onClick={handleClickLogout}>{i18n.t("mainDrawer.appBar.user.logout")}</MenuItem>
            </Menu>
          </div>
        </Toolbar>
      </AppBar>

      <main className={classes.content}>
        <div className={classes.appBarSpacer} />
        <div 
          className={classes.contentScroll}
          style={isTicketsPage ? { 
            padding: 0, 
            overflowY: 'hidden', 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
          } : {}}
        >
          {children ? children : null}
        </div>
      </main>
    </div>
  );
};

export default LoggedInLayout;
