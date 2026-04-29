import { i18n } from "../../translate/i18n";

import React, { useState, useEffect, useContext } from "react";
import { Link as RouterLink } from "react-router-dom";

import { Button, TextField, Typography } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import { IconButton, InputAdornment, Switch } from "@mui/material";
import Visibility from "@material-ui/icons/Visibility";
import VisibilityOff from "@material-ui/icons/VisibilityOff";
import EmailIcon from "@material-ui/icons/Email";
import LockIcon from "@material-ui/icons/Lock";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import { Helmet } from "react-helmet";

import api, { openApi } from "../../services/api";
import { AuthContext } from "../../context/Auth/AuthContext";
import defaultLoginLogo from "../../assets/login-logo-default.png";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100vw",
    height: "100vh",
    background: "#e5e7eb",
    backgroundImage:
      "radial-gradient(circle at 14% 16%, rgba(148, 163, 184, 0.24) 0%, rgba(148, 163, 184, 0) 42%), radial-gradient(circle at 88% 78%, rgba(148, 163, 184, 0.18) 0%, rgba(148, 163, 184, 0) 42%)",
  },
  rootWithBackground: {
    backgroundColor: "#d1d5db",
  },
  backgroundOverlay: {
    position: "absolute",
    inset: 0,
    zIndex: 0,
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.36) 0%, rgba(15, 23, 42, 0.2) 100%)",
  },
  backgroundMedia: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
  },
  backgroundImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center center",
    userSelect: "none",
    pointerEvents: "none",
  },
  formContainer: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: "430px",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "20px",
    boxShadow: "0 26px 60px -35px rgba(15, 23, 42, 0.55)",
    padding: "30px 28px 20px",
    margin: "24px",
    animation: "$fadeIn .45s ease",
    [theme.breakpoints.down("sm")]: {
      maxWidth: "360px",
      padding: "22px 18px",
      margin: "14px"
    },
  },
  "@keyframes fadeIn": {
    "0%": { opacity: 0, transform: "translateY(10px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  logoImg: {
    display: "block",
    margin: "0 auto 16px",
    maxWidth: "160px",
    height: "auto",
  },
  heading: {
    textAlign: "center",
    marginBottom: 4,
    color: "#0f172a",
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  subtitle: {
    textAlign: "center",
    color: "#667085",
    marginBottom: 12,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: "16px",
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "bold",
    width: "100%",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
    },
  },
  registerBtn: {
    backgroundColor: theme.palette.primary.main,
    color: "#fff",
    borderRadius: "10px",
    padding: "12px",
    fontWeight: "bold",
    width: "100%",
    marginTop: "10px",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
    },
  },
  forgotPassword: { marginTop: "15px", textAlign: "center" },
  forgotPasswordLink: {
    color: theme.palette.primary.main,
    textDecoration: "none",
    fontWeight: "500",
    "&:hover": { textDecoration: "underline" },
  },
  rememberMeContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: "8px",
  },
  versionCompany: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    letterSpacing: "0.02em",
  },
  whatsappButton: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    backgroundColor: "#25D366",
    borderRadius: "50%",
    width: "60px",
    height: "60px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0 4px 12px #044012",
    cursor: "pointer",
    zIndex: 999,
    transition: "all 0.3s ease",
    "&:hover": {
      backgroundColor: "#1ebe5b",
      transform: "scale(1.1)",
    },
  },
  whatsappIcon: {
    fontSize: 34,
    color: "#fff",
  },
}));

const backendUrl = process.env.REACT_APP_BACKEND_URL || "";

// resolve URL vinda do backend (relativa ou absoluta) com fallback
const resolveImageUrl = (value, fallback) => {
  if (!value) return fallback;
  if (value.startsWith("http")) return value;
  if (!backendUrl) return value;
  const base = backendUrl.replace(/\/+$/, "");
  const clean = value.replace(/^\/+/, "");
  return `${base}/${clean}`;
};

const isDefaultBackendBackground = (value) => {
  if (!value) return true;
  const normalized = String(value).toLowerCase();
  return normalized.includes("/public/branding/login-background-default");
};

