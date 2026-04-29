import React, { useContext } from "react";
import { makeStyles } from "@material-ui/core/styles";

import MomentsUser from "../../components/MomentsUser";
// import MomentsQueues from "../../components/MomentsQueues";

import { Box, Chip, Paper, Typography } from "@material-ui/core";
import ForbiddenPage from "../../components/ForbiddenPage";
import { AuthContext } from "../../context/Auth/AuthContext";

const useStyles = makeStyles((theme) => ({
  pageRoot: {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    flex: 1,
    width: "100%",
    maxWidth: "100%",
    padding: theme.spacing(2),
    height: "calc(100% - 48px)",
    overflowY: "hidden",
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
  },
  pageHeaderTitle: {
    fontWeight: 600,
    letterSpacing: 0.1,
    fontSize: "1.2rem",
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
    display: "flex",
    flex: 1,
    minHeight: 0,
    padding: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    alignItems: "stretch",
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  }
}));

const ChatMoments = () => {
  const classes = useStyles();
  const { user } = useContext(AuthContext)
  return (

    user.profile === "user" && user.allowRealTime === "disabled" ?
      <ForbiddenPage />
      :
      <div className={classes.pageRoot}>
        <Paper className={classes.pageHeader} elevation={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" style={{ gap: 8 }}>
            <Box>
              <Typography className={classes.pageHeaderTitle}>Painel de Atendimentos</Typography>
              <Typography className={classes.pageHeaderSubtitle}>
                Monitore atendimentos em tempo real com visual leve e organizado.
              </Typography>
            </Box>
            <Chip className={classes.headerChip} label="Tempo real" />
          </Box>
        </Paper>
        <Paper
          className={classes.mainPaper}
          variant="outlined"
        >
          <MomentsUser />
        </Paper>
      </div>
  );
};

export default ChatMoments;
