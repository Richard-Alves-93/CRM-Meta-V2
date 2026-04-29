import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { useParams, useHistory } from "react-router-dom";

import clsx from "clsx";

import { IconButton, InputBase, Paper, makeStyles, useMediaQuery, useTheme } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";

import ContactDrawer from "../ContactDrawer";
import MessageInput from "../MessageInput";
import TicketHeader from "../TicketHeader";
import TicketInfo from "../TicketInfo";
import TicketActionButtons from "../TicketActionButtonsCustom";
import MessagesList from "../MessagesList";
import api from "../../services/api";
import { ReplyMessageProvider } from "../../context/ReplyingMessage/ReplyingMessageContext";
import { ForwardMessageProvider } from "../../context/ForwarMessage/ForwardMessageContext";
import { isUUID } from "../../utils/isUUID";

import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TagsContainer } from "../TagsContainer";
import { isNil } from 'lodash';
import { EditMessageProvider } from "../../context/EditingMessage/EditingMessageContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";

const drawerWidth = 320;

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column", // Alinha cabeçalho e mensagens um embaixo do outro
    height: "calc(100vh - 70px)",
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "transparent",
    padding: 0,
  },

  mainWrapper: {
    flex: 1,
    width: "100%",
    height: "100%", // Ocupa todo o espaço do root
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    borderLeft: "0",
    borderRadius: 0,
    border: "none",
    backgroundColor:
      theme.mode === "light" ? "rgba(255,255,255,0.94)" : "rgba(15,23,42,0.9)",
    marginRight: 0,
    boxShadow:
      theme.mode === "light"
        ? "0 14px 28px rgba(15,23,42,0.08)"
        : "0 14px 28px rgba(0,0,0,0.36)",
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },

  mainWrapperShift: {
    borderRadius: 16,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginRight: 0,
  },
  tagsPaper: {
    borderRadius: 0,
    borderTop: `1px solid ${theme.palette.divider}`,
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.mode === "light" ? "rgba(248,250,252,0.95)" : "rgba(30,41,59,0.7)",
  },
  searchBarWrapper: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(0.8),
    padding: theme.spacing(0.5, 1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    backgroundColor:
      theme.mode === "light" ? "rgba(255,255,255,0.95)" : "rgba(30,41,59,0.72)",
  },
  searchIcon: {
    color: theme.palette.text.secondary,
    fontSize: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: "0.86rem",
  },
}));

