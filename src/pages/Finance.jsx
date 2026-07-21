import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, Grid, Typography } from "@mui/material";

import PageLoading from "../components/PageLoading";
import LineChart from "../components/charts/LineChart";
import PieChart from "../components/charts/PieChart";
import BarChart from "../components/charts/BarChart";
import DashboardListCard from "../components/dashboard/DashboardListCard";
import RankedList from "../components/reports/RankedList";
import ReportSectionCard from "../components/reports/ReportSectionCard";

import {
  getTodayCollection,
  getOutstandingInvoices,
  getPayments,
} from "../services/paymentService";
import { getMedicationConsumptionReport } from "../services/stockService";
import { getRevenueBreakdown } from "../services/analyticsService";
import { getInvoices } from "../services/invoiceService";
import { getPresetRange } from "../utils/dateRange";
import { formatCurrency } from "../utils/invoiceCalc";
import {
  buildDailyCollectionSeries,
  groupPaymentsByMethod,
  sumPayments,
} from "../utils/paymentUtils";
import {
  getTodayProfitability,
  getMonthProfitability,
  rankInvoiceItemsByRevenue,
  rankInvoiceItemsByProfit,
} from "../utils/profitability";

import "../styles/customer.css";
import "../styles/dashboard.css";

function Finance() {
  const [loading, setLoading] = useState(true);
  const [todayCollection, setTodayCollection] = useState(null);
  const [outstanding, setOutstanding] = useState(null);
  const [payments, setPayments] = useState([]);
  const [monthRevenue, setMonthRevenue] = useState(null);
  const [medicationReport, setMedicationReport] = useState({
    total: 0,
    items: [],
  });
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadFinance() {
      setLoading(true);

      const monthRange = getPresetRange("month");

      const [
        todayData,
        outstandingData,
        paymentsData,
        monthData,
        medicationData,
        invoicesData,
      ] = await Promise.all([
        getTodayCollection(),
        getOutstandingInvoices(),
        getPayments(),
        getRevenueBreakdown(monthRange),
        getMedicationConsumptionReport(monthRange),
        getInvoices(),
      ]);

      if (cancelled) return;

      setTodayCollection(todayData);
      setOutstanding(outstandingData);
      setPayments(paymentsData);
      setMonthRevenue(monthData);
      setMedicationReport(medicationData);
      setInvoices(invoicesData);
      setLoading(false);
    }

    loadFinance();

    return () => {
      cancelled = true;
    };
  }, []);

  const series30 = useMemo(
    () => buildDailyCollectionSeries(payments, 30),
    [payments]
  );

  const methodGroups = useMemo(
    () => groupPaymentsByMethod(payments),
    [payments]
  );

  const methodPie = useMemo(() => {
    const labels = Object.keys(methodGroups);
    const data = labels.map((key) => methodGroups[key]);
    return { labels, data };
  }, [methodGroups]);

  const unpaidTotal = outstanding?.totalDebt || 0;

  const todayProfit = useMemo(
    () => getTodayProfitability(invoices),
    [invoices]
  );

  const monthProfit = useMemo(
    () => getMonthProfitability(invoices),
    [invoices]
  );

  const monthRange = useMemo(() => getPresetRange("month"), []);

  const topServicesRevenue = useMemo(
    () =>
      rankInvoiceItemsByRevenue(invoices, {
        ...monthRange,
        types: ["Muayene", "Tedavi"],
        limit: 5,
      }),
    [invoices, monthRange]
  );

  const topVaccinesRevenue = useMemo(
    () =>
      rankInvoiceItemsByRevenue(invoices, {
        ...monthRange,
        types: ["Aşı"],
        limit: 5,
      }),
    [invoices, monthRange]
  );

  const topProductsRevenue = useMemo(
    () =>
      rankInvoiceItemsByRevenue(invoices, {
        ...monthRange,
        types: ["Ürün"],
        limit: 5,
      }),
    [invoices, monthRange]
  );

  const topProductsProfit = useMemo(
    () =>
      rankInvoiceItemsByProfit(invoices, {
        ...monthRange,
        types: ["Ürün"],
        limit: 5,
      }),
    [invoices, monthRange]
  );

  const topServicesProfit = useMemo(
    () =>
      rankInvoiceItemsByProfit(invoices, {
        ...monthRange,
        types: ["Muayene", "Tedavi"],
        limit: 5,
      }),
    [invoices, monthRange]
  );

  const topVaccinesProfit = useMemo(
    () =>
      rankInvoiceItemsByProfit(invoices, {
        ...monthRange,
        types: ["Aşı"],
        limit: 5,
      }),
    [invoices, monthRange]
  );

  if (loading) {
    return <PageLoading message="Finans verileri yükleniyor..." />;
  }

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Finans</h1>
          <p>Gün sonu kasa, karlılık ve tahsilat özeti</p>
        </div>
      </div>

      <Typography variant="h6" fontWeight={700} mb={2}>
        Gün Sonu Kasa
      </Typography>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Bugünkü Tahsilat</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(todayCollection?.total || 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Nakit</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(todayCollection?.nakit || 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Kart</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(todayCollection?.kart || 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Havale / EFT</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(todayCollection?.havale || 0)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Toplam (Bugün)</Typography>
            <Typography variant="h5" fontWeight={800} color="primary">
              {formatCurrency(todayCollection?.total || 0)}
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Typography variant="h6" fontWeight={700} mb={2}>
        Karlılık
      </Typography>

      <div className="stats-grid" style={{ marginBottom: 28 }}>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Günlük Tahmini Kar</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(todayProfit.profit)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Aylık Tahmini Kar</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(monthProfit.profit)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Toplam Satış (Ay)</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(monthProfit.sale)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Toplam Maliyet (Ay)</Typography>
            <Typography variant="h5" fontWeight={800}>
              {formatCurrency(monthProfit.cost)}
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Typography color="text.secondary">Ortalama Kar Marjı</Typography>
            <Typography variant="h5" fontWeight={800} color="primary">
              %{monthProfit.margin}
            </Typography>
          </CardContent>
        </Card>
      </div>

      <Typography variant="h6" fontWeight={700} mb={2}>
        Finans Raporları
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>
                Son 30 Gün Tahsilat
              </Typography>
              <LineChart
                labels={series30.map((p) => p.date)}
                data={series30.map((p) => p.amount)}
                datasetLabel="Tahsilat"
                color="#059669"
                emptyMessage="Son 30 günde tahsilat yok."
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>
                Ödeme Yöntemleri Dağılımı
              </Typography>
              <PieChart
                labels={methodPie.labels}
                data={methodPie.data}
                emptyMessage="Ödeme kaydı yok."
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>
                Aylık Ciro (Fatura)
              </Typography>
              <BarChart
                labels={(monthRevenue?.series || []).map((p) => p.date)}
                data={(monthRevenue?.series || []).map((p) => p.amount)}
                datasetLabel="Ciro"
                emptyMessage="Bu ay fatura cirosu yok."
              />
              <Typography variant="body2" color="text.secondary" mt={1}>
                Aylık toplam: {formatCurrency(monthRevenue?.total || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>
                Tahsil Edilmeyen Tutar
              </Typography>
              <Typography variant="h3" fontWeight={800} color="error.main">
                {formatCurrency(unpaidTotal)}
              </Typography>
              <Typography color="text.secondary" mt={1}>
                {outstanding?.invoiceCount || 0} fatura ·{" "}
                {outstanding?.customerCount || 0} müşteri
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={2}>
                Tüm zamanlar tahsilat: {formatCurrency(sumPayments(payments))}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h6" fontWeight={700} mb={2}>
        Gelir ve Kar Sıralamaları (Bu Ay)
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6} lg={4}>
          <ReportSectionCard title="En Çok Gelir Getiren Hizmetler">
            <RankedList
              rows={topServicesRevenue}
              emptyMessage="Hizmet satışı yok."
              renderValue={(row) => formatCurrency(row.sale)}
            />
          </ReportSectionCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <ReportSectionCard title="En Çok Gelir Getiren Aşılar">
            <RankedList
              rows={topVaccinesRevenue}
              emptyMessage="Aşı satışı yok."
              renderValue={(row) => formatCurrency(row.sale)}
            />
          </ReportSectionCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <ReportSectionCard title="En Çok Gelir Getiren Ürünler">
            <RankedList
              rows={topProductsRevenue}
              emptyMessage="Ürün satışı yok."
              renderValue={(row) => formatCurrency(row.sale)}
            />
          </ReportSectionCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <ReportSectionCard title="En Karlı Ürünler">
            <RankedList
              rows={topProductsProfit}
              emptyMessage="Ürün karlılığı yok."
              renderValue={(row) =>
                `${formatCurrency(row.profit)} · %${row.margin}`
              }
            />
          </ReportSectionCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <ReportSectionCard title="En Karlı Hizmetler">
            <RankedList
              rows={topServicesProfit}
              emptyMessage="Hizmet karlılığı yok."
              renderValue={(row) =>
                `${formatCurrency(row.profit)} · %${row.margin}`
              }
            />
          </ReportSectionCard>
        </Grid>
        <Grid item xs={12} md={6} lg={4}>
          <ReportSectionCard title="En Karlı Aşılar">
            <RankedList
              rows={topVaccinesProfit}
              emptyMessage="Aşı karlılığı yok."
              renderValue={(row) =>
                `${formatCurrency(row.profit)} · %${row.margin}`
              }
            />
          </ReportSectionCard>
        </Grid>
      </Grid>

      <div className="dashboard-lists">
        <DashboardListCard
          title="Tahsil Edilmeyen Faturalar"
          items={(outstanding?.items || []).slice(0, 10).map((row) => ({
            ...row,
            id: row.invoice.id,
          }))}
          keyField="id"
          emptyMessage="Bekleyen tahsilat yok."
          style={{ width: "100%" }}
          renderItem={(row) => (
            <>
              <strong>
                {row.invoice.invoiceNumber} · {row.invoice.ownerName}
              </strong>
              <span>
                Kalan {formatCurrency(row.remaining)} · {row.status}
              </span>
            </>
          )}
        />
      </div>

      <Typography variant="h6" fontWeight={700} mb={2} mt={3}>
        İlaç Tüketim Raporu (Bu Ay)
      </Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary">Toplam Tüketim</Typography>
              <Typography variant="h4" fontWeight={800}>
                {medicationReport.total || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Birim toplamı (çıkış + reçete)
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography fontWeight={700} gutterBottom>
                Ürün Bazlı Tüketim
              </Typography>
              <BarChart
                labels={(medicationReport.items || [])
                  .slice(0, 8)
                  .map((i) => i.name)}
                data={(medicationReport.items || [])
                  .slice(0, 8)
                  .map((i) => i.quantity)}
                datasetLabel="Tüketim"
                emptyMessage="Bu ay ilaç tüketimi yok."
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <div className="dashboard-lists">
        <DashboardListCard
          title="İlaç Tüketim Listesi"
          items={(medicationReport.items || []).slice(0, 12)}
          keyField="name"
          emptyMessage="Tüketim kaydı yok."
          style={{ width: "100%" }}
          renderItem={(row) => (
            <>
              <strong>{row.name}</strong>
              <span>
                {row.quantity} birim · {row.movements} hareket
              </span>
            </>
          )}
        />
      </div>
    </div>
  );
}

export default Finance;
