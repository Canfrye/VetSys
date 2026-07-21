import { useCallback, useRef, useState } from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

import ConfirmDialogContext from "./ConfirmDialogContext";

const DEFAULT_STATE = {
  open: false,
  title: "Onay",
  message: "",
  confirmText: "Sil",
  cancelText: "Vazgeç",
  confirmColor: "error",
};

export function ConfirmDialogProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const resolverRef = useRef(null);

  const confirm = useCallback((options) => {
    const isString = typeof options === "string";

    const message = isString ? options : options?.message || "";
    const title = (!isString && options?.title) || DEFAULT_STATE.title;
    const confirmText =
      (!isString && options?.confirmText) || DEFAULT_STATE.confirmText;
    const cancelText =
      (!isString && options?.cancelText) || DEFAULT_STATE.cancelText;
    const confirmColor =
      (!isString && options?.confirmColor) || DEFAULT_STATE.confirmColor;

    return new Promise((resolve) => {
      resolverRef.current = resolve;

      setState({
        open: true,
        title,
        message,
        confirmText,
        cancelText,
        confirmColor,
      });
    });
  }, []);

  const resolve = useCallback((result) => {
    setState((prev) => ({ ...prev, open: false }));

    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      <Dialog
        open={state.open}
        onClose={() => resolve(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>{state.title}</DialogTitle>

        <DialogContent>
          <DialogContentText>{state.message}</DialogContentText>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => resolve(false)} color="inherit">
            {state.cancelText}
          </Button>

          <Button
            color={state.confirmColor || "error"}
            variant="contained"
            onClick={() => resolve(true)}
            autoFocus
          >
            {state.confirmText}
          </Button>
        </DialogActions>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

export default ConfirmDialogProvider;
