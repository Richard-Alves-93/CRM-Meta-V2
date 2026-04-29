import React, { useState, useEffect } from "react";
import qs from "query-string";
import * as Yup from "yup";
import { useHistory } from "react-router-dom";
import { Link as RouterLink } from "react-router-dom";
import { toast } from "react-toastify";
import { Formik, Form, Field } from "formik";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import { makeStyles } from "@material-ui/core/styles";
import WhatsAppIcon from "@material-ui/icons/WhatsApp";
import usePlans from "../../hooks/usePlans";
import { i18n } from "../../translate/i18n";
import { openApi } from "../../services/api";
import toastError from "../../errors/toastError";
import defaultLoginLogo from "../../assets/login-logo-default.png";

const useStyles = makeStyles((theme) => ({
  root: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    overflowX: "hidden",
    minHeight: "100vh",
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
  paper: {
    position: "relative",
    zIndex: 2,
    width: "100%",
    maxWidth: 520,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgba(255, 255, 255, 0.96)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: 20,
    boxShadow: "0 26px 60px -35px rgba(15, 23, 42, 0.55)",
    padding: theme.spacing(3.5),
    margin: theme.spacing(3),
    [theme.breakpoints.down("sm")]: {
      maxWidth: 380,
      padding: theme.spacing(2.5),
      margin: theme.spacing(1.5),
    },
  },
  logoImg: {
    display: "block",
    margin: "0 auto 10px",
    maxWidth: 160,
    height: "auto",
  },
  subtitle: {
    textAlign: "center",
    color: "#667085",
    marginBottom: theme.spacing(1),
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(2),
  },
  submit: {
    margin: theme.spacing(4, 0, 2),
    fontWeight: "bold",
  },
  planCardsGrid: {
    marginTop: theme.spacing(0.5),
  },
  planCard: {
    borderRadius: 12,
    border: "1px solid #dbe3ee",
    background: "#ffffff",
    padding: theme.spacing(1.2),
    cursor: "pointer",
    transition: "all .2s ease",
    "&:hover": {
      borderColor: theme.palette.primary.main,
      transform: "translateY(-1px)",
      boxShadow: "0 10px 20px -18px rgba(15, 23, 42, 0.75)",
    },
  },
  planCardActive: {
    borderColor: theme.palette.primary.main,
    background: "rgba(59, 130, 246, 0.06)",
    boxShadow: "0 10px 20px -18px rgba(15, 23, 42, 0.75)",
  },
  planName: {
    fontWeight: 700,
    color: "#0f172a",
    fontSize: 14,
    marginBottom: 4,
  },
  planMeta: {
    display: "block",
    fontSize: 12,
    color: "#475569",
    lineHeight: 1.45,
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
  versionCompany: {
    marginTop: 14,
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    color: "#64748b",
    letterSpacing: "0.02em",
  },
}));

const UserSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("ObrigatÃ³rio"),
  companyName: Yup.string()
    .min(2, "Too Short!")
    .max(50, "Too Long!")
    .required("ObrigatÃ³rio"),
  password: Yup.string().min(5, "Too Short!").max(50, "Too Long!"),
  email: Yup.string().email("Invalid email").required("ObrigatÃ³rio"),
  phone: Yup.string()
    .required("ObrigatÃ³rio")
    .test(
      "valid-br-phone",
      "Informe DDD + nÃºmero (8 ou 9 dÃ­gitos).",
      value => {
        const digits = String(value || "").replace(/\D/g, "");
        return digits.length === 10 || digits.length === 11;
      }
    ),
  planId: Yup.string().required("ObrigatÃ³rio"),
});

const formatSignupPhone = value => {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) {
    return `(${ddd}${rest ? ") " + rest : ""}`;
  }

  if (rest.length <= 8) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
};

const normalizeSignupPhone = value =>
  String(value || "").replace(/\D/g, "").slice(0, 11);

