import React, { useState, useEffect, useRef } from "react";

import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";

import { i18n } from "../../translate/i18n";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack
} from "@mui/material";

const useStyles = makeStyles(() => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  },

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

    "& .MuiOutlinedInput-root": {
      borderRadius: 12,
      backgroundColor: "#fff"
    }
  },

  dialogActions: {
    padding: "14px 20px",
    borderTop: "1px solid rgba(17, 24, 39, 0.06)",
    gap: 10
  },

  primaryButton: {
    borderRadius: 12,
    textTransform: "none"
  },

  secondaryButton: {
    borderRadius: 12,
    textTransform: "none"
  }
}));

const FlowBuilderConditionModal = ({ open, onSave, onUpdate, data, close }) => {
  const classes = useStyles();
  const isMounted = useRef(true);

  const [activeModal, setActiveModal] = useState(false);
  const [rule, setRule] = useState();
  const [textDig, setTextDig] = useState();
  const [valueCondition, setValueCondition] = useState();

  const [labels, setLabels] = useState({
    title: "Adicionar condição ao fluxo",
    btn: "Adicionar"
  });

  useEffect(() => {
    if (open === "edit") {
      setLabels({ title: "Editar condição", btn: "Salvar" });
      setTextDig(data.data.key);
      setRule(data.data.condition);
      setValueCondition(data.data.value);
      setActiveModal(true);
    } else if (open === "create") {
      setLabels({ title: "Adicionar condição ao fluxo", btn: "Adicionar" });
      setTextDig();
      setRule();
      setValueCondition();
      setActiveModal(true);
    } else {
      setActiveModal(false);
    }
    return () => {
      isMounted.current = false;
    };
  }, [open, data]);

  const handleClose = () => {
    close(null);
    setActiveModal(false);
  };

  const handleSaveContact = () => {
    if (open === "edit") {
      handleClose();
      onUpdate({
        ...data,
        data: { key: textDig, condition: rule, value: valueCondition }
      });
    } else if (open === "create") {
      handleClose();
      onSave({
        key: textDig,
        condition: rule,
        value: valueCondition
      });
    }
  };

  return (
    <div className={classes.root}>
      <Dialog
        open={activeModal}
        onClose={handleClose}
        fullWidth
        maxWidth="md"
        scroll="paper"
        classes={{ paper: classes.dialogPaper }}
      >
        <DialogTitle className={classes.dialogTitle}>
          <div className={classes.titleWrapper}>
            <Typography className={classes.title}>{labels.title}</Typography>
            <Typography className={classes.subtitle}>
              Configure a lógica de condição
            </Typography>
          </div>

          <IconButton
            onClick={handleClose}
            className={classes.closeButton}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent className={classes.dialogContent} dividers>
          <Stack spacing={2}>
            <TextField
              label="Campo da condição"
              helperText="Digite apenas uma chave"
              variant="outlined"
              value={textDig || ""}
              onChange={e => setTextDig(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Regra de validação</InputLabel>
              <Select
                value={rule || ""}
                label="Regra de validação"
                onChange={e => setRule(e.target.value)}
              >
                <MenuItem value={1}>==</MenuItem>
                <MenuItem value={2}>&gt;=</MenuItem>
                <MenuItem value={3}>&lt;=</MenuItem>
                <MenuItem value={4}>&lt;</MenuItem>
                <MenuItem value={5}>&gt;</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Valor da condição"
              variant="outlined"
              value={valueCondition || ""}
              onChange={e => setValueCondition(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>

        <DialogActions className={classes.dialogActions}>
          <Button
            onClick={handleClose}
            variant="outlined"
            className={classes.secondaryButton}
          >
            {i18n.t("contactModal.buttons.cancel")}
          </Button>
          <Button
            onClick={handleSaveContact}
            variant="contained"
            color="primary"
            className={classes.primaryButton}
          >
            {labels.btn}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default FlowBuilderConditionModal;
