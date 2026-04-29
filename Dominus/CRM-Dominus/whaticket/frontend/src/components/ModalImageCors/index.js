import React, { useState, useEffect } from "react";
import { makeStyles } from "@material-ui/core/styles";

import ModalImage from "react-modal-image";
import api from "../../services/api";

const useStyles = makeStyles(theme => ({
	messageMedia: {
		objectFit: "cover",
		width: 250,
		height: "auto", // Redimensionar automaticamente a altura para manter a proporção
		borderTopLeftRadius: 8,
		borderTopRightRadius: 8,
		borderBottomLeftRadius: 8,
		borderBottomRightRadius: 8,
	}
}));

const ModalImageCors = ({ imageUrl }) => {
	const classes = useStyles();
	const [fetching, setFetching] = useState(true);
	const [blobUrl, setBlobUrl] = useState("");

	useEffect(() => {
		if (!imageUrl) return;

		let objectUrl = null;
		const fetchImage = async () => {
			try {
				// Some records can contain malformed URLs and crash XHR open().
				// If URL parsing fails, keep the original URL as fallback.
				new URL(imageUrl, window.location.origin);
				const { data, headers } = await api.get(imageUrl, {
					responseType: "blob",
				});
				objectUrl = window.URL.createObjectURL(
					new Blob([data], { type: headers["content-type"] })
				);
				setBlobUrl(objectUrl);
			} catch (error) {
				setBlobUrl(imageUrl);
			} finally {
				setFetching(false);
			}
		};
		fetchImage();

		return () => {
			if (objectUrl) {
				window.URL.revokeObjectURL(objectUrl);
			}
		};
	}, [imageUrl]);

	return (
		<ModalImage
			className={classes.messageMedia}
			smallSrcSet={fetching ? imageUrl : blobUrl}
			medium={fetching ? imageUrl : blobUrl}
			large={fetching ? imageUrl : blobUrl}
			alt="image"
			showRotate={true}
		/>
	);
};

export default ModalImageCors;
