import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Login from "./pages/Login";

interface VitalsData {
  heart_rate: number;
  temperature: number;
  spo2: number;
  timestamp: string;
  time: string;
}

function App() {
  const [data, setData] = useState<VitalsData[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [patients, setPatients] = useState<string[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(true);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    axios.get("http://localhost:5000/patients").then((res) => {
      const ids = res.data;
      setPatients(ids);
      setPatientId(ids[0]); // default to first available patient
    });
  }, []);

  useEffect(() => {
    if (!loggedIn || !patientId) return;

    axios
      .get("http://localhost:5000/history", {
        params: {
          id: patientId,
          page: page,
          limit: ITEMS_PER_PAGE,
        },
      })
      .then((res) => {
        const results: VitalsData[] = res.data.map((item: any) => ({
          ...item,
          time: new Date(item.timestamp).toLocaleTimeString(),
        }));
        setData(results);
        setHasNextPage(results.length === ITEMS_PER_PAGE);
      });
  }, [loggedIn, patientId, page]);

  const exportCSV = () => {
    const csv = [
      ["Time", "Heart Rate", "Temperature", "SpO2"],
      ...data.map((d) => [d.time, d.heart_rate, d.temperature, d.spo2]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient_vitals.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!loggedIn) return <Login onLogin={() => setLoggedIn(true)} />;

  const latest = data[data.length - 1] || {
    heart_rate: 0,
    temperature: 0,
    spo2: 0,
  };

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              🏥 Patient Monitoring Dashboard
            </h1>
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
            </button>

            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <VitalCard
              label="Heart Rate"
              value={latest.heart_rate}
              unit="bpm"
              threshold={100}
            />
            <VitalCard
              label="Temperature"
              value={latest.temperature}
              unit="°C"
              threshold={37.5}
            />
            <VitalCard
              label="SpO₂"
              value={latest.spo2}
              unit="%"
              threshold={94}
              lowIsBad
            />
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">
              Live Graph
            </h2>
            <select
              value={patientId || ""}
              onChange={(e) => {
                setPatientId(e.target.value);
                setPage(0); // reset to first page
              }}
              className="border p-2 rounded bg-white dark:bg-gray-800 dark:text-white"
            >
              {patients.map((pid) => (
                <option key={pid} value={pid}>
                  {pid}
                </option>
              ))}
            </select>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid stroke="#e5e7eb" strokeDasharray="5 5" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="heart_rate"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="temperature"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="spo2"
                  stroke="#f97316"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={page === 0}
              >
                ⬅ Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNextPage}
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Next ➡
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VitalCard({
  label,
  value,
  unit,
  threshold,
  lowIsBad = false,
}: {
  label: string;
  value: number;
  unit: string;
  threshold: number;
  lowIsBad?: boolean;
}) {
  const isAbnormal = lowIsBad ? value < threshold : value > threshold;
  const cardColor = isAbnormal
    ? "bg-red-100 border-red-300"
    : "bg-white border-gray-200";
  const textColor = isAbnormal ? "text-red-700" : "text-green-700";

  return (
    <div className={`border p-4 rounded-lg shadow-sm ${cardColor}`}>
      <h3 className="text-lg font-semibold text-gray-700">{label}</h3>
      <p className={`text-4xl font-bold ${textColor}`}>
        {value} {unit}
      </p>
      {isAbnormal && <p className="text-red-500 mt-2">⚠ Out of Range</p>}
    </div>
  );
}

export default App;
