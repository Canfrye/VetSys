/**
 * Uygulamadaki tüm grafiklerin ihtiyaç duyduğu Chart.js elemanlarını TEK
 * yerden kaydeder. Önceden her grafik dosyası kendi ChartJS.register(...)
 * çağrısını tekrar ediyordu; artık grafik component'leri sadece bu dosyayı
 * import eder (side-effect import), kayıt tekrarı olmaz.
 */

import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  ArcElement,
  BarElement,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default ChartJS;
