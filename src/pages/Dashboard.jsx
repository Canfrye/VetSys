import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// 1. DÜZELTME: Import çakışmaları temizlendi ve hepsi tek bir yerden çekildi.
import {
  FaUsers,
  FaDog,
  FaSyringe,
  FaCalendarAlt,
  FaBoxes,
  FaStethoscope,
  FaWeight,
  FaNotesMedical,
  FaUserPlus,
  FaPaw,
} from "react-icons/fa";

import StatCard from "../components/StatCard";
import AnimalSpeciesChart from "../components/charts/AnimalSpeciesChart";
import CustomerGrowthChart from "../components/charts/CustomerGrowthChart";

import "../styles/dashboard.css";

import {
  getCustomerCount,
  getLatestCustomers,
} from "../services/customerService";

import {
  getAnimalCount,
  getLatestAnimals,
} from "../services/animalService";

import {
  getTodayVaccines,
  getUpcomingVaccines,
} from "../services/vaccineService";

import {
  getTodayAppointments,
} from "../services/appointmentService";

import {
  getCriticalStock,
} from "../services/stockService";

import {
  getTodayExaminations,
  getUpcomingControls,
  getAverageWeight,
  getMostCommonDiagnosis,
  getExaminationCount,
} from "../services/examinationService";

function Dashboard() {
  const navigate = useNavigate();

  const [customerCount, setCustomerCount] = useState(0);
  const [animalCount, setAnimalCount] = useState(0);
  const [examinationCount, setExaminationCount] = useState(0);

  const [latestCustomers, setLatestCustomers] = useState([]);
  const [latestAnimals, setLatestAnimals] = useState([]);

  const [todayVaccines, setTodayVaccines] = useState([]);
  const [upcomingVaccines, setUpcomingVaccines] = useState([]);

  const [todayAppointments, setTodayAppointments] = useState([]);

  const [criticalStock, setCriticalStock] = useState([]);

  const [todayExaminations, setTodayExaminations] = useState([]);
  const [upcomingControls, setUpcomingControls] = useState([]);
  const [averageWeight, setAverageWeight] = useState(0);
  const [mostDiagnosis, setMostDiagnosis] = useState("-");

  useEffect(() => {
    loadDashboard();
  }, []);

  function loadDashboard() {
    setCustomerCount(getCustomerCount());
    setAnimalCount(getAnimalCount());
    setExaminationCount(getExaminationCount());
    setLatestCustomers(getLatestCustomers());
    setLatestAnimals(getLatestAnimals());
    setTodayVaccines(getTodayVaccines());
    setUpcomingVaccines(getUpcomingVaccines());
    setTodayAppointments(getTodayAppointments());
    setCriticalStock(getCriticalStock());
    setTodayExaminations(getTodayExaminations());
    setUpcomingControls(getUpcomingControls());
    setAverageWeight(getAverageWeight());
    setMostDiagnosis(getMostCommonDiagnosis());
  }

  return (
    <>
      <h1 className="page-title">Hoş Geldiniz 👋</h1>
      <p className="page-subtitle">
        Veteriner Klinik Yönetim Sistemine hoş geldiniz.
      </p>

      {/* 2. DÜZELTME: stats-grid burada açılıyor ve sadece StatCard'ları kapsayıp kapanıyor */}
      <div className="stats-grid">
        <StatCard
          title="Toplam Müşteri"
          value={customerCount}
          icon={<FaUsers />}
          color="#3B82F6"
        />
        <StatCard
          title="Toplam Hayvan"
          value={animalCount}
          icon={<FaDog />}
          color="#10B981"
        />
        <StatCard
          title="Bugünkü Muayene"
          value={todayExaminations.length}
          icon={<FaStethoscope />}
          color="#7C3AED"
        />
        <StatCard
          title="Bugünkü Aşı"
          value={todayVaccines.length}
          icon={<FaSyringe />}
          color="#F59E0B"
        />
        <StatCard
          title="Bugünkü Randevu"
          value={todayAppointments.length}
          icon={<FaCalendarAlt />}
          color="#EF4444"
        />
        <StatCard
          title="Kritik Stok"
          value={criticalStock.length}
          icon={<FaBoxes />}
          color="#DC2626"
        />
      </div>

      {/* BİLEŞEN SIRALAMASI 1: Hızlı İşlemler */}
      {/* 3 & 4. DÜZELTME: Tek dashboard-lists wrapper'ı kullanıldı, fazla olan Hızlı İşlemler silindi */}
      <div className="dashboard-lists">
        <div className="dashboard-card" style={{ width: "100%" }}>
          <h3>Hızlı İşlemler</h3>
          <div className="quick-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="quick-btn" onClick={() => navigate("/musteriler")}>
              <FaUserPlus />
              <span>Yeni Müşteri</span>
            </button>
            <button className="quick-btn" onClick={() => navigate("/hayvanlar")}>
              <FaPaw />
              <span>Yeni Hayvan</span>
            </button>
            <button className="quick-btn" onClick={() => navigate("/randevular")}>
              <FaCalendarAlt />
              <span>Yeni Randevu</span>
            </button>
            <button className="quick-btn" onClick={() => navigate("/muayeneler")}>
              <FaNotesMedical />
              <span>Yeni Muayene</span>
            </button>
          </div>
        </div>
      </div>

      {/* BİLEŞEN SIRALAMASI 2: Son Müşteriler | Son Hayvanlar */}
      <div className="dashboard-lists">
        <div className="dashboard-card">
          <h3>Son Eklenen Müşteriler</h3>
          {latestCustomers.length === 0 ? (
            <p>Kayıt bulunmuyor.</p>
          ) : (
            latestCustomers.map((customer) => (
              <div
                key={customer.id}
                className="dashboard-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/musteriler/${customer.id}`)}
              >
                <strong>{customer.ad} {customer.soyad}</strong>
                <span>{customer.telefon}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <h3>Son Eklenen Hayvanlar</h3>
          {latestAnimals.length === 0 ? (
            <p>Kayıt bulunmuyor.</p>
          ) : (
            latestAnimals.map((animal) => (
              <div
                key={animal.id}
                className="dashboard-item"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/hayvanlar/${animal.id}`)}
              >
                <strong>{animal.name}</strong>
                <span>{animal.species}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BİLEŞEN SIRALAMASI 3: Bugünkü Muayene | Bugünkü Randevu */}
      <div className="dashboard-lists">
        <div className="dashboard-card">
          <h3>Bugünkü Muayeneler</h3>
          {todayExaminations.length === 0 ? (
            <p>Bugün muayene bulunmuyor.</p>
          ) : (
            todayExaminations.map((exam) => (
              <div key={exam.id} className="dashboard-item">
                <strong>{exam.animalName}</strong>
                <span>{exam.diagnosis || "Tanı girilmedi"}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <h3>Bugünkü Randevular</h3>
          {todayAppointments.length === 0 ? (
            <p>Bugün randevu bulunmuyor.</p>
          ) : (
            todayAppointments.map((appointment) => (
              <div key={appointment.id} className="dashboard-item">
                <strong>{appointment.time}</strong>
                <span>{appointment.animalName} - {appointment.ownerName}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BİLEŞEN SIRALAMASI 4: Bugünkü Aşı | Yaklaşan Aşı */}
      <div className="dashboard-lists">
        <div className="dashboard-card">
          <h3>Bugünkü Aşılar</h3>
          {todayVaccines.length === 0 ? (
            <p>Bugün aşı bulunmuyor.</p>
          ) : (
            todayVaccines.map((vaccine) => (
              <div key={vaccine.id} className="dashboard-item">
                <strong>{vaccine.animalName}</strong>
                <span>{vaccine.vaccineName}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <h3>Yaklaşan Aşılar</h3>
          {upcomingVaccines.length === 0 ? (
            <p>Yaklaşan aşı bulunmuyor.</p>
          ) : (
            upcomingVaccines.map((vaccine) => (
              <div key={vaccine.id} className="dashboard-item">
                <strong>{vaccine.animalName}</strong>
                <span>{vaccine.nextDoseDate}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BİLEŞEN SIRALAMASI 5: Yaklaşan Kontroller | Kritik Stok */}
      <div className="dashboard-lists">
        <div className="dashboard-card">
          <h3>Yaklaşan Kontroller</h3>
          {upcomingControls.length === 0 ? (
            <p>Yaklaşan kontrol bulunmuyor.</p>
          ) : (
            upcomingControls.map((exam) => (
              <div key={exam.id} className="dashboard-item">
                <strong>{exam.animalName}</strong>
                <span>{exam.controlDate}</span>
              </div>
            ))
          )}
        </div>

        <div className="dashboard-card">
          <h3>Kritik Stok</h3>
          {criticalStock.length === 0 ? (
            <p>Kritik seviyede stok bulunmuyor.</p>
          ) : (
            criticalStock.map((stock, index) => (
              <div key={stock.id || index} className="dashboard-item">
                <strong>{stock.name || "Ürün"}</strong>
                <span style={{ color: "#DC2626", fontWeight: "bold" }}>
                  {stock.quantity || "Kritik"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* BİLEŞEN SIRALAMASI 6: Grafikler */}
      <div className="dashboard-lists">
        <div className="dashboard-card">
          <h3>Hayvan Tür Dağılımı</h3>
          <AnimalSpeciesChart />
        </div>

        <div className="dashboard-card">
          <h3>Aylık Yeni Müşteri</h3>
          <CustomerGrowthChart />
        </div>
      </div>

      {/* BİLEŞEN SIRALAMASI 7: Klinik Özeti */}
      {/* 5. DÜZELTME: Bugünkü Özet birleştirildi, yanlış veri ve hatalı kapanışlar düzeltildi */}
      <div className="dashboard-lists">
        <div className="dashboard-card" style={{ width: "100%" }}>
          <h3>Klinik Özeti</h3>
          <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "15px" }}>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Toplam Müşteri</strong>
              <span>{customerCount}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Toplam Hayvan</strong>
              <span>{animalCount}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Toplam Muayene</strong>
              <span>{examinationCount}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Muayene</strong>
              <span>{todayExaminations.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Randevu</strong>
              <span>{todayAppointments.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Bugünkü Aşı</strong>
              <span>{todayVaccines.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Yaklaşan Aşı</strong>
              <span>{upcomingVaccines.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>Kritik Stok</strong>
              <span>{criticalStock.length}</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>
                <FaWeight style={{ marginRight: 6 }} /> Ortalama Kilo
              </strong>
              <span>{averageWeight} kg</span>
            </div>
            <div className="dashboard-item" style={{ margin: 0 }}>
              <strong>
                <FaNotesMedical style={{ marginRight: 6 }} /> En Sık Tanı
              </strong>
              <span>{mostDiagnosis}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;