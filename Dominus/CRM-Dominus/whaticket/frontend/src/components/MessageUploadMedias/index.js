import React, { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Dialog,
    DialogContent,
    DialogActions,
    Typography,
    IconButton,
    TextField,
    Card,
    CardContent,
} from '@mui/material';
import { Cancel, Search, Send, SkipNext, SkipPrevious, Description } from '@material-ui/icons';
import AudioModal from '../AudioModal';
import { Document, Page, pdfjs } from 'react-pdf';
import { makeStyles } from "@material-ui/core/styles";
import { grey } from '@material-ui/core/colors';
import { InputAdornment, InputBase } from '@material-ui/core';
import clsx from "clsx";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const useStyles = makeStyles((theme) => ({
    root: {
        display: "flex",
        flexWrap: "wrap",
    },
    dialog: {
        "& .MuiDialog-paper": {
            backgroundColor: theme.mode === 'light' ? "#f0f2f5" : "#0b141a",
            color: theme.mode === 'light' ? "#3b4a54" : "#e9edef",
            maxWidth: '100%',
            height: '100%',
            margin: 0,
            borderRadius: 0,
        }
    },
    header: {
        display: "flex",
        alignItems: "center",
        padding: "16px 24px",
        height: 60,
    },
    content: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "0 !important",
    },
    imageArea: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        position: "relative",
        overflow: "hidden",
    },
    previewImage: {
        maxWidth: "100%",
        maxHeight: "100%",
        objectFit: "contain",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
    },
    footer: {
        padding: "20px 40px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
    },
    captionWrapper: {
        width: "100%",
        maxWidth: 800,
        background: theme.mode === 'light' ? "#ffffff" : "#2a3942",
        borderRadius: 8,
        padding: "10px 15px",
        display: "flex",
        alignItems: "center",
        marginBottom: 20,
    },
    input: {
        color: theme.mode === 'light' ? "#3b4a54" : "#d1d7db",
        flex: 1,
    },
    thumbnailsWrapper: {
        display: "flex",
        gap: 12,
        overflowX: "auto",
        padding: "10px 5px",
        width: "100%",
        justifyContent: "center",
        "&::-webkit-scrollbar": {
            height: 4,
        },
        "&::-webkit-scrollbar-thumb": {
            background: "rgba(255,255,255,0.2)",
            borderRadius: 10,
        }
    },
    thumbnail: {
        width: 48,
        height: 48,
        borderRadius: 6,
        cursor: "pointer",
        objectFit: "cover",
        border: "2px solid transparent",
        opacity: 0.6,
        transition: "all 0.2s",
        "&:hover": {
            opacity: 1,
        }
    },
    thumbnailActive: {
        border: "2px solid #00a884",
        opacity: 1,
        transform: "scale(1.1)",
    },
    sendButton: {
        position: "absolute",
        right: 40,
        bottom: 40,
        backgroundColor: "#00a884 !important",
        color: "#ffffff !important",
        width: 60,
        height: 60,
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        "&:hover": {
            backgroundColor: "#06cf9c !important",
        }
    },
    closeButton: {
        color: theme.mode === 'light' ? "#54656f" : "#aebac1",
    }
}));

const MessageUploadMedias = ({ isOpen, files, onClose, onSend, onCancelSelection }) => {
    const classes = useStyles();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [captions, setCaptions] = useState([]);
    const [numPages, setNumPages] = React.useState(null);

    useEffect(() => {
        if (files.length > 0) {
            setCaptions(files.map(() => ''));
        }
    }, [files]);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };

    const handleClose = () => {
        onClose();
        setCurrentIndex(0);
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < files.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handleCaptionChange = (e) => {
        const value = e.target.value;
        setCaptions((prevCaptions) => {
            const updatedCaptions = [...prevCaptions];
            updatedCaptions[currentIndex] = value;
            return updatedCaptions;
        });
    };

    const handleSend = () => {
        const selectedMedias = files.map((file, index) => ({
            file,
            caption: captions[index] || '',
        }));
        onSend(selectedMedias);
        handleClose();
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSend();
        }
        if (event.key === 'Escape') {
            onCancelSelection();
        }
    };

    const renderFilePreview = (file, index) => {
        if (file.type.startsWith('image')) {
            return (
                <img
                    alt="Preview"
                    src={URL.createObjectURL(file)}
                    className={classes.previewImage}
                />
            );
        }
        if (file.type === 'application/pdf') {
            return (
                <Document file={URL.createObjectURL(file)} onLoadSuccess={onDocumentLoadSuccess}>
                    <Page pageNumber={1} width={300} />
                </Document>
            );
        }
        if (file.type.startsWith('video')) {
            return (
                <video
                    src={URL.createObjectURL(file)}
                    className={classes.previewImage}
                    controls
                />
            );
        }
        return (
            <div style={{ textAlign: 'center' }}>
                <Description style={{ fontSize: 80, color: '#aebac1' }} />
                <Typography>{file.name}</Typography>
            </div>
        );
    };

    if (!isOpen || files.length === 0) return null;

    return (
        <Dialog
            open={isOpen}
            fullScreen
            onClose={handleClose}
            className={classes.dialog}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div className={classes.header}>
                    <IconButton onClick={onCancelSelection} className={classes.closeButton}>
                        <Cancel />
                    </IconButton>
                    <Typography variant="h6" style={{ marginLeft: 16, fontWeight: 500 }}>
                        Enviar mídia
                    </Typography>
                </div>

                <div className={classes.content}>
                    <div className={classes.imageArea}>
                        {renderFilePreview(files[currentIndex], currentIndex)}
                    </div>

                    <div className={classes.footer}>
                        <div className={classes.captionWrapper}>
                            <InputBase
                                placeholder="Adicione uma legenda..."
                                className={classes.input}
                                multiline
                                maxRows={4}
                                value={captions[currentIndex] || ''}
                                onChange={handleCaptionChange}
                                onKeyDown={handleKeyDown}
                                autoFocus
                            />
                        </div>

                        <div className={classes.thumbnailsWrapper}>
                            {files.map((file, index) => (
                                <img
                                    key={index}
                                    src={file.type.startsWith('image') ? URL.createObjectURL(file) : null}
                                    className={clsx(classes.thumbnail, currentIndex === index && classes.thumbnailActive)}
                                    onClick={() => setCurrentIndex(index)}
                                    alt="thumbnail"
                                />
                            ))}
                        </div>

                        <IconButton className={classes.sendButton} onClick={handleSend}>
                            <Send style={{ fontSize: 28, marginLeft: 4 }} />
                        </IconButton>
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default MessageUploadMedias;
