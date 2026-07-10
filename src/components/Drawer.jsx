import "../styles/drawer.css";

function Drawer({ open, title, children, onClose }) {
  return (
    <>
      {open && <div className="drawer-overlay" onClick={onClose}></div>}

      <div className={`drawer ${open ? "open" : ""}`}>
        <div className="drawer-header">
          <h2>{title}</h2>

          <button onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {children}
        </div>
      </div>
    </>
  );
}

export default Drawer;