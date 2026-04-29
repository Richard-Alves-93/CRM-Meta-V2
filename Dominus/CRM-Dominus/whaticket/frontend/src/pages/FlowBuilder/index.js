import React, { useState, useEffect, useReducer, useContext } from "react";

import { toast } from "react-toastify";
import { useHistory } from "react-router-dom";

import { makeStyles, useTheme } from "@material-ui/core/styles";

import Paper from "@material-ui/core/Paper";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";

import api from "../../services/api";
import ConfirmationModal from "../../components/ConfirmationModal";

import { i18n } from "../../translate/i18n";
import MainHeader from "../../components/MainHeader";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import NewTicketModal from "../../components/NewTicketModal";
import {
  AddCircle,
  DevicesFold,
  MoreVert,
  AccountTreeOutlined
} from "@mui/icons-material";

import {
  Button,
  CircularProgress,
  Grid,
  Menu,
  MenuItem,
  Stack
} from "@mui/material";

import FlowBuilderModal from "../../components/FlowBuilderModal";

const reducer = (state, action) => {
  if (action.type === "LOAD_CONTACTS") {
    const contacts = action.payload;
    const newContacts = [];

    contacts.forEach(contact => {
      const contactIndex = state.findIndex(c => c.id === contact.id);
      if (contactIndex !== -1) {
        state[contactIndex] = contact;
      } else {
        newContacts.push(contact);
      }
    });

    return [...state, ...newContacts];
  }

  if (action.type === "UPDATE_CONTACTS") {
    const contact = action.payload;
    const contactIndex = state.findIndex(c => c.id === contact.id);

    if (contactIndex !== -1) {
      state[contactIndex] = contact;
      return [...state];
    } else {
      return [contact, ...state];
    }
  }

  if (action.type === "DELETE_CONTACT") {
    const contactId = action.payload;

    const contactIndex = state.findIndex(c => c.id === contactId);
    if (contactIndex !== -1) {
      state.splice(contactIndex, 1);
    }
    return [...state];
  }

  if (action.type === "RESET") {
    return [];
  }
};

const useStyles = makeStyles(theme => ({
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
  controlsPaper: {
    marginBottom: theme.spacing(2),
    borderRadius: 14,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
    padding: theme.spacing(1.25),
    backgroundColor: theme.palette.background.paper,
  },
  searchField: {
    "& .MuiOutlinedInput-root": {
      borderRadius: 10,
      backgroundColor: theme.palette.background.default,
    },
    "& .MuiInputBase-input": {
      fontSize: "0.82rem",
      paddingTop: 13,
      paddingBottom: 13,
    },
  },
  actionButton: {
    minHeight: 42,
    borderRadius: 10,
    fontWeight: 600,
    fontSize: "0.75rem",
    padding: theme.spacing(0.8, 1.4),
    boxShadow: "0 6px 14px rgba(7, 64, 171, 0.14)",
    textTransform: "none",
  },
  mainPaper: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: theme.spacing(1),
    overflowY: "auto",
    ...theme.scrollbarStyles,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
  },
  tableHeader: {
    padding: "10px 8px",
    borderBottom: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
    fontSize: "0.76rem",
    fontWeight: 700,
  },
  row: {
    padding: "10px 8px",
    borderRadius: 10,
    marginTop: theme.spacing(0.7),
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor:
        theme.palette.type === "dark"
          ? "rgba(255,255,255,0.03)"
          : "rgba(15, 23, 42, 0.035)",
    },
  },
  rowText: {
    color: theme.palette.text.primary,
    fontSize: "0.78rem",
  },
  statusText: {
    color: theme.palette.text.secondary,
    fontSize: "0.78rem",
  },
  menuButton: {
    minWidth: "26px",
    borderRadius: "24px",
    border: `1px solid ${theme.palette.divider}`,
  },
}));

