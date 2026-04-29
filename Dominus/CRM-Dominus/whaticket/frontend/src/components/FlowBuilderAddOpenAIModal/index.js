import React, { useState, useEffect, useRef } from "react";
import * as Yup from "yup";
import { Formik, Form, Field } from "formik";
import { makeStyles } from "@material-ui/core/styles";
import { green } from "@material-ui/core/colors";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import { MenuItem, FormControl, InputLabel, Select } from "@material-ui/core";
import { Visibility, VisibilityOff } from "@material-ui/icons";
import { InputAdornment, IconButton } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { i18n } from "../../translate/i18n";
import QueueSelectSingle from "../QueueSelectSingle"; // 🔹 NOVO

// Lista de modelos suportados (incremental: mantém antigos e adiciona novos)
const allowedModels = [
  // OpenAI
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-4o",
  "gpt-4o-mini",

  // Gemini
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "gemini-2.0-flash"
];

const useStyles = makeStyles((theme) => ({
  root: { display: "flex", flexWrap: "wrap" },

  dialogPaper: {
    borderRadius: 14,
    border: "1px solid rgba(17, 24, 39, 0.08)",
    boxShadow: "0 18px 60px rgba(16, 24, 40, 0.18)",
    overflow: "hidden"
  },

  dialogTitle: {
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  },

  titleWrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 2
  },

  title: {
    fontSize: 16,
    fontWeight: 600,
    fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont",
    color: "#111827"
  },

  subtitle: {
    fontSize: 12.5,
    color: "#6B7280"
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: "1px solid rgba(17, 24, 39, 0.08)"
  },

  dialogContent: {
    padding: 20,
    background:
      "linear-gradient(180deg, rgba(249,250,251,0.6) 0%, rgba(255,255,255,1) 100%)",

    "& .MuiFormControl-root": {
      marginTop: 6,
      marginBottom: 6
    },

    "& .MuiInputLabel-outlined": {
      fontSize: 13
    },

    "& .MuiOutlinedInput-root": {
      borderRadius: 12,
      backgroundColor: "#fff"
    },

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(17, 24, 39, 0.14)"
    },

    "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(17, 24, 39, 0.22)"
    },

    "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(59, 130, 246, 0.65)"
    },

    "& .MuiFormHelperText-root": {
      marginLeft: 2
    }
  },

  multFieldLine: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    "& > *": {
      flex: 1
    }
  },

  btnWrapper: { position: "relative" },

  buttonProgress: {
    color: green[500],
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -12,
    marginLeft: -12
  },

  dialogActions: {
    padding: "14px 20px",
    borderTop: "1px solid rgba(17, 24, 39, 0.06)",
    gap: 10
  },

  primaryButton: {
    borderRadius: 12,
    textTransform: "none",
    boxShadow: "0 6px 18px rgba(59, 130, 246, 0.25)"
  },

  secondaryButton: {
    borderRadius: 12,
    textTransform: "none"
  },

  helpText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6
  }
}));

// Esquema de validação alinhado com o backend/front
const DialogflowSchema = Yup.object().shape({
  name: Yup.string()
    .min(5, "Muito curto!")
    .max(100, "Muito longo!")
    .required("Obrigatório"),
  prompt: Yup.string()
    .min(50, "Muito curto!")
    .required("Descreva o treinamento para Inteligência Artificial"),
  model: Yup.string().oneOf(allowedModels, "Modelo inválido").required("Informe o modelo"),
  maxTokens: Yup.number()
    .min(10, "Mínimo 10 tokens")
    .max(4096, "Máximo 4096 tokens")
    .required("Informe o número máximo de tokens"),
  temperature: Yup.number()
    .min(0, "Mínimo 0")
    .max(1, "Máximo 1")
    .required("Informe a temperatura"),
  apiKey: Yup.string().required("Informe a API Key"),
  maxMessages: Yup.number()
    .min(1, "Mínimo 1 mensagem")
    .max(50, "Máximo 50 mensagens")
    .required("Informe o número máximo de mensagens"),
  voice: Yup.string().when("model", {
    // voz só obrigatória no modelo principal de voz (gpt-4.1-mini)
    is: "gpt-4.1-mini",
    then: Yup.string().required("Informe o modo para Voz"),
    otherwise: Yup.string().notRequired()
  }),
  voiceKey: Yup.string().notRequired(),
  voiceRegion: Yup.string().notRequired(),
  // queueId é opcional; se não informar, backend usa fila do ticket
  queueId: Yup.mixed().notRequired()
});

