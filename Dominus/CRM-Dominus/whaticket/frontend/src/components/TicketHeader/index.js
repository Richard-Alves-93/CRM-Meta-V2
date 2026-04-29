import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import TicketHeaderSkeleton from "../TicketHeaderSkeleton";

const useStyles = makeStyles(theme => ({
	ticketHeader: {
		display: "flex",
		backgroundColor: theme.mode === "light" ? "#FFFFFF" : "#0f172a",
		flex: "none",
		borderBottom: `1px solid ${theme.mode === "light" ? "#E5E7EB" : "rgba(255,255,255,0.05)"}`,
		height: "65px",
		alignItems: "center",
		padding: "0 8px",
		[theme.breakpoints.down("sm")]: {
			height: '60px'
		},
	},
}));

const TicketHeader = ({ loading, children }) => {
	const classes = useStyles();

	return (
		<>
			{loading ? (
				<TicketHeaderSkeleton />
			) : (
				<div className={classes.ticketHeader}>
					{children}
				</div>
			)}
		</>
	);
};

export default TicketHeader;
