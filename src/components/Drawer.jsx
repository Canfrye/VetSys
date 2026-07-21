import CloseIcon from "@mui/icons-material/Close";
import { IconButton, Typography } from "@mui/material";

import "../styles/drawer.css";

function Drawer({ open, title, children, onClose }) {
  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose} />}

      <div className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <Typography variant="h6" component="h2" fontWeight={700} noWrap>
            {title}
          </Typography>

          <IconButton
            aria-label="Kapat"
            onClick={onClose}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="drawer-body">{children}</div>
      </div>
    </>
  );
}

export default Drawer;
