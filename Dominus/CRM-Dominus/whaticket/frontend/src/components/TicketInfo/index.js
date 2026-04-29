import React from "react";
import { i18n } from "../../translate/i18n";
import { Avatar, IconButton, Tooltip, Typography, makeStyles } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import CloseIcon from "@material-ui/icons/Close";

const useStyles = makeStyles(theme => ({
	headerInfo: {
		display: 'flex',
		alignItems: 'center',
		padding: '0 8px',
		flex: 1,
		overflow: 'hidden'
	},
	avatar: {
		width: 40,
		height: 40,
		marginRight: 12,
		border: `2px solid ${theme.mode === 'light' ? '#FFFFFF' : '#1e293b'}`,
		boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
	},
	textContainer: {
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		flex: 1
	},
	contactName: {
		fontWeight: 700,
		fontSize: '1rem',
		lineHeight: 1.2,
		color: theme.mode === 'light' ? '#0f172a' : '#f8fafc',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis'
	},
	contactStatus: {
		color: '#64748b',
		fontWeight: 500,
		fontSize: '0.75rem'
	}
}));

const TicketInfo = ({ contact, ticket, onToggleSearch, isSearching }) => {
	const classes = useStyles();

	return (
		<div className={classes.headerInfo}>
			<Avatar
				src={contact?.urlPicture}
				alt={contact?.name}
				className={classes.avatar}
			/>
			<div className={classes.textContainer}>
				<Typography className={classes.contactName}>
					{contact?.name || '(sem contato)'}
				</Typography>
				<Typography className={classes.contactStatus}>
					{ticket.user ? `${i18n.t("messagesList.header.assignedTo")} ${ticket.user.name}` : 'Aguardando atendimento'}
				</Typography>
			</div>
			<Tooltip title={isSearching ? "Fechar busca" : "Buscar na conversa"}>
				<IconButton
					size="small"
					onClick={(e) => {
						e.stopPropagation();
						if (onToggleSearch) onToggleSearch();
					}}
					style={{ marginLeft: 8, color: '#64748b' }}
				>
					{isSearching ? <CloseIcon fontSize="small" /> : <SearchIcon fontSize="small" />}
				</IconButton>
			</Tooltip>
		</div>
	);
};

export default TicketInfo;
