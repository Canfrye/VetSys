import { useContext } from "react";

import ConfirmDialogContext from "../context/ConfirmDialogContext";

export function useConfirm() {
  const context = useContext(ConfirmDialogContext);

  if (!context) {
    throw new Error(
      "useConfirm, ConfirmDialogProvider icinde kullanilmalidir."
    );
  }

  return context.confirm;
}

export default useConfirm;
