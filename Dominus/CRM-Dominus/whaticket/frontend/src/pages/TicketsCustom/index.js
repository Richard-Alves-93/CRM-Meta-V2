import React, { useState, useCallback, useContext, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Paper from "@material-ui/core/Paper";
import Hidden from "@material-ui/core/Hidden";
import { makeStyles } from "@material-ui/core/styles";
import TicketsManager from "../../components/TicketsManagerTabs";
import Ticket from "../../components/Ticket";

import { QueueSelectedProvider } from "../../context/QueuesSelected/QueuesSelectedContext";
import { i18n } from "../../translate/i18n";
import { AuthContext } from "../../context/Auth/AuthContext";
import { TicketsContext } from "../../context/Tickets/TicketsContext";
import api from "../../services/api";
import { useMediaQuery, useTheme } from "@material-ui/core";

const defaultTicketsManagerWidth = 550;
const minTicketsManagerWidth = 404;
const maxTicketsManagerWidth = 700;

const useStyles = makeStyles((theme) => ({
	chatContainer: {
		display: "flex",
		width: "100%",
		flex: 1,
		padding: 0,
		overflow: "hidden",
		minHeight: 0, // Importante para flexbox não estourar
	},
	chatPapper: {
		display: "grid",
		gridTemplateColumns: "360px 1fr", // Trava sidebar e estica o chat
		width: "100%",
		height: "100%",
		backgroundColor: theme.palette.background.default,
		overflow: "hidden",

		// No Mobile, vira uma coluna só que alterna
		'@media (max-width:768px)': {
			gridTemplateColumns: "1fr",
		},
	},
	contactsWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflow: "hidden",
		borderRight: `1px solid ${theme.palette.divider}`,
		backgroundColor: theme.palette.background.paper,

		// Lógica Mobile
		'@media (max-width:768px)': {
			display: props => props.selectedChat ? "none !important" : "flex !important"
		},
	},
	messagesWrapper: {
		display: "flex",
		height: "100%",
		flexDirection: "column",
		overflow: "hidden",
		backgroundColor: theme.palette.background.paper,

		// Lógica Mobile
		'@media (max-width:768px)': {
			display: props => props.selectedChat ? "flex !important" : "none !important"
		},
	},
	welcomeMsg: {
		background:
			theme.mode === "light"
				? "linear-gradient(135deg, #ffffff 0%, #f4f8ff 100%)"
				: "linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		height: "100%",
		textAlign: "center",
		borderRadius: 16,
		border: `1px solid ${theme.palette.divider}`,
		margin: theme.spacing(1),
		boxShadow:
			theme.mode === "light"
				? "0 10px 22px rgba(15, 23, 42, 0.08)"
				: "0 10px 22px rgba(0, 0, 0, 0.35)",
		color: theme.palette.text.primary,
	},
	welcomeInner: {
		maxWidth: 420,
		padding: theme.spacing(2),
	},
	welcomeTitle: {
		fontSize: "1.15rem",
		fontWeight: 700,
		marginTop: theme.spacing(1),
	},
	welcomeText: {
		marginTop: theme.spacing(0.7),
		fontSize: "0.86rem",
		lineHeight: 1.45,
		color: theme.palette.text.secondary,
	},
	logo: {
		logo: theme.logo,
		content: "url(" + (theme.mode === "light" ? theme.calculatedLogoLight() : theme.calculatedLogoDark()) + ")",
		opacity: 0.92,
		filter: theme.mode === "light" ? "none" : "brightness(1.12)",
	},
}));

const TicketsCustom = () => {
	const theme = useTheme();
	const { ticketId } = useParams();
	const { currentTicket } = useContext(TicketsContext);
	const [selectedChat, setSelectedChat] = useState(null);

	useEffect(() => {
		if (currentTicket.uuid) {
			setSelectedChat(currentTicket.uuid);
		} else {
			setSelectedChat(null);
		}
	}, [currentTicket]);

	useEffect(() => {
		if (ticketId) {
			setSelectedChat(ticketId);
		}
	}, [ticketId]);

	const classes = useStyles({ selectedChat });

	return (
		<QueueSelectedProvider>
			<div className={classes.chatContainer}>
				<div className={classes.chatPapper}>
					{/* LISTA DE CHATS */}
					<div className={classes.contactsWrapper}>
						<TicketsManager />
					</div>

					{/* ÁREA DA CONVERSA */}
					<div className={classes.messagesWrapper}>
						{selectedChat ? (
							<Ticket />
						) : (
							<div className={classes.welcomeMsg}>
								<div className={classes.welcomeInner}>
									<center>
										<img className={classes.logo} width="48%" alt="" />
									</center>
									<div className={classes.welcomeTitle}>Central de Atendimentos</div>
									<div className={classes.welcomeText}>{i18n.t("chat.noTicketMessage")}</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</QueueSelectedProvider>
	);
};

export default TicketsCustom;
