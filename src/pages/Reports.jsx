import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import LineChart from "../components/charts/LineChart";
import BarChart from "../components/charts/BarChart";
import PieChart from "../components/charts/PieChart";
import ReportSectionCard from "../components/reports/ReportSectionCard";
import RankedList from "../components/reports/RankedList";
import PageLoading from "../components/PageLoading";

import {
  fetchAnalyticsDataset,
  computeBusinessIntelligence,
  getAllowedReportTabs,
  getPresetRange,
} from "../services/analyticsService";
import { generateReportPdf } from "../utils/reportPdf";
import { formatCurrency } from "../utils/invoiceCalc";
import { exportToCsv } from "../utils/csvExport";
import { DATE_RANGE_PRESETS } from "../utils/dateRange";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { ROLES } from "../utils/roles";
import { normalizeApiErrorMessage } from "../utils/apiError";

import "../styles/customer.css";

const TAB_META = [
  { id: "overview", label: "Genel" },
  { id: "finance", label: "Finans" },
  { id: "veterinarian", label: "Veteriner Performansı" },
  { id: "patients", label: "Hastalar" },
  { id: "stock", label: "Stok" },
  { id: "vaccines", label: "Aşılar" },
];

function KpiCard({ title, value, subtitle }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold" noWrap title={String(value)}>
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Reports() {
  const { user } = useAuth();
  const { notify } = useNotification();

  const allowedTabs = useMemo(
    () => getAllowedReportTabs(user?.role),
    [user?.role]
  );

  const [tab, setTab] = useState(allowedTabs[0] || "overview");
  const [loading, setLoading] = useState(true);
  const [dataset, setDataset] = useState(null);

  const [rangePreset, setRangePreset] = useState("month");
  const [range, setRange] = useState(() => getPresetRange("month"));

  const activeTab = allowedTabs.includes(tab)
    ? tab
    : allowedTabs[0] || "overview";

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      try {
        const data = await fetchAnalyticsDataset();
        if (cancelled) return;
        setDataset(data);
      } catch (error) {
        if (!cancelled) {
          notify(normalizeApiErrorMessage(error), "error");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [notify]);

  const report = useMemo(() => {
    if (!dataset) return null;
    const built = computeBusinessIntelligence(dataset, range, {
      user: user?.role === ROLES.VETERINARIAN ? user : null,
    });
    built.todayFinance = computeBusinessIntelligence(
      dataset,
      getPresetRange("today")
    ).finance;
    built.monthFinance = computeBusinessIntelligence(
      dataset,
      getPresetRange("month")
    ).finance;
    return built;
  }, [dataset, range, user]);

  const todayFinance = report?.todayFinance || null;
  const monthFinance = report?.monthFinance || null;

  const visibleTabs = useMemo(
    () => TAB_META.filter((item) => allowedTabs.includes(item.id)),
    [allowedTabs]
  );

  function handlePresetClick(preset) {
    setRangePreset(preset);
    setRange(getPresetRange(preset));
  }

  function handleCustomRangeChange(field, value) {
    setRangePreset("custom");
    setRange((prev) => ({ ...prev, [field]: value }));
  }

  function handlePdf() {
    if (!report) return;
    generateReportPdf(report, activeTab, report.settings || {});
    notify("Rapor PDF indirildi.");
  }

  if (loading || !report) {
    return <PageLoading message="Raporlar yükleniyor..." />;
  }

  const { overview, finance, monthlySeries, veterinarians, patients, vaccines, prescriptions, stock, profitability } =
    report;

  return (
    <div className="customer-page">
      <div className="customer-header">
        <div>
          <h1>Yönetici Raporları</h1>
          <p>Klinik iş zekâsı, finans ve performans analizi</p>
        </div>

        <Button variant="contained" onClick={handlePdf}>
          PDF İndir
        </Button>
      </div>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mr: 1 }}>
              Tarih Aralığı:
            </Typography>

            {DATE_RANGE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                size="small"
                variant={rangePreset === preset.value ? "contained" : "outlined"}
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}

            <Button
              size="small"
              variant={rangePreset === "custom" ? "contained" : "outlined"}
              onClick={() => setRangePreset("custom")}
            >
              Özel Tarih
            </Button>

            <TextField
              size="small"
              type="date"
              label="Başlangıç"
              value={range.startDate}
              onChange={(e) =>
                handleCustomRangeChange("startDate", e.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              size="small"
              type="date"
              label="Bitiş"
              value={range.endDate}
              onChange={(e) =>
                handleCustomRangeChange("endDate", e.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </CardContent>
      </Card>

      <Tabs
        value={activeTab}
        onChange={(_, value) => setTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 2, borderBottom: 1, borderColor: "divider" }}
      >
        {visibleTabs.map((item) => (
          <Tab key={item.id} value={item.id} label={item.label} />
        ))}
      </Tabs>

      {activeTab === "overview" && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Toplam Müşteri" value={overview.customerCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Toplam Hayvan" value={overview.animalCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Muayene (Aralık)" value={overview.examinationCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Randevu (Aralık)" value={overview.appointmentCount} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Günlük Ciro"
              value={formatCurrency(todayFinance?.totalRevenue || 0)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Aylık Ciro"
              value={formatCurrency(monthFinance?.totalRevenue || 0)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Tekrar Ziyaret Oranı"
              value={`%${patients.repeatVisitRate}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Randevu İptal Oranı"
              value={`%${patients.cancelRate}`}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <KpiCard title="Bugün Muayene" value={overview.todayExaminations} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard title="Bugün Randevu" value={overview.todayAppointments} />
          </Grid>
          <Grid item xs={12} md={4}>
            <KpiCard title="Bugün Aşı" value={overview.todayVaccines} />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReportSectionCard title="Aylık Müşteri Sayısı">
              <LineChart
                labels={monthlySeries.customers.map((i) => i.label)}
                data={monthlySeries.customers.map((i) => i.value)}
                datasetLabel="Müşteri"
                color="#2563EB"
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard title="Aylık Hasta Sayısı">
              <LineChart
                labels={monthlySeries.animals.map((i) => i.label)}
                data={monthlySeries.animals.map((i) => i.value)}
                datasetLabel="Hasta"
                color="#059669"
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12}>
            <ReportSectionCard title="Aylık Randevu Sayısı">
              <BarChart
                labels={monthlySeries.appointments.map((i) => i.label)}
                data={monthlySeries.appointments.map((i) => i.value)}
                datasetLabel="Randevu"
                color="#F59E0B"
              />
            </ReportSectionCard>
          </Grid>
        </Grid>
      )}

      {activeTab === "finance" && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Toplam Ciro" value={formatCurrency(finance.totalRevenue)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Toplam Tahsilat"
              value={formatCurrency(finance.totalCollection)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Bekleyen Tahsilat"
              value={formatCurrency(finance.pendingCollection)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Net Karlılık" value={formatCurrency(finance.netProfit)} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Brüt Karlılık"
              value={formatCurrency(finance.grossProfit)}
              subtitle={`Marj %${finance.margin}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Ortalama Fatura"
              value={formatCurrency(finance.avgInvoice)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Ortalama Tahsilat"
              value={formatCurrency(finance.avgPayment)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Toplam İndirim"
              value={formatCurrency(finance.totalDiscount)}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <ReportSectionCard
              title="Aylık Gelir"
              onExportCsv={() =>
                exportToCsv("aylik-gelir", monthlySeries.revenue, [
                  { key: "label", label: "Ay" },
                  { key: "value", label: "Ciro" },
                ])
              }
            >
              <LineChart
                labels={monthlySeries.revenue.map((i) => i.label)}
                data={monthlySeries.revenue.map((i) => i.value)}
                datasetLabel="Ciro (₺)"
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ReportSectionCard
              title="Aylık Tahsilat"
              onExportCsv={() =>
                exportToCsv("aylik-tahsilat", monthlySeries.collection, [
                  { key: "label", label: "Ay" },
                  { key: "value", label: "Tahsilat" },
                ])
              }
            >
              <LineChart
                labels={monthlySeries.collection.map((i) => i.label)}
                data={monthlySeries.collection.map((i) => i.value)}
                datasetLabel="Tahsilat (₺)"
                color="#0EA5E9"
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <ReportSectionCard
              title="Aylık Kar"
              onExportCsv={() =>
                exportToCsv("aylik-kar", monthlySeries.profit, [
                  { key: "label", label: "Ay" },
                  { key: "value", label: "Kar" },
                ])
              }
            >
              <LineChart
                labels={monthlySeries.profit.map((i) => i.label)}
                data={monthlySeries.profit.map((i) => i.value)}
                datasetLabel="Kar (₺)"
                color="#7C3AED"
              />
            </ReportSectionCard>
          </Grid>

          {user?.role === ROLES.ADMIN && (
            <>
              <Grid item xs={12} md={6}>
                <ReportSectionCard
                  title="En Karlı Hizmetler"
                  onExportCsv={() =>
                    exportToCsv("en-karli-hizmetler", profitability.topServices, [
                      { key: "name", label: "Hizmet" },
                      { key: "profit", label: "Kar" },
                      { key: "margin", label: "Marj" },
                    ])
                  }
                >
                  <BarChart
                    labels={profitability.topServices.map((i) => i.name)}
                    data={profitability.topServices.map((i) => i.profit)}
                    datasetLabel="Kar (₺)"
                    color="#059669"
                    horizontal
                  />
                </ReportSectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ReportSectionCard
                  title="En Karlı Ürünler"
                  onExportCsv={() =>
                    exportToCsv("en-karli-urunler", profitability.topProducts, [
                      { key: "name", label: "Ürün" },
                      { key: "profit", label: "Kar" },
                      { key: "margin", label: "Marj" },
                    ])
                  }
                >
                  <BarChart
                    labels={profitability.topProducts.map((i) => i.name)}
                    data={profitability.topProducts.map((i) => i.profit)}
                    datasetLabel="Kar (₺)"
                    color="#10B981"
                    horizontal
                  />
                </ReportSectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ReportSectionCard
                  title="En Karlı İlaçlar / Kalemler"
                  onExportCsv={() =>
                    exportToCsv("en-karli-ilaclar", profitability.topMedicines, [
                      { key: "name", label: "Kalem" },
                      { key: "profit", label: "Kar" },
                      { key: "margin", label: "Marj" },
                    ])
                  }
                >
                  <RankedList
                    rows={profitability.topMedicines}
                    renderValue={(row) =>
                      `${formatCurrency(row.profit)} · %${row.margin}`
                    }
                  />
                </ReportSectionCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ReportSectionCard
                  title="En Düşük Marjlı İşlemler"
                  onExportCsv={() =>
                    exportToCsv("dusuk-marj", profitability.lowestMargin, [
                      { key: "name", label: "İşlem" },
                      { key: "margin", label: "Marj" },
                      { key: "profit", label: "Kar" },
                    ])
                  }
                >
                  <RankedList
                    rows={profitability.lowestMargin}
                    renderValue={(row) => `%${row.margin}`}
                  />
                </ReportSectionCard>
              </Grid>
            </>
          )}
        </Grid>
      )}

      {activeTab === "veterinarian" && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <ReportSectionCard
              title="Veteriner Performansı"
              onExportCsv={() =>
                exportToCsv("veteriner-performans", veterinarians, [
                  { key: "name", label: "Veteriner" },
                  { key: "examinations", label: "Muayene" },
                  { key: "vaccines", label: "Aşı" },
                  { key: "prescriptions", label: "Reçete" },
                  { key: "revenue", label: "Ciro" },
                  { key: "avgInvoice", label: "Ort. Fatura" },
                  { key: "cancelRate", label: "İptal %" },
                  { key: "animalCount", label: "Hasta" },
                ])
              }
            >
              <Box sx={{ overflowX: "auto" }}>
                <table className="customer-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th>Veteriner</th>
                      <th>Muayene</th>
                      <th>Aşı</th>
                      <th>Reçete</th>
                      <th>Ciro</th>
                      <th>Ort. Fatura</th>
                      <th>İptal %</th>
                      <th>Hasta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {veterinarians.length === 0 ? (
                      <tr>
                        <td colSpan={8}>Veri bulunamadı.</td>
                      </tr>
                    ) : (
                      veterinarians.map((row) => (
                        <tr key={row.name}>
                          <td>{row.name}</td>
                          <td>{row.examinations}</td>
                          <td>{row.vaccines}</td>
                          <td>{row.prescriptions}</td>
                          <td>{formatCurrency(row.revenue)}</td>
                          <td>{formatCurrency(row.avgInvoice)}</td>
                          <td>%{row.cancelRate}</td>
                          <td>{row.animalCount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </Box>
            </ReportSectionCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ReportSectionCard title="Muayene Dağılımı">
              <BarChart
                labels={veterinarians.map((i) => i.name)}
                data={veterinarians.map((i) => i.examinations)}
                datasetLabel="Muayene"
                color="#DC2626"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard title="Ciro Dağılımı">
              <BarChart
                labels={veterinarians.map((i) => i.name)}
                data={veterinarians.map((i) => i.revenue)}
                datasetLabel="Ciro (₺)"
                color="#059669"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
        </Grid>
      )}

      {activeTab === "patients" && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="İlk Ziyaret" value={patients.firstVisitCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard title="Tekrar Ziyaret" value={patients.repeatVisitCount} />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Tekrar Ziyaret Oranı"
              value={`%${patients.repeatVisitRate}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="En Aktif Müşteri"
              value={patients.mostActiveCustomer?.name || "-"}
              subtitle={
                patients.mostActiveCustomer
                  ? `${patients.mostActiveCustomer.visitCount} ziyaret`
                  : undefined
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Çok Gelen Hayvan Türleri"
              onExportCsv={() =>
                exportToCsv("turler", patients.topSpecies, [
                  { key: "name", label: "Tür" },
                  { key: "count", label: "Adet" },
                ])
              }
            >
              <PieChart
                labels={patients.topSpecies.map((i) => i.name)}
                data={patients.topSpecies.map((i) => i.count)}
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Çok Gelen Irklar"
              onExportCsv={() =>
                exportToCsv("irklar", patients.topBreeds, [
                  { key: "name", label: "Irk" },
                  { key: "count", label: "Adet" },
                ])
              }
            >
              <BarChart
                labels={patients.topBreeds.map((i) => i.name)}
                data={patients.topBreeds.map((i) => i.count)}
                datasetLabel="Adet"
                color="#7C3AED"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12}>
            <ReportSectionCard
              title="En Çok Gelen Müşteriler"
              onExportCsv={() =>
                exportToCsv("musteriler", patients.topCustomers, [
                  { key: "name", label: "Müşteri" },
                  { key: "visitCount", label: "Ziyaret" },
                  { key: "firstVisit", label: "İlk Ziyaret" },
                  { key: "lastVisit", label: "Son Ziyaret" },
                ])
              }
            >
              <Box sx={{ overflowX: "auto" }}>
                <table className="customer-table" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th>Müşteri</th>
                      <th>Ziyaret</th>
                      <th>İlk Ziyaret</th>
                      <th>Son Ziyaret</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.topCustomers.map((row) => (
                      <tr key={row.id}>
                        <td>{row.name}</td>
                        <td>{row.visitCount}</td>
                        <td>{row.firstVisit}</td>
                        <td>{row.lastVisit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </ReportSectionCard>
          </Grid>
        </Grid>
      )}

      {activeTab === "stock" && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Çok Tüketilen Ürünler"
              onExportCsv={() =>
                exportToCsv("cok-tuketilen", stock.mostConsumed, [
                  { key: "name", label: "Ürün" },
                  { key: "quantity", label: "Miktar" },
                ])
              }
            >
              <BarChart
                labels={stock.mostConsumed.map((i) => i.name)}
                data={stock.mostConsumed.map((i) => i.quantity)}
                datasetLabel="Miktar"
                color="#059669"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Az Tüketilen Ürünler"
              onExportCsv={() =>
                exportToCsv("az-tuketilen", stock.leastConsumed, [
                  { key: "name", label: "Ürün" },
                  { key: "quantity", label: "Miktar" },
                ])
              }
            >
              <RankedList
                rows={stock.leastConsumed}
                renderValue={(row) => row.quantity}
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="Kritik Stok"
              onExportCsv={() =>
                exportToCsv("kritik-stok", stock.criticalStock, [
                  { key: "name", label: "Ürün" },
                  { key: "quantity", label: "Miktar" },
                  { key: "minQuantity", label: "Min" },
                ])
              }
            >
              <RankedList
                rows={stock.criticalStock}
                renderValue={(row) => `${row.quantity} / min ${row.minQuantity}`}
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="SKT Yaklaşan Ürünler"
              onExportCsv={() =>
                exportToCsv("skt", stock.expiringStock, [
                  { key: "name", label: "Ürün" },
                  { key: "expiryDate", label: "SKT" },
                  { key: "quantity", label: "Miktar" },
                  { key: "lotNo", label: "Lot" },
                ])
              }
            >
              <RankedList
                rows={stock.expiringStock}
                renderValue={(row) => `${row.expiryDate} · ${row.quantity}`}
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="Lot Bazlı Kullanım"
              onExportCsv={() =>
                exportToCsv("lot", stock.byLot, [
                  { key: "name", label: "Lot" },
                  { key: "quantity", label: "Miktar" },
                ])
              }
            >
              <RankedList
                rows={stock.byLot}
                renderValue={(row) => row.quantity}
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="Tedarikçi Bazlı Tüketim"
              onExportCsv={() =>
                exportToCsv("tedarikci", stock.bySupplier, [
                  { key: "name", label: "Tedarikçi" },
                  { key: "quantity", label: "Miktar" },
                ])
              }
            >
              <BarChart
                labels={stock.bySupplier.map((i) => i.name)}
                data={stock.bySupplier.map((i) => i.quantity)}
                datasetLabel="Miktar"
                color="#F59E0B"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
        </Grid>
      )}

      {activeTab === "vaccines" && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={2}>
            <KpiCard title="Toplam" value={vaccines.total} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <KpiCard title="Tamamlanan" value={vaccines.completed} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <KpiCard title="Bekleyen" value={vaccines.pending} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <KpiCard title="Geciken" value={vaccines.overdue} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <KpiCard title="İptal" value={vaccines.cancelled} />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <KpiCard
              title="Tamamlama Oranı"
              value={`%${vaccines.completionRate}`}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Çok Yapılan Aşılar"
              onExportCsv={() =>
                exportToCsv("asilar", vaccines.topVaccines, [
                  { key: "name", label: "Aşı" },
                  { key: "count", label: "Adet" },
                ])
              }
            >
              <BarChart
                labels={vaccines.topVaccines.map((i) => i.name)}
                data={vaccines.topVaccines.map((i) => i.count)}
                datasetLabel="Adet"
                color="#F59E0B"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard title="Aşı Durum Dağılımı">
              <PieChart
                labels={["Tamamlanan", "Bekleyen", "Geciken", "İptal"]}
                data={[
                  vaccines.completed,
                  vaccines.pending,
                  vaccines.overdue,
                  vaccines.cancelled,
                ]}
              />
            </ReportSectionCard>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Toplam Reçete"
              value={prescriptions.totalPrescriptions}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <KpiCard
              title="Ortalama İlaç Sayısı"
              value={prescriptions.avgItemCount}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Çok Yazılan İlaçlar"
              onExportCsv={() =>
                exportToCsv("yazilan-ilaclar", prescriptions.topWritten, [
                  { key: "name", label: "İlaç" },
                  { key: "count", label: "Satır" },
                  { key: "quantity", label: "Miktar" },
                ])
              }
            >
              <RankedList
                rows={prescriptions.topWritten}
                renderValue={(row) => `${row.count} satır · ${row.quantity} adet`}
              />
            </ReportSectionCard>
          </Grid>
          <Grid item xs={12} md={6}>
            <ReportSectionCard
              title="En Çok Kullanılan İlaçlar"
              onExportCsv={() =>
                exportToCsv("kullanilan-ilaclar", prescriptions.topUsed, [
                  { key: "name", label: "İlaç" },
                  { key: "quantity", label: "Miktar" },
                  { key: "count", label: "Satır" },
                ])
              }
            >
              <BarChart
                labels={prescriptions.topUsed.map((i) => i.name)}
                data={prescriptions.topUsed.map((i) => i.quantity)}
                datasetLabel="Miktar"
                color="#DC2626"
                horizontal
              />
            </ReportSectionCard>
          </Grid>
        </Grid>
      )}
    </div>
  );
}

export default Reports;
