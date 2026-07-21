import { useEffect, useState } from "react";

import Drawer from "../components/Drawer";
import InvoiceForm from "../components/forms/InvoiceForm";
import InvoicePaymentsPanel from "../components/forms/InvoicePaymentsPanel";
import InvoiceTable from "../components/tables/InvoiceTable";
import EmptyState from "../components/EmptyState";

import "../styles/customer.css";

import { getAnimals } from "../services/animalService";

import {
  addInvoice,
  updateInvoice,
  deleteInvoice,
} from "../services/invoiceService";

import {
  getInvoicesWithBalances,
  calculateInvoiceBalance,
  calculateInvoicePaymentStatus,
  addPayment,
  deletePayment,
} from "../services/paymentService";

import { getSettings } from "../services/settingsService";
import { generateInvoicePdf } from "../utils/invoicePdf";
import { generatePaymentReceiptPdf } from "../utils/paymentPdf";
import {
  INVOICE_WRITE_ROLES,
  PAYMENT_DELETE_ROLES,
  PAYMENT_WRITE_ROLES,
} from "../utils/roles";

import { useAuth } from "../hooks/useAuth";
import { useConfirm } from "../hooks/useConfirm";
import { useNotification } from "../hooks/useNotification";

function Invoices() {
  const confirm = useConfirm();
  const { notify } = useNotification();
  const { hasRole } = useAuth();

  const canWriteInvoice = hasRole(INVOICE_WRITE_ROLES);
  const canWritePayment = hasRole(PAYMENT_WRITE_ROLES);
  const canDeletePayment = hasRole(PAYMENT_DELETE_ROLES);

  const [invoices, setInvoices] = useState([]);
  const [animals, setAnimals] = useState([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [newFormKey, setNewFormKey] = useState(0);

  const [paymentDrawerOpen, setPaymentDrawerOpen] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [invoicePayments, setInvoicePayments] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [invoicesData, animalsData] = await Promise.all([
      getInvoicesWithBalances(),
      getAnimals(),
    ]);

    setInvoices(invoicesData);
    setAnimals(animalsData);
  }

  async function handleSave(invoice) {
    if (!canWriteInvoice) return;

    if (editingInvoice) {
      await updateInvoice({
        ...editingInvoice,
        ...invoice,
      });
      notify("Fatura güncellendi.");
    } else {
      await addInvoice(invoice);
      notify("Fatura oluşturuldu.");
    }

    await loadData();

    setEditingInvoice(null);
    setDrawerOpen(false);
  }

  function handleEdit(invoice) {
    if (!canWriteInvoice) return;

    setEditingInvoice(invoice);
    setDrawerOpen(true);
  }

  async function handleDelete(id) {
    if (!canWriteInvoice) return;

    const confirmed = await confirm("Fatura ve bağlı ödemeler silinsin mi?");

    if (!confirmed) return;

    await deleteInvoice(id);

    await loadData();
    notify("Fatura silindi.");
  }

  async function handleDownloadPdf(invoice) {
    const settings = await getSettings();
    const status = await calculateInvoicePaymentStatus(invoice.id);

    generateInvoicePdf({ ...invoice, paymentStatus: status }, settings);
  }

  async function handleOpenPayments(invoice) {
    const balance = await calculateInvoiceBalance(invoice.id);
    setPaymentInvoice({
      ...(balance.invoice || invoice),
      paymentStatus: balance.status,
      paidAmount: balance.paid,
      remainingAmount: balance.remaining,
    });
    setInvoicePayments(balance.payments || []);
    setPaymentDrawerOpen(true);
  }

  async function refreshPaymentDrawer() {
    if (!paymentInvoice) return;

    const balance = await calculateInvoiceBalance(paymentInvoice.id);

    setPaymentInvoice({
      ...(balance.invoice || paymentInvoice),
      paymentStatus: balance.status,
      paidAmount: balance.paid,
      remainingAmount: balance.remaining,
    });
    setInvoicePayments(balance.payments || []);
    await loadData();
  }

  async function handleAddPayment(payment) {
    if (!canWritePayment) return;

    try {
      await addPayment(payment);
      await refreshPaymentDrawer();
      notify("Ödeme kaydedildi.");
    } catch (error) {
      notify(error?.message || "Ödeme kaydedilemedi.", "error");
    }
  }

  async function handleDeletePayment(id) {
    if (!canDeletePayment) return;

    const confirmed = await confirm("Ödeme silinsin mi?");

    if (!confirmed) return;

    await deletePayment(id);
    await refreshPaymentDrawer();
    notify("Ödeme silindi.");
  }

  async function handleDownloadReceipt(payment) {
    const settings = await getSettings();
    const status = paymentInvoice?.id
      ? await calculateInvoicePaymentStatus(paymentInvoice.id)
      : paymentInvoice?.paymentStatus;

    generatePaymentReceiptPdf(payment, settings, {
      ...paymentInvoice,
      paymentStatus: status,
    });
  }

  function handleClose() {
    setDrawerOpen(false);
    setEditingInvoice(null);
  }

  function handleClosePayments() {
    setPaymentDrawerOpen(false);
    setPaymentInvoice(null);
    setInvoicePayments([]);
  }

  return (
    <div className="customer-page">

      <div className="customer-header">
        <div>
          <h1>Faturalar</h1>
          <p>Hizmet ve ürün faturaları, ödeme takibi</p>
        </div>

        {canWriteInvoice && (
          <button
            className="add-btn"
            onClick={() => {
              setEditingInvoice(null);
              setNewFormKey((key) => key + 1);
              setDrawerOpen(true);
            }}
          >
            + Yeni Fatura
          </button>
        )}
      </div>

      <div className="customer-card">
        {invoices.length === 0 ? (
          <EmptyState message="Henüz kayıtlı fatura yok. + Yeni Fatura ile ekleyebilirsiniz." />
        ) : (
          <InvoiceTable
            invoices={invoices}
            onEdit={canWriteInvoice ? handleEdit : undefined}
            onDelete={canWriteInvoice ? handleDelete : undefined}
            onDownloadPdf={handleDownloadPdf}
            onPayments={handleOpenPayments}
            canWrite={canWriteInvoice}
          />
        )}
      </div>

      <Drawer
        open={drawerOpen}
        title={editingInvoice ? "Fatura Düzenle" : "Yeni Fatura"}
        onClose={handleClose}
      >
        <InvoiceForm
          key={editingInvoice?.id || `new-${newFormKey}`}
          invoice={editingInvoice}
          animals={animals}
          isEditing={!!editingInvoice}
          onSave={handleSave}
        />
      </Drawer>

      <Drawer
        open={paymentDrawerOpen}
        title={
          paymentInvoice
            ? `Tahsilat · ${paymentInvoice.invoiceNumber}`
            : "Tahsilat"
        }
        onClose={handleClosePayments}
      >
        {paymentInvoice && (
          <InvoicePaymentsPanel
            key={`${paymentInvoice.id}-${invoicePayments.length}-${paymentInvoice.remainingAmount ?? 0}`}
            invoice={paymentInvoice}
            payments={invoicePayments}
            onAddPayment={handleAddPayment}
            onDeletePayment={handleDeletePayment}
            onDownloadReceipt={handleDownloadReceipt}
            canWrite={canWritePayment}
            canDelete={canDeletePayment}
          />
        )}
      </Drawer>

    </div>
  );
}

export default Invoices;
