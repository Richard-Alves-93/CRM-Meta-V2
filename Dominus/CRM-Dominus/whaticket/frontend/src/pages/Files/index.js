import React, {
    useState,
    useEffect,
    useReducer,
    useCallback,
    useContext,
} from "react";
import { toast } from "react-toastify";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Button from "@material-ui/core/Button";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import IconButton from "@material-ui/core/IconButton";
import SearchIcon from "@material-ui/icons/Search";
import TextField from "@material-ui/core/TextField";
import InputAdornment from "@material-ui/core/InputAdornment";
import Box from "@material-ui/core/Box";
import Typography from "@material-ui/core/Typography";
import Chip from "@material-ui/core/Chip";

import DeleteOutlineIcon from "@material-ui/icons/DeleteOutline";
import EditIcon from "@material-ui/icons/Edit";

import api from "../../services/api";
import { i18n } from "../../translate/i18n";
import TableRowSkeleton from "../../components/TableRowSkeleton";
import FileModal from "../../components/FileModal";
import ConfirmationModal from "../../components/ConfirmationModal";
import toastError from "../../errors/toastError";
// import { SocketContext } from "../../context/Socket/SocketContext";
import { AuthContext } from "../../context/Auth/AuthContext";
import ForbiddenPage from "../../components/ForbiddenPage";

const reducer = (state, action) => {
    if (action.type === "LOAD_FILES") {
        const files = action.payload;
        const newFiles = [];

        files.forEach((fileList) => {
            const fileListIndex = state.findIndex((s) => s.id === fileList.id);
            if (fileListIndex !== -1) {
                state[fileListIndex] = fileList;
            } else {
                newFiles.push(fileList);
            }
        });

        return [...state, ...newFiles];
    }

    if (action.type === "UPDATE_FILES") {
        const fileList = action.payload;
        const fileListIndex = state.findIndex((s) => s.id === fileList.id);

        if (fileListIndex !== -1) {
            state[fileListIndex] = fileList;
            return [...state];
        } else {
            return [fileList, ...state];
        }
    }

    if (action.type === "DELETE_FILE") {
        const fileListId = action.payload;

        const fileListIndex = state.findIndex((s) => s.id === fileListId);
        if (fileListIndex !== -1) {
            state.splice(fileListIndex, 1);
        }
        return [...state];
    }

    if (action.type === "RESET") {
        return [];
    }
};

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
    controlsPaper: {
        marginBottom: theme.spacing(2),
        borderRadius: 14,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
        padding: theme.spacing(1.25),
        backgroundColor: theme.palette.background.paper,
    },
    controlsActions: {
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(1),
        alignItems: "center",
        justifyContent: "space-between",
    },
    searchField: {
        minWidth: 260,
        backgroundColor: theme.palette.background.default,
        borderRadius: 10,
        "& .MuiInputBase-input": {
            fontSize: "0.8rem",
            paddingTop: 10,
            paddingBottom: 10,
        },
    },
    actionButton: {
        minHeight: 40,
        borderRadius: 10,
        fontWeight: 600,
        fontSize: "0.75rem",
        padding: theme.spacing(0.8, 1.4),
        boxShadow: "0 6px 14px rgba(7, 64, 171, 0.14)",
    },
    mainPaper: {
        flex: 1,
        overflowY: "auto",
        ...theme.scrollbarStyles,
        borderRadius: 14,
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: "0 12px 26px rgba(17, 24, 39, 0.09)",
    },
    tableHeaderCell: {
        fontWeight: 700,
        color: theme.palette.text.secondary,
        backgroundColor:
            theme.palette.type === "dark"
                ? "rgba(255,255,255,0.04)"
                : "rgba(15, 23, 42, 0.03)",
        fontSize: "0.76rem",
    },
    tableCellText: {
        fontSize: "0.78rem",
    },
    actionIconButton: {
        border: `1px solid ${theme.palette.divider}`,
        margin: theme.spacing(0, 0.2),
    },
}));