const FlowBuilder = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();

  const [loading, setLoading] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [searchParam, setSearchParam] = useState("");
  const [, dispatch] = useReducer(reducer, []);
  const [webhooks, setWebhooks] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [selectedWebhookName, setSelectedWebhookName] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [newTicketModalOpen, setNewTicketModalOpen] = useState(false);
  const [contactTicket] = useState({});
  const [deletingContact, setDeletingContact] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDuplicateOpen, setConfirmDuplicateOpen] = useState(false);

  const [hasMore, setHasMore] = useState(false);
  const [reloadData, setReloadData] = useState(false);
  const { user, socket } = useContext(AuthContext);

  useEffect(() => {
    dispatch({ type: "RESET" });
    setPageNumber(1);
  }, [searchParam]);

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchContacts = async () => {
        try {
          const { data } = await api.get("/flowbuilder");
          setWebhooks(data.flows);
          dispatch({ type: "LOAD_CONTACTS", payload: data.flows });
          setHasMore(data.hasMore);
          setLoading(false);
        } catch (err) {
          toastError(err);
        }
      };
      fetchContacts();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchParam, pageNumber, reloadData]);

  useEffect(() => {
    const companyId = user.companyId;

    const onContact = (data) => {
      if (data.action === "update" || data.action === "create") {
        dispatch({ type: "UPDATE_CONTACTS", payload: data.contact });
      }

      if (data.action === "delete") {
        dispatch({ type: "DELETE_CONTACT", payload: +data.contactId });
      }
    };

    socket.on(`company-${companyId}-contact`, onContact);

    return () => {
      socket.off(`company-${companyId}-contact`, onContact);
    };
  }, [socket, user.companyId]);

  const handleSearch = event => {
    setSearchParam(event.target.value.toLowerCase());
  };

  const handleOpenContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
    setContactModalOpen(false);
  };

  const handleCloseOrOpenTicket = ticket => {
    setNewTicketModalOpen(false);
    if (ticket !== undefined && ticket.uuid !== undefined) {
      history.push(`/tickets/${ticket.uuid}`);
    }
  };

  const hadleEditContact = () => {
    setSelectedContactId(deletingContact.id);
    setSelectedWebhookName(deletingContact.name);
    setContactModalOpen(true);
  };

  const handleDeleteWebhook = async webhookId => {
    try {
      await api.delete(`/flowbuilder/${webhookId}`).then(res => {
        setDeletingContact(null);
        setReloadData(old => !old);
      });
      toast.success("Fluxo excluído com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const handleDuplicateFlow = async flowId => {
    try {
      await api.post(`/flowbuilder/duplicate`, { flowId: flowId }).then(res => {
        setDeletingContact(null);
        setReloadData(old => !old);
      });
      toast.success("Fluxo duplicado com sucesso");
    } catch (err) {
      toastError(err);
    }
  };

  const loadMore = () => {
    setPageNumber(prevState => prevState + 1);
  };

  const handleScroll = e => {
    if (!hasMore || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - (scrollTop + 100) < clientHeight) {
      loadMore();
    }
  };

  const [anchorEl, setAnchorEl] = useState(null);

  const open = Boolean(anchorEl);

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const exportLink = () => {
    history.push(`/flowbuilder/${deletingContact.id}`);
  };

  return (
    <div className={classes.pageRoot}>
      <NewTicketModal
        modalOpen={newTicketModalOpen}
        initialContact={contactTicket}
        onClose={ticket => {
          handleCloseOrOpenTicket(ticket);
        }}
      />
      <FlowBuilderModal
        open={contactModalOpen}
        onClose={handleCloseContactModal}
        aria-labelledby="form-dialog-title"
        flowId={selectedContactId}
        nameWebhook={selectedWebhookName}
        onSave={() => setReloadData(old => !old)}
      />
      <ConfirmationModal
        title={
          deletingContact
            ? `${i18n.t("contacts.confirmationModal.deleteTitle")} ${deletingContact.name}?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmOpen}
        onClose={setConfirmOpen}
        onConfirm={e =>
          deletingContact ? handleDeleteWebhook(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja deletar este fluxo? Todas as integrações relacionados serão perdidos.`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <ConfirmationModal
        title={
          deletingContact
            ? `Deseja duplicar o fluxo ${deletingContact.name}?`
            : `${i18n.t("contacts.confirmationModal.importTitlte")}`
        }
        open={confirmDuplicateOpen}
        onClose={setConfirmDuplicateOpen}
        onConfirm={e =>
          deletingContact ? handleDuplicateFlow(deletingContact.id) : () => {}
        }
      >
        {deletingContact
          ? `Tem certeza que deseja duplicar este fluxo?`
          : `${i18n.t("contacts.confirmationModal.importMessage")}`}
      </ConfirmationModal>
      <MainHeader>
        <Grid container style={{ width: "100%" }}>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.pageHeader}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography className={classes.pageHeaderTitle}>
                    {i18n.t("flowbuilder.subMenus.conversation")}
                  </Typography>
                  <Typography className={classes.pageHeaderSubtitle}>
                    Gerencie seus fluxos de conversa com uma visão limpa e produtiva.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} style={{ textAlign: "right" }}>
                  <Chip
                    icon={<AccountTreeOutlined style={{ color: "#2f4b7c", fontSize: 14 }} />}
                    label={`${webhooks.length} fluxos`}
                    className={classes.headerChip}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper elevation={0} className={classes.controlsPaper}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8} md={9}>
                  <TextField
                    fullWidth
                    placeholder={i18n.t("contacts.searchPlaceholder")}
                    type="search"
                    value={searchParam}
                    onChange={handleSearch}
                    variant="outlined"
                    className={classes.searchField}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon style={{ color: "gray" }} />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleOpenContactModal}
                    className={classes.actionButton}
                  >
                    <Stack direction={"row"} gap={1}>
                      <AddCircle />
                      {"Adicionar Fluxo"}
                    </Stack>
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </MainHeader>
      <Paper
        className={classes.mainPaper}
        variant="outlined"
        onScroll={handleScroll}
      >
        <Stack>
          <Grid container className={classes.tableHeader}>
            <Grid item xs={4}>
              {i18n.t("contacts.table.name")}
            </Grid>
            <Grid item xs={4} align="center">
              Status
            </Grid>
            <Grid item xs={4} align="end">
              {i18n.t("contacts.table.actions")}
            </Grid>
          </Grid>
          <>
            {webhooks.map(contact => (
              <Grid               
                container
                key={contact.id}
                className={classes.row}
              >
                <Grid item xs={4}  onClick={() => history.push(`/flowbuilder/${contact.id}`)}>
                  <Stack
                    justifyContent={"center"}
                    height={"100%"}
                    className={classes.rowText}
                  >
                    <Stack direction={"row"}>
                      <DevicesFold fontSize="small" />
                      <Stack justifyContent={"center"} marginLeft={1}>
                        {contact.name}
                      </Stack>
                    </Stack>
                  </Stack>
                </Grid>
                <Grid item xs={4} align="center" className={classes.statusText} onClick={() => history.push(`/flowbuilder/${contact.id}`)}>
                  <Stack justifyContent={"center"} height={"100%"}>
                    {contact.active ? "Ativo" : "Desativado"}
                  </Stack>
                </Grid>
                <Grid item xs={4} align="end">
                  <Button
                    id="basic-button"
                    aria-controls={open ? "basic-menu" : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? "true" : undefined}
                    onClick={(e) => {
                      handleClick(e);
                      setDeletingContact(contact);
                    }}
                    className={classes.menuButton}
                  >
                    <MoreVert
                      sx={{ color: theme.palette.text.secondary, width: "20px", height: "20px" }}
                    />
                  </Button>
                  {/* <IconButton
                    size="small"
                    onClick={() => hadleEditContact(contact.id, contact.name)}
                  >
                    <EditIcon style={{ color: "#ededed" }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={e => {
                      setConfirmDuplicateOpen(true);
                      setDeletingContact(contact);
                    }}
                  >
                    <ContentCopy style={{ color: "#ededed" }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => history.push(`/flowbuilder/${contact.id}`)}
                  >
                    <Stack sx={{ width: 24 }}>
                      <Build sx={{ width: 20, color: "#ededed" }} />
                    </Stack>
                  </IconButton>
                  <Can
                    role={user.profile}
                    perform="contacts-page:deleteContact"
                    yes={() => (
                      <IconButton
                        size="small"
                        onClick={e => {
                          setConfirmOpen(true);
                          setDeletingContact(contact);
                        }}
                      >
                        <DeleteOutlineIcon style={{ color: "#ededed" }} />
                      </IconButton>
                    )}
                  /> */}
                </Grid>
              </Grid>
            ))}
            <Menu
              id="basic-menu"
              anchorEl={anchorEl}
              open={open}
              sx={{borderRadius: '40px'}}
              onClose={handleClose}
              MenuListProps={{
                "aria-labelledby": "basic-button"
              }}
            >
              <MenuItem onClick={() => {
                handleClose()
                hadleEditContact()
                }}>Editar nome</MenuItem>
              <MenuItem onClick={() => {
                handleClose()
                exportLink()
                }}>Editar fluxo</MenuItem>
              <MenuItem onClick={() => {
                handleClose()
                setConfirmDuplicateOpen(true);
                }}>Duplicar</MenuItem>
              <MenuItem onClick={() => {
                handleClose()
                setConfirmOpen(true);
                }}>Excluir</MenuItem>
            </Menu>
            {loading && (
              <Stack
                justifyContent={"center"}
                alignItems={"center"}
                minHeight={"50vh"}
              >
                <CircularProgress />
              </Stack>
            )}
          </>
        </Stack>
      </Paper>
    </div>
  );
};

export default FlowBuilder;