const SignUp = () => {
  const classes = useStyles();
  const history = useHistory();
  const { getPlanList } = usePlans();
  const [plans, setPlans] = useState([]);
  const [branding, setBranding] = useState({
    loginLogo: "/logo.png",
    loginBackground: "",
    loginWhatsapp: "https://wa.me/5500000000000",
    companyName: "CRM Dominus",
  });
  const [userCreationEnabled, setUserCreationEnabled] = useState(true);

  let companyId = null;
  const params = qs.parse(window.location.search);
  if (params.companyId !== undefined) {
    companyId = params.companyId;
  }

  const initialState = {
    name: "",
    email: "",
    password: "",
    phone: "",
    companyId,
    companyName: "",
    planId: "",
  };

  const [user] = useState(initialState);

  const backendUrl =
    process.env.REACT_APP_BACKEND_URL === "https://localhost:8090"
      ? "https://localhost:8090"
      : process.env.REACT_APP_BACKEND_URL;

  const resolveImageUrl = (value, fallback) => {
    if (!value) return fallback;
    if (value.startsWith("http")) return value;
    if (!backendUrl) return value;
    const normalizedBase = backendUrl.replace(/\/+$/, "");
    const path = value.startsWith("/") ? value : `/${value}`;
    return `${normalizedBase}${path}`;
  };

  const isDefaultBackendBackground = (value) => {
    if (!value) return true;
    const normalized = String(value).toLowerCase();
    return normalized.includes("/public/branding/login-background-default");
  };

  useEffect(() => {
    const fetchUserCreationStatus = async () => {
      try {
        const response = await fetch(`${backendUrl}/settings/userCreation`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user creation status");
        }

        const data = await response.json();
        const isEnabled = data.userCreation === "enabled";
        setUserCreationEnabled(isEnabled);

        if (!isEnabled) {
          toast.info("Cadastro de novos usuÃ¡rios estÃ¡ desabilitado.");
          history.push("/login");
        }
      } catch (err) {
        console.error("Erro ao verificar userCreation:", err);
        setUserCreationEnabled(false);
        toast.error("Erro ao verificar permissÃ£o de cadastro.");
        history.push("/login");
      }
    };

    fetchUserCreationStatus();
  }, [backendUrl, history]);

  useEffect(() => {
    const fetchData = async () => {
      const planList = await getPlanList({ listPublic: "false" });
      setPlans(planList);
    };
    fetchData();
  }, [getPlanList]);

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const [{ data: brandingData }, { data: publicAppName }] =
          await Promise.all([
            openApi.get("/global-config/public-branding"),
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
        // segue com fallback local
      }
    };
    fetchBranding();
  }, []);

  const handleSignUp = async (values) => {
    try {
      await openApi.post("/auth/signup", {
        ...values,
        phone: normalizeSignupPhone(values.phone)
      });
      toast.success(i18n.t("signup.toasts.success"));
      history.push("/login");
    } catch (err) {
      toastError(err);
    }
  };

  if (!userCreationEnabled) {
    return null;
  }

  return (
    <div className={`${classes.root} ${branding.loginBackground ? classes.rootWithBackground : ""}`}>
      {!!branding.loginBackground && (
        <>
          <div className={classes.backgroundMedia}>
            <img
              src={resolveImageUrl(branding.loginBackground, "")}
              alt="Background cadastro"
              className={classes.backgroundImg}
            />
          </div>
          <div className={classes.backgroundOverlay} />
        </>
      )}
      <div className={classes.paper}>
        <img
          src={resolveImageUrl(branding.loginLogo, defaultLoginLogo)}
          alt="Logo"
          className={classes.logoImg}
        />
        <Typography component="h1" variant="h5" style={{ marginBottom: 8 }}>
          {i18n.t("signup.title")}
        </Typography>
        <Typography className={classes.subtitle}>
          Crie sua conta e escolha o melhor plano.
        </Typography>
        <Formik
          initialValues={user}
          enableReinitialize={true}
          validationSchema={UserSchema}
          onSubmit={async (values, actions) => {
            await handleSignUp(values);
            actions.setSubmitting(false);
          }}
        >
          {({ touched, errors, values, setFieldValue }) => (
            <Form className={classes.form}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    id="companyName"
                    label={i18n.t("signup.form.company")}
                    error={touched.companyName && Boolean(errors.companyName)}
                    helperText={touched.companyName && errors.companyName}
                    name="companyName"
                    autoComplete="companyName"
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    autoComplete="name"
                    name="name"
                    error={touched.name && Boolean(errors.name)}
                    helperText={touched.name && errors.name}
                    variant="outlined"
                    fullWidth
                    id="name"
                    label={i18n.t("signup.form.name")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    id="email"
                    label={i18n.t("signup.form.email")}
                    name="email"
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    autoComplete="email"
                    inputProps={{ style: { textTransform: "lowercase" } }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Field
                    as={TextField}
                    variant="outlined"
                    fullWidth
                    name="password"
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    label={i18n.t("signup.form.password")}
                    type="password"
                    id="password"
                    autoComplete="current-password"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    variant="outlined"
                    fullWidth
                    id="phone"
                    label={i18n.t("signup.form.phone")}
                    name="phone"
                    autoComplete="tel-national"
                    placeholder="(00) 00000-0000"
                    value={formatSignupPhone(values.phone)}
                    onChange={(e) =>
                      setFieldValue("phone", formatSignupPhone(e.target.value))
                    }
                    error={touched.phone && Boolean(errors.phone)}
                    helperText={touched.phone && errors.phone}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" style={{ marginBottom: 8 }}>
                    Plano
                  </Typography>
                  <Field type="hidden" name="planId" />
                  <Grid container spacing={1} className={classes.planCardsGrid}>
                    {plans.map((plan) => (
                      <Grid item xs={12} sm={6} key={plan.id}>
                        <div
                          className={`${classes.planCard} ${
                            String(values.planId) === String(plan.id)
                              ? classes.planCardActive
                              : ""
                          }`}
                          onClick={() =>
                            setFieldValue("planId", String(plan.id))
                          }
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              setFieldValue("planId", String(plan.id));
                            }
                          }}
                        >
                          <Typography className={classes.planName}>
                            {plan.name}
                          </Typography>
                          <span className={classes.planMeta}>
                            Atendentes: {plan.users}
                          </span>
                          <span className={classes.planMeta}>
                            WhatsApp: {plan.connections}
                          </span>
                          <span className={classes.planMeta}>
                            Filas: {plan.queues}
                          </span>
                          <span className={classes.planMeta}>
                            Valor: R$ {plan.amount}
                          </span>
                        </div>
                      </Grid>
                    ))}
                  </Grid>
                  {touched.planId && errors.planId && (
                    <Typography
                      variant="caption"
                      style={{ color: "#d32f2f", marginTop: 6, display: "block" }}
                    >
                      {errors.planId}
                    </Typography>
                  )}
                </Grid>
              </Grid>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                className={classes.submit}
              >
                {i18n.t("signup.buttons.submit")}
              </Button>
              <Grid container justifyContent="center">
                <Grid item>
                  <Link
                    href="#"
                    variant="body2"
                    component={RouterLink}
                    to="/login"
                  >
                    {i18n.t("signup.buttons.login")}
                  </Link>
                </Grid>
              </Grid>
            </Form>
          )}
        </Formik>
          <Typography variant="caption" style={{ color: "rgba(255,255,255,0.6)", marginTop: 16 }}>
            {`v15.0.3 ${branding.companyName}`}
          </Typography>
      </div>
      <div
        className={classes.whatsappButton}
        onClick={() => window.open(branding.loginWhatsapp)}
      >
        <WhatsAppIcon className={classes.whatsappIcon} />
      </div>
    </div>
  );
};

export default SignUp;
