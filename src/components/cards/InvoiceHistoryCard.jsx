import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Typography,
} from "@mui/material";

import EmptyState from "../EmptyState";
import { formatCurrency } from "../../utils/invoiceCalc";
import {
  getInvoicePaymentStatusColor,
  normalizePaymentStatus,
} from "../../utils/invoiceStatus";

function InvoiceHistoryCard({ invoices = [] }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" fontWeight="bold">
          Fatura Geçmişi
        </Typography>

        <Divider sx={{ my: 2 }} />

        {invoices.length === 0 ? (
          <EmptyState compact message="Fatura kaydı bulunmuyor." />
        ) : (
          invoices.map((invoice) => (
            <Box
              key={invoice.id}
              sx={{
                p: 2,
                mb: 2,
                border: "1px solid #eee",
                borderRadius: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
                minWidth: 0,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight="bold" noWrap>
                  {invoice.invoiceNumber}
                </Typography>

                <Typography color="text.secondary" variant="body2">
                  Tarih: {invoice.date || "-"}
                </Typography>

                <Typography variant="body2">
                  Genel Toplam: {formatCurrency(invoice.total)}
                </Typography>
              </Box>

              <Chip
                label={normalizePaymentStatus(
                  invoice.paymentStatus || "Bekliyor"
                )}
                color={getInvoicePaymentStatusColor(
                  invoice.paymentStatus || "Bekliyor"
                )}
                size="small"
              />
            </Box>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default InvoiceHistoryCard;