const FlowBuilderOpenAIModal = ({ open, onSave, data, onUpdate, close }) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const initialState = {
    name: "",
    prompt: "",
    model: "gpt-4.1-mini",
    voice: "texto",
    voiceKey: "",
    voiceRegion: "",
    maxTokens: 100,
    temperature: 1,
    apiKey: "",
    maxMessages: 10,
    queueId: "" // 🔹 NOVO
  };

  const [showApiKey, setShowApiKey] = useState(false);
  const [integration, setIntegration] = useState(initialState);
  const [labels, setLabels] = useState({
    title: "Adicionar OpenAI/Gemini ao fluxo",
    btn: "Adicionar"
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({
        title: "Editar OpenAI/Gemini do fluxo",
        btn: "Salvar"
      });
      const typebotIntegration = data?.data?.typebotIntegration || {};
      setIntegration({
        ...initialState,
        ...typebotIntegration,
        model: allowedModels.includes(typebotIntegration.model)
          ? typebotIntegration.model
          : "gpt-4.1-mini"
      });
    } else if (open === "create") {
      setLabels({
        title: "Adicionar OpenAI/Gemini ao fluxo",
        btn: "Adicionar"
      });
      setIntegration(initialState);
    }

    return () => {
      isMounted.current = false;
    };
  }, [open, data]);

  const handleClose = () => {
    close(null);
  };

  const handleSavePrompt = (values, { setSubmitting }) => {
    const promptData = {
      ...values,
      // garante que enviamos número (Formik pode manter como string em inputs type=number)
      temperature: Number(values.temperature),
      // força voz texto se não estiver usando o modelo principal de voz
      voice: values.model === "gpt-4.1-mini" ? values.voice : "texto"
    };

    if (open === "edit") {
      onUpdate({
        ...data,
        data: { typebotIntegration: promptData }
      });
    } else if (open === "create") {
      promptData.projectName = promptData.name;
      onSave({
        typebotIntegration: promptData
      });
    }
    handleClose();
    setSubmitting(false);
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={open === "create" || open === "edit"}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        classes={{ paper: classes.dialogPaper }}
      >
        <DialogTitle className={classes.dialogTitle}>
          <div className={classes.titleWrapper}>
            <div className={classes.title}>{labels.title}</div>
            <div className={classes.subtitle}>
              Configure a integração de IA para o fluxo
            </div>
          </div>

          <IconButton
            onClick={handleClose}
            className={classes.closeButton}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Formik
          initialValues={integration}
          enableReinitialize={true}
          validationSchema={DialogflowSchema}
          onSubmit={handleSavePrompt}
        >
          {({ touched, errors, isSubmitting, values, setFieldValue }) => (
            <Form style={{ width: "100%" }}>
              <DialogContent className={classes.dialogContent} dividers>
                <Field
                  as={TextField}
                  label={i18n.t("promptModal.form.name")}
                  name="name"
                  error={touched.name && Boolean(errors.name)}
                  helperText={touched.name && errors.name}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                />

                <FormControl fullWidth margin="dense" variant="outlined">
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.apikey")}
                    name="apiKey"
                    type={showApiKey ? "text" : "password"}
                    error={touched.apiKey && Boolean(errors.apiKey)}
                    helperText={touched.apiKey && errors.apiKey}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowApiKey(!showApiKey)}>
                            {showApiKey ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                </FormControl>

                <Field
                  as={TextField}
                  label={i18n.t("promptModal.form.prompt")}
                  name="prompt"
                  error={touched.prompt && Boolean(errors.prompt)}
                  helperText={touched.prompt && errors.prompt}
                  variant="outlined"
                  margin="dense"
                  fullWidth
                  required
                  rows={10}
                  multiline
                />

                <div className={classes.multFieldLine}>
                  <FormControl
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    error={touched.model && Boolean(errors.model)}
                  >
                    <InputLabel>{i18n.t("promptModal.form.model")}</InputLabel>
                    <Field
                      as={Select}
                      label={i18n.t("promptModal.form.model")}
                      name="model"
                      onChange={(e) => {
                        setFieldValue("model", e.target.value);
                        if (e.target.value !== "gpt-4.1-mini") {
                          setFieldValue("voice", "texto");
                        }
                      }}
                    >
                      {allowedModels.map((model) => (
                        <MenuItem key={model} value={model}>
                          {model === "gpt-4.1-mini" && "GPT 4.1 Mini"}
                          {model === "gpt-4.1" && "GPT 4.1"}
                          {model === "gpt-4o" && "GPT 4o"}
                          {model === "gpt-4o-mini" && "GPT 4o Mini"}
                          {model === "gemini-1.5-flash" && "Gemini 1.5 Flash"}
                          {model === "gemini-1.5-pro" && "Gemini 1.5 Pro"}
                          {model === "gemini-2.0-flash" && "Gemini 2.0 Flash"}
                          {![
                            "gpt-4.1-mini",
                            "gpt-4.1",
                            "gpt-4o",
                            "gpt-4o-mini",
                            "gemini-1.5-flash",
                            "gemini-1.5-pro",
                            "gemini-2.0-flash",
                          ].includes(model) && model}
                        </MenuItem>
                      ))}
                    </Field>
                    {touched.model && errors.model && (
                      <div style={{ color: "red", fontSize: "12px", marginTop: 6 }}>
                        {errors.model}
                      </div>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    margin="dense"
                    variant="outlined"
                    disabled={values.model !== "gpt-4.1-mini"}
                    error={touched.voice && Boolean(errors.voice)}
                  >
                    <InputLabel>{i18n.t("promptModal.form.voice")}</InputLabel>
                    <Field
                      as={Select}
                      label={i18n.t("promptModal.form.voice")}
                      name="voice"
                    >
                      <MenuItem value="texto">Texto</MenuItem>
                      <MenuItem value="pt-BR-FranciscaNeural">Francisca</MenuItem>
                      <MenuItem value="pt-BR-AntonioNeural">Antônio</MenuItem>
                      <MenuItem value="pt-BR-BrendaNeural">Brenda</MenuItem>
                      <MenuItem value="pt-BR-DonatoNeural">Donato</MenuItem>
                      <MenuItem value="pt-BR-ElzaNeural">Elza</MenuItem>
                      <MenuItem value="pt-BR-FabioNeural">Fábio</MenuItem>
                      <MenuItem value="pt-BR-GiovannaNeural">Giovanna</MenuItem>
                      <MenuItem value="pt-BR-HumbertoNeural">Humberto</MenuItem>
                      <MenuItem value="pt-BR-JulioNeural">Julio</MenuItem>
                      <MenuItem value="pt-BR-LeilaNeural">Leila</MenuItem>
                      <MenuItem value="pt-BR-LeticiaNeural">Letícia</MenuItem>
                      <MenuItem value="pt-BR-ManuelaNeural">Manuela</MenuItem>
                      <MenuItem value="pt-BR-NicolauNeural">Nicolau</MenuItem>
                      <MenuItem value="pt-BR-ValerioNeural">Valério</MenuItem>
                      <MenuItem value="pt-BR-YaraNeural">Yara</MenuItem>
                    </Field>
                    {touched.voice && errors.voice && (
                      <div style={{ color: "red", fontSize: "12px", marginTop: 6 }}>
                        {errors.voice}
                      </div>
                    )}
                  </FormControl>
                </div>

                <div style={{ marginTop: 10, marginBottom: 10 }}>
                  <InputLabel shrink>
                    Fila para transferir atendimento (opcional)
                  </InputLabel>
                  <QueueSelectSingle
                    value={values.queueId}
                    onChange={(value) => setFieldValue("queueId", value)}
                  />
                  <div className={classes.helpText}>
                    Quando o cliente pedir para falar com um atendente, a IA irá
                    transferir o ticket para esta fila.
                  </div>
                </div>

                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.voiceKey")}
                    name="voiceKey"
                    error={touched.voiceKey && Boolean(errors.voiceKey)}
                    helperText={touched.voiceKey && errors.voiceKey}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    disabled={values.model !== "gpt-4.1-mini"}
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.voiceRegion")}
                    name="voiceRegion"
                    error={touched.voiceRegion && Boolean(errors.voiceRegion)}
                    helperText={touched.voiceRegion && errors.voiceRegion}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    disabled={values.model !== "gpt-4.1-mini"}
                  />
                </div>

                <div className={classes.multFieldLine}>
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.temperature")}
                    name="temperature"
                    error={touched.temperature && Boolean(errors.temperature)}
                    helperText={touched.temperature && errors.temperature}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    type="number"
                    inputProps={{
                      step: "0.1",
                      min: "0",
                      max: "1"
                    }}
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.max_tokens")}
                    name="maxTokens"
                    error={touched.maxTokens && Boolean(errors.maxTokens)}
                    helperText={touched.maxTokens && errors.maxTokens}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    type="number"
                  />
                  <Field
                    as={TextField}
                    label={i18n.t("promptModal.form.max_messages")}
                    name="maxMessages"
                    error={touched.maxMessages && Boolean(errors.maxMessages)}
                    helperText={touched.maxMessages && errors.maxMessages}
                    variant="outlined"
                    margin="dense"
                    fullWidth
                    type="number"
                  />
                </div>
              </DialogContent>

              <DialogActions className={classes.dialogActions}>
                <Button
                  onClick={handleClose}
                  variant="outlined"
                  disabled={isSubmitting}
                  className={classes.secondaryButton}
                >
                  {i18n.t("promptModal.buttons.cancel")}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  variant="contained"
                  className={classes.primaryButton}
                  disabled={isSubmitting}
                >
                  {labels.btn}
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </div>
  );
};

export default FlowBuilderOpenAIModal;