const Ticket = () => {
  const { ticketId } = useParams();
  const history = useHistory();
  const classes = useStyles();

  const { user, socket } = useContext(AuthContext);
  const { currentTicket, setTabOpen, setCurrentTicket } = useContext(TicketsContext);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleBack = () => {
    setCurrentTicket({ id: null, uuid: null });
    history.push("/tickets");
  };


  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contact, setContact] = useState({});
  const [ticket, setTicket] = useState({});
  const [dragDropFiles, setDragDropFiles] = useState([]);
  const [messageSearch, setMessageSearch] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const { companyId } = user;

  useEffect(() => {
    setLoading(true);
    const delayDebounceFn = setTimeout(() => {
      const fetchTicket = async () => {
        try {
          // Priorizar o UUID do contexto se ele for válido, caso contrário usar o parâmetro da URL
          // Se o parâmetro da URL for numérico, ignorá-lo se já tivermos um UUID no contexto
          const isUrlIdNumeric = !isNaN(Number(ticketId)) && ticketId !== null;
          const targetTicketId = (isUrlIdNumeric && currentTicket.uuid) ? currentTicket.uuid : (ticketId || currentTicket.uuid);

          if (!isNil(targetTicketId) && targetTicketId !== "undefined") {
            // Só faz a busca se for um UUID válido ou se não tivermos outra opção
            // Isso evita chamar /tickets/u/1128 (numérico) que dá 404
            const isTargetUUID = isUUID(targetTicketId); 
            
            if (isTargetUUID) {
              const { data } = await api.get("/tickets/u/" + targetTicketId);
              setContact(data.contact);
              setTicket(data);
              if (["pending", "open", "group"].includes(data.status)) {
                setTabOpen(data.status);
              }
              setLoading(false);
            } else if (isUrlIdNumeric) {
              // Se caímos aqui com ID numérico, tentamos a rota antiga (show) ou redirecionamos
              const { data } = await api.get("/tickets/" + targetTicketId);
              // Se o backend retornou o ticket, atualizamos o contexto para usar UUID daqui pra frente
              if (data && data.uuid) {
                 setCurrentTicket({ id: data.id, uuid: data.uuid });
                 history.push(`/tickets/${data.uuid}`);
              }
              setContact(data.contact);
              setTicket(data);
              setLoading(false);
            }
          }
        } catch (err) {
          console.error("Erro ao buscar ticket:", err);
          if (ticketId && !isNaN(Number(ticketId))) {
             // Se falhou com ID numérico, pode ser o 403 que estamos investigando
             // Não redirecionamos imediatamente para permitir ver o erro
          } else if (ticketId) {
            history.push("/tickets");
          }
          setLoading(false);
        }
      };
      fetchTicket();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [ticketId, currentTicket.uuid, user, history, setCurrentTicket, setTabOpen]);

  useEffect(() => {
    const targetTicketId = ticketId || currentTicket.uuid;
    if (!ticket && !ticket.id && ticket.uuid !== targetTicketId && targetTicketId === "undefined") {
      return;
    }

    if (user.companyId && ticket.id) {
      const onConnectTicket = () => {
        socket.emit("joinChatBox", `${ticket.id}`);
      }

      const onCompanyTicket = (data) => {
        if (data.action === "update" && data.ticket.id === ticket?.id) {
          setTicket(data.ticket);
        }

        if (data.action === "delete" && data.ticketId === ticket?.id) {
          if (ticketId) history.push("/tickets");
          else setCurrentTicket({ id: null, uuid: null });
        }
      };

      const onCompanyContactTicket = (data) => {
        if (data.action === "update") {
          setContact((prevState) => {
            if (prevState.id === data.contact?.id) {
              return { ...prevState, ...data.contact };
            }
            return prevState;
          });
        }
      };

      socket.on("connect", onConnectTicket)
      socket.on(`company-${companyId}-ticket`, onCompanyTicket);
      socket.on(`company-${companyId}-contact`, onCompanyContactTicket);

      return () => {
        socket.emit("joinChatBoxLeave", `${ticket.id}`);
        socket.off("connect", onConnectTicket);
        socket.off(`company-${companyId}-ticket`, onCompanyTicket);
        socket.off(`company-${companyId}-contact`, onCompanyContactTicket);
      };
    }
  }, [ticketId, currentTicket.uuid, ticket, history, socket, companyId]);

  const handleDrawerOpen = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const handleToggleMessageSearch = useCallback(() => {
    setShowMessageSearch((prev) => {
      if (prev) {
        setMessageSearch("");
      }
      return !prev;
    });
  }, []);

  const renderMessagesList = () => {
    return (
      <>
        <MessagesList
          isGroup={ticket.isGroup}
          onDrop={setDragDropFiles}
          whatsappId={ticket.whatsappId}
          queueId={ticket.queueId}
          channel={ticket.channel}
          ticketDbId={ticket.id}
          ticketUuid={ticket.uuid}
          searchParam={messageSearch}
        >
        </MessagesList>
        <MessageInput
          ticketId={ticket.id}
          ticketStatus={ticket.status}
          ticketChannel={ticket.channel}
          droppedFiles={dragDropFiles}
          contactId={contact.id}
          disableAutoFocus={showMessageSearch}
        />
      </>
    );
  };


  return (
    <div className={classes.root} id="drawer-container">
      <TicketHeader loading={loading}>
        {isMobile && (
          <IconButton onClick={handleBack}>
            <ArrowBackIcon />
          </IconButton>
        )}
        {ticket.contact !== undefined && (
          <div id="TicketHeader" style={{ display: 'flex', flex: 1 }}>
            <TicketInfo
              contact={contact}
              ticket={ticket}
              onClick={handleDrawerOpen}
              onToggleSearch={handleToggleMessageSearch}
              isSearching={showMessageSearch}
            />
          </div>
        )}
        <TicketActionButtons ticket={ticket} />
      </TicketHeader>

      <Paper
        variant="outlined"
        elevation={0}
        className={classes.mainWrapper}
      >
        <ReplyMessageProvider>
          <ForwardMessageProvider>
            <EditMessageProvider>
              <div style={{ display: "none" }}>
                <TicketInfo
                  contact={contact}
                  ticket={ticket}
                  onClick={handleDrawerOpen}
                />
              </div>
              <MessagesList
                isGroup={ticket.isGroup}
                onDrop={setDragDropFiles}
                whatsappId={ticket.whatsappId}
                queueId={ticket.queueId}
                channel={ticket.channel}
                ticketDbId={ticket.id}
                ticketUuid={ticket.uuid}
                searchParam={messageSearch}
              />
              <MessageInput
                ticketId={ticket.id}
                ticketStatus={ticket.status}
                ticketChannel={ticket.channel}
                droppedFiles={dragDropFiles}
                contactId={contact.id}
                disableAutoFocus={showMessageSearch}
              />
            </EditMessageProvider>
          </ForwardMessageProvider>
        </ReplyMessageProvider>
      </Paper>

      <ContactDrawer
        open={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        contact={contact}
        loading={loading}
        ticket={ticket}
      />
    </div>
  );
};

export default Ticket;
