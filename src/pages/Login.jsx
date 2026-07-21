import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Alert, Button, TextField, Typography } from "@mui/material";

import { useAuth } from "../hooks/useAuth";
import { getErrorMessage, normalizeApiErrorMessage } from "../utils/apiError";

import "../styles/auth.css";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Kullanıcı adı ve şifre giriniz.");
      return;
    }

    setSubmitting(true);

    try {
      await login(username, password);

      const redirectTo = location.state?.from?.pathname || "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(normalizeApiErrorMessage(err) || getErrorMessage(err, "Giriş yapılamadı."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">
          🐾 <span>VetSys</span>
        </div>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Veteriner Klinik Yönetim Sistemi
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Kullanıcı Adı"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          sx={{ mb: 2 }}
          autoFocus
        />

        <TextField
          fullWidth
          type="password"
          label="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Giriş yapılıyor..." : "Giriş Yap"}
        </Button>

        <div className="auth-demo-hint">
          <Typography variant="caption" color="text.secondary">
            Demo: admin/admin123 · veteriner/vet123 · resepsiyon/resepsiyon123
          </Typography>
        </div>
      </form>
    </div>
  );
}

export default Login;
