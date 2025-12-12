import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import VitalCard from "../components/VitalCard";
import api from "../api/api";
import axios from "axios";

interface VitalsData {
  heart_rate: number;
  temperature: number;
  spo2: number;
  timestamp: string;
  time: string;
}

interface DashboardProps {
  token: string;
  role: string;
  onLogout: () => void;
}

const ITEMS_PER_PAGE = 10;

async function fetchPatients(token: string): Promise<string[]> {
  const res = await api.get("/patients", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as string[];
}

async function fetchHistory(
  token: string,
  patientId: string,
  page: number,
  limit: number
): Promise<VitalsData[]> {
  const res = await api.get("/history", {
    headers: { Authorization: `Bearer ${token}` },
    params: { id: patientId, page, limit },
  });
  return (res.data as any[]).map((item) => ({
    heart_rate: item.heart_rate,
    temperature: item.temperature,
    spo2: item.spo2,
    timestamp: item.timestamp,
    time: new Date(item.timestamp).toLocaleTimeString(),
  }));
}

export default function Dashboard({ token, role, onLogout }: DashboardProps) {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  // Patients query
  const {
    data: patients = [],
    isPending: loadingPatients,
    error: patientsError,
  } = useQuery({
    queryKey: ["patients", token],
    queryFn: () => fetchPatients(token),
    refetchOnWindowFocus: false,
  });

  // Default patient selection
  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0]);
      setPage(0);
    }
  }, [patients, patientId]);
  // History query
  const {
    data: history = [],
    isPending: loadingHistory,
    error: historyError,
  } = useQuery({
    queryKey: ["history", token, patientId, page],
    queryFn: () =>
      patientId
        ? fetchHistory(token, patientId, page, ITEMS_PER_PAGE)
        : Promise.resolve<VitalsData[]>([]),
    enabled: !!patientId,
    refetchOnWindowFocus: false,
  });

  const latest = history[history.length - 1] || {
    heart_rate: 0,
    temperature: 0,
    spo2: 0,
    timestamp: "",
    time: "",
  };

  // Check for authentication errors (expired/invalid token)
  const isAuthError =
    (patientsError &&
      axios.isAxiosError(patientsError) &&
      patientsError.response?.status === 401) ||
    (historyError &&
      axios.isAxiosError(historyError) &&
      historyError.response?.status === 401);

  if (isAuthError) {
    // Token is invalid / expired: force logout
    onLogout();
    return null; // or a small "Logging out..." message if you like
  }

  if (loadingPatients) {
    return (
      <div className="min-h-screen flex bg-gray-100 dark:bg-gray-900 items-center justify-center text-gray-700 dark:text-gray-100">
        <p>Loading data...</p>
      </div>
    );
  }

  if (patientsError || historyError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Error loading data. Please try again.
      </div>
    );
  }
  if (patients.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-100 dark:bg-gray-900 justify-center text-gray-700 dark:text-gray-100">
        <h2 className="text-2xl font-semibold mb-2">No patient data found</h2>
        <p className="text-gray-500 mb-4">
          Please ask an admin to upload or seed dataset.
        </p>
        {role === "admin" && (
          <a
            href="/admin"
            className="bg-yellow-500 mb-4 font-bold text-white px-4 py-2 rounded hover:bg-yellow-600"
          >
            ⚙️ Admin Panel
          </a>
        )}
        <button
          onClick={onLogout}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 text-gray-800 dark:text-gray-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between mb-5">
          <h1 className="text-3xl font-bold mb-6">
            🏥 Patient Monitoring Dashboard
          </h1>

          {/* Role info */}
          <div className="flex gap-x-4 items-center">
            <p className="mb-4">
              Logged in as:{" "}
              <span className="font-semibold uppercase">{role}</span>
            </p>
            {role === "admin" && (
              <a
                href="/admin"
                className="bg-yellow-500 mb-4 font-bold text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                ⚙️ Admin Panel
              </a>
            )}
            <button
              onClick={onLogout}
              className="bg-red-500 text-white font-bold px-4 py-2 rounded mb-4 cursor-pointer hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
        {/* Cards (all roles can see) */}
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
          <h2 className="text-xl font-semibold mb-4">Vitals History</h2>

          {/* Patient selector (hidden for nurses) */}
          {role !== "nurse" && (
            <select
              value={patientId || ""}
              onChange={(e) => {
                setPatientId(e.target.value);
                setPage(0);
              }}
              className="border p-2 rounded mb-4"
            >
              {patients.map((pid) => (
                <option key={pid} value={pid}>
                  {pid}
                </option>
              ))}
            </select>
          )}

          {/* Chart */}
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history}>
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

          {/* Pagination (disabled for nurses) */}
          {role !== "nurse" && (
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
                className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={history.length < ITEMS_PER_PAGE}
              >
                Next ➡
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