const Login = () => {
  const classes = useStyles();
  const { handleLogin } = useContext(AuthContext);

  const [user, setUser] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const [branding, setBranding] = useState({
    loginLogo: "/logo.png",
    loginBackground: "",
    loginWhatsapp: "https://wa.me/5500000000000",
    companyName: "CRM Dominus",
  });

  const [error] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userCreationEnabled, setUserCreationEnabled] = useState(true);

  // ========= Tema e aparÃªncia da pÃ¡gina =============
  useEffect(() => {
    try {
      localStorage.setItem("theme", "light");
    } catch (e) {}
    document.documentElement.classList.remove("dark");
    document.documentElement.setAttribute("data-theme", "light");
    document.body.classList.add("login-page");
    return () => document.body.classList.remove("login-page");
  }, []);

  // ========= Buscar settings globais ============
  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const [{ data: brandingData }, { data: publicAppName }] =
          await Promise.all([
            api.get("/global-config/public-branding"),
            openApi.get("/public-settings/appName", {
              params: { token: "wtV" },
            }),
          ]);

        setBranding({
          loginLogo: brandingData.loginLogo || "/logo.png",
          loginBackground: isDefaultBackendBackground(brandingData.loginBackground)
            ? ""
            : brandingData.loginBackground,
          loginWhatsapp: brandingData.loginWhatsapp || "https://wa.me/5500000000000",
          companyName: String(publicAppName || "").trim() || "CRM Dominus",
        });
      } catch (err) {
        console.error("Erro ao carregar branding:", err);
      }
    };

    fetchBranding();
  }, []);


  // ========== Verificar se cadastro estÃ¡ habilitado ==========
  useEffect(() => {
    const fetchUserCreationStatus = async () => {
      try {
        const { data } = await api.get("/settings/userCreation");
        setUserCreationEnabled(data.userCreation === "enabled");
      } catch (err) {
        setUserCreationEnabled(false);
      }
    };

    fetchUserCreationStatus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const lang = localStorage.getItem("i18nextLng") || "pt";
    i18n.changeLanguage(lang);
    handleLogin(user);
  };

  return (
    <>
      <Helmet>
        <title>Login</title>
      </Helmet>

      <div
        className={`${classes.root} ${branding.loginBackground ? classes.rootWithBackground : ""}`}
      >
        {!!branding.loginBackground && (
          <>
            <div className={classes.backgroundMedia}>
              <img
                src={resolveImageUrl(branding.loginBackground, "")}
                alt="Background login"
                className={classes.backgroundImg}
              />
            </div>
            <div className={classes.backgroundOverlay} />
          </>
        )}
        <form
          className={classes.formContainer}
          onSubmit={handleSubmit}
        >
          <img
            src={resolveImageUrl(branding.loginLogo, defaultLoginLogo)}
            alt="Logo"
            className={classes.logoImg}
          />

          <Typography className={classes.heading}>Entrar</Typography>
          <Typography className={classes.subtitle}>
            Acesse sua conta para continuar.
          </Typography>

          {error && <Typography color="error">{error}</Typography>}

          <TextField
            label="Email"
            variant="outlined"
            fullWidth
            margin="normal"
            type="email"
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Senha"
            variant="outlined"
            fullWidth
            margin="normal"
            type={showPassword ? "text" : "password"}
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    style={{ color: "#374151" }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <div className={classes.rememberMeContainer}>
            <Switch
              checked={user.remember}
              onChange={(e) =>
                setUser({ ...user, remember: e.target.checked })
              }
            />
            <Typography>Lembrar de mim</Typography>
          </div>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            className={classes.submitBtn}
          >
            Entrar
          </Button>

          {userCreationEnabled && (
            <Button
              component={RouterLink}
              to="/signup"
              variant="contained"
              className={classes.registerBtn}
            >
              Cadastre-se
            </Button>
          )}

          <div className={classes.forgotPassword}>
            <RouterLink
              to="/forgot-password"
              className={classes.forgotPasswordLink}
            >
              Esqueceu a senha?
            </RouterLink>
          </div>

          <Typography variant="caption" style={{ color: "#6e82a5", marginTop: 12, display: "block" }}>
            {`v15.0.3 ${branding.companyName}`}
          </Typography>
        </form>

        {/* ===== BOTÃƒO WHATSAPP DINÃ‚MICO ===== */}
        <div
          className={classes.whatsappButton}
          onClick={() => window.open(branding.loginWhatsapp)}
        >
          <WhatsAppIcon className={classes.whatsappIcon} />
        </div>
      </div>
    </>
  );
};

export default Login;
