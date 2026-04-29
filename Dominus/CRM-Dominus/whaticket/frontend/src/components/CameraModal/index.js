import React, { useState } from 'react';
import {
    Dialog,
    IconButton,
    Typography,
    makeStyles,
    useTheme
} from '@material-ui/core';
import { Close, CameraAlt } from '@material-ui/icons';
import Camera, { FACING_MODES } from 'react-html5-camera-photo';
import 'react-html5-camera-photo/build/css/index.css';

const useStyles = makeStyles((theme) => ({
    dialog: {
        "& .MuiDialog-paper": {
            backgroundColor: "#0b141a",
            color: "#e9edef",
            overflow: "hidden",
        }
    },
    header: {
        display: "flex",
        alignItems: "center",
        padding: "16px 24px",
        height: 60,
        zIndex: 10,
    },
    content: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
    },
    cameraWrapper: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "& .react-html5-camera-photo": {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        "& video": {
            width: "100% !important",
            height: "auto !important",
            maxWidth: "100vw",
            maxHeight: "calc(100vh - 60px)",
            objectFit: "cover",
        }
    },
    captureButton: {
        position: "absolute",
        bottom: 40,
        backgroundColor: "#00a884 !important",
        color: "#ffffff !important",
        width: 70,
        height: 70,
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: 20,
        "& svg": {
            fontSize: 32,
        },
        "&:hover": {
            backgroundColor: "#06cf9c !important",
            transform: "scale(1.05)",
        }
    },
    closeButton: {
        color: "#aebac1",
        marginRight: 16,
    }
}));

const ModalCamera = ({ isOpen, onRequestClose, onCapture }) => {
    const classes = useStyles();
    const [capturedImage, setCapturedImage] = useState(null);

    const handleTakePhoto = (dataUri) => {
        setCapturedImage(dataUri);
        // Ao capturar, já envia e fecha
        fetch(dataUri)
            .then((res) => res.blob())
            .then((blob) => {
                onCapture(blob);
                onRequestClose();
                setCapturedImage(null);
            });
    };

    return (
        <Dialog
            open={isOpen}
            fullScreen
            onClose={onRequestClose}
            className={classes.dialog}
        >
            <div className={classes.header}>
                <IconButton onClick={onRequestClose} className={classes.closeButton}>
                    <Close />
                </IconButton>
                <Typography variant="h6" style={{ fontWeight: 500 }}>
                    Tirar foto
                </Typography>
            </div>

            <div className={classes.content}>
                <div className={classes.cameraWrapper}>
                    <Camera
                        onTakePhoto={handleTakePhoto}
                        idealFacingMode={FACING_MODES.ENVIRONMENT}
                        isImageMirror={false}
                        isDisplayStartCameraError={true}
                        size={null}
                    />
                </div>

                <style>{`
                    /* Estilizando o botão original da biblioteca para ser o círculo branco */
                    .react-html5-camera-photo > button {
                        position: absolute;
                        bottom: 40px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 70px;
                        height: 70px;
                        border-radius: 50%;
                        border: 4px solid white;
                        background-color: rgba(255, 255, 255, 0.3);
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 100;
                        transition: all 0.2s;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                    }
                    .react-html5-camera-photo > button:hover {
                        background-color: rgba(255, 255, 255, 0.5);
                        transform: translateX(-50%) scale(1.05);
                    }
                    /* Remove o ícone padrão se houver */
                    .react-html5-camera-photo > button::before {
                        content: '';
                        width: 50px;
                        height: 50px;
                        background-color: white;
                        border-radius: 50%;
                    }
                `}</style>
            </div>
        </Dialog>
    );
};

export default ModalCamera;