const FileLists = () => {
    const classes = useStyles();

    //   const socketManager = useContext(SocketContext);
    const { user, socket } = useContext(AuthContext);


    const [loading, setLoading] = useState(false);
    const [pageNumber, setPageNumber] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedFileList, setSelectedFileList] = useState(null);
    const [deletingFileList, setDeletingFileList] = useState(null);
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [searchParam, setSearchParam] = useState("");
    const [files, dispatch] = useReducer(reducer, []);
    const [fileListModalOpen, setFileListModalOpen] = useState(false);

    const fetchFileLists = useCallback(async () => {
        try {
            const { data } = await api.get("/files/", {
                params: { searchParam, pageNumber },
            });
            dispatch({ type: "LOAD_FILES", payload: data.files });
            setHasMore(data.hasMore);
            setLoading(false);
        } catch (err) {
            toastError(err);
        }
    }, [searchParam, pageNumber]);

    useEffect(() => {
        dispatch({ type: "RESET" });
        setPageNumber(1);
    }, [searchParam]);

    useEffect(() => {
        setLoading(true);
        const delayDebounceFn = setTimeout(() => {
            fetchFileLists();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchParam, pageNumber, fetchFileLists]);

    useEffect(() => {
        // const socket = socketManager.GetSocket(user.companyId, user.id);

        const onFileEvent = (data) => {
            if (data.action === "update" || data.action === "create") {
                dispatch({ type: "UPDATE_FILES", payload: data.files });
            }

            if (data.action === "delete") {
                dispatch({ type: "DELETE_FILE", payload: +data.fileId });
            }
        };

        socket.on(`company-${user.companyId}-file`, onFileEvent);
        return () => {
            socket.off(`company-${user.companyId}-file`, onFileEvent);
        };
    }, [socket]);

    const handleOpenFileListModal = () => {
        setSelectedFileList(null);
        setFileListModalOpen(true);
    };

    const handleCloseFileListModal = () => {
        setSelectedFileList(null);
        setFileListModalOpen(false);
    };

    const handleSearch = (event) => {
        setSearchParam(event.target.value.toLowerCase());
    };

    const handleEditFileList = (fileList) => {
        setSelectedFileList(fileList);
        setFileListModalOpen(true);
    };

    const handleDeleteFileList = async (fileListId) => {
        try {
            await api.delete(`/files/${fileListId}`);
            toast.success(i18n.t("files.toasts.deleted"));
        } catch (err) {
            toastError(err);
        }
        setDeletingFileList(null);
        setSearchParam("");
        setPageNumber(1);

        dispatch({ type: "RESET" });
        setPageNumber(1);
        await fetchFileLists();
    };

    const loadMore = () => {
        setPageNumber((prevState) => prevState + 1);
    };

    const handleScroll = (e) => {
        if (!hasMore || loading) return;
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - (scrollTop + 100) < clientHeight) {
            loadMore();
        }
    };

    return (
        <div className={classes.pageRoot}>
            <ConfirmationModal
                title={deletingFileList && `${i18n.t("files.confirmationModal.deleteTitle")}`}
                open={confirmModalOpen}
                onClose={setConfirmModalOpen}
                onConfirm={() => handleDeleteFileList(deletingFileList.id)}
            >
                {i18n.t("files.confirmationModal.deleteMessage")}
            </ConfirmationModal>
            <FileModal
                open={fileListModalOpen}
                onClose={handleCloseFileListModal}
                reload={fetchFileLists}
                aria-labelledby="form-dialog-title"
                fileListId={selectedFileList && selectedFileList.id}
            />
            {user.profile === "user" ?
                <ForbiddenPage />
                :
                <>
                    <Paper className={classes.pageHeader} elevation={0}>
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            flexWrap="wrap"
                            style={{ gap: 8 }}
                        >
                            <Box>
                                <Typography className={classes.pageHeaderTitle}>
                                    {i18n.t("files.title")}
                                </Typography>
                                <Typography className={classes.pageHeaderSubtitle}>
                                    Organize suas listas de arquivos com acesso rápido e gestão centralizada.
                                </Typography>
                            </Box>
                            <Chip className={classes.headerChip} label={`${files.length} listas`} />
                        </Box>
                    </Paper>
                    <Paper className={classes.controlsPaper} variant="outlined">
                        <div className={classes.controlsActions}>
                            <TextField
                                className={classes.searchField}
                                placeholder={i18n.t("contacts.searchPlaceholder")}
                                type="search"
                                value={searchParam}
                                onChange={handleSearch}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon style={{ color: "gray" }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button
                                className={classes.actionButton}
                                variant="contained"
                                color="primary"
                                onClick={handleOpenFileListModal}
                            >
                                {i18n.t("files.buttons.add")}
                            </Button>
                        </div>
                    </Paper>
                    <Paper
                        className={classes.mainPaper}
                        variant="outlined"
                        onScroll={handleScroll}
                    >
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell className={classes.tableHeaderCell} align="center">{i18n.t("files.table.name")}</TableCell>
                                    <TableCell className={classes.tableHeaderCell} align="center">
                                        {i18n.t("files.table.actions")}
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <>
                                    {files.map((fileList) => (
                                        <TableRow key={fileList.id}>
                                            <TableCell className={classes.tableCellText} align="center">
                                                {fileList.name}
                                            </TableCell>
                                            <TableCell align="center">
                                                <IconButton className={classes.actionIconButton} size="small" onClick={() => handleEditFileList(fileList)}>
                                                    <EditIcon />
                                                </IconButton>

                                                <IconButton
                                                    className={classes.actionIconButton}
                                                    size="small"
                                                    onClick={(e) => {
                                                        setConfirmModalOpen(true);
                                                        setDeletingFileList(fileList);
                                                    }}
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && <TableRowSkeleton columns={4} />}
                                </>
                            </TableBody>
                        </Table>
                    </Paper>
                </>}
        </div>
    );
};

export default FileLists;
