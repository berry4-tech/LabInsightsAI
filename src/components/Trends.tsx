import Navbar from "./Navbar";
import { API_BASE } from './config';
import { getAuthItem } from './utils/authStorage';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useState, useEffect } from "react";

// -----------------------------
// Types
// -----------------------------
interface TestResult {
  name: string;
  value: string;
  unit: string;
  normalRange: string;
  status: string;
  interpretation: string;
}

interface BackendReport {
  uploaded_at: string;
  testResults?: TestResult[];
  ai_summary?: any;
}

interface MetricPoint {
  date: string;
  value: number;
  timestamp: number;
}

// -----------------------------
// Static Definitions
// -----------------------------
const metrics = [
  { id: "hemoglobin", name: "Hemoglobin", unit: "g/dL", normalRange: "13.5–17.5" },
  { id: "wbc", name: "White Blood Cells", unit: "x10³/µL", normalRange: "4.0–11.0" },
  { id: "cholesterol", name: "Total Cholesterol", unit: "mg/dL", normalRange: "< 200" },
  { id: "glucose", name: "Fasting Glucose", unit: "mg/dL", normalRange: "70–100" },
  { id: "tsh", name: "TSH", unit: "µIU/mL", normalRange: "0.4–4.0" },
  { id: "vitaminD", name: "Vitamin D", unit: "ng/mL", normalRange: "30–100" },
];

// Map backend test names → metric key
// FIX: Added more aliases to handle LLM naming variations
const metricNameMap: Record<string, string[]> = {
  hemoglobin: ["Hemoglobin", "Hgb", "Hb"],
  wbc: ["WBC", "White Blood Cells", "WBC Count", "Leukocytes"],
  cholesterol: ["Total Cholesterol", "Cholesterol", "TC"],
  glucose: ["Fasting Glucose", "Blood Glucose", "FBS", "Fasting Blood Sugar", "Glucose"],
  tsh: ["TSH", "Thyroid Stimulating Hormone"],
  vitaminD: ["Vitamin D", "Vit D", "25-OH Vitamin D", "25-Hydroxyvitamin D"],
};

// -----------------------------
// COMPONENT
// -----------------------------
export default function Trends() {
  const [selectedMetric, setSelectedMetric] = useState("hemoglobin");

  const [metricData, setMetricData] = useState<Record<string, MetricPoint[]>>({
    hemoglobin: [],
    wbc: [],
    cholesterol: [],
    glucose: [],
    tsh: [],
    vitaminD: [],
  });

  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Fetch user reports → build metric timelines
  // -----------------------------
  useEffect(() => {
    const email = getAuthItem("userEmail");
    if (!email) {
      setLoading(false);
      return;
    }

    const token = getAuthItem("authToken");
    fetch(`${API_BASE}/all-reports?email=${encodeURIComponent(email)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        const reports: BackendReport[] = data.reports || [];
        console.log("🔥 RAW REPORTS FROM BACKEND:", reports);

        const newData: Record<string, MetricPoint[]> = {
          hemoglobin: [],
          wbc: [],
          cholesterol: [],
          glucose: [],
          tsh: [],
          vitaminD: [],
        };

        reports.forEach((rep, idx) => {
          console.log(`📄 REPORT ${idx + 1}`, rep);

          const ts = new Date(rep.uploaded_at).getTime();
          const label = new Date(rep.uploaded_at).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });

          // ✅ testResults is TOP-LEVEL on the doc
          const tests: TestResult[] =
            (rep as any).testResults ??
            (rep as any).tests ??      // just in case
            [];

          console.log("   ➜ Extracted testResults:", tests);

          tests.forEach((t) => {
            Object.entries(metricNameMap).forEach(([metricId, matches]) => {
              const cleanName = t.name.trim().toLowerCase();

              // FIX: Use partial matching instead of exact matching
              // Check if ANY alias is contained in the test name, or vice versa
              const isMatch = matches.some((alias) => {
                const cleanAlias = alias.toLowerCase();
                return cleanName.includes(cleanAlias) || cleanAlias.includes(cleanName);
              });

              if (isMatch) {
                const value = parseFloat(t.value); // "11.9 g/dL" → 11.9
                if (!isNaN(value)) {
                  newData[metricId].push({
                    date: label,
                    value,
                    timestamp: ts,
                  });
                }
              }
            });
          });
        });

        // sort each metric timeline by date
        (Object.keys(newData) as (keyof typeof newData)[]).forEach((m) => {
          newData[m].sort((a, b) => a.timestamp - b.timestamp);
        });

        console.log("✅ FINAL METRIC DATA:", newData);
        setMetricData(newData);
      })
      .catch((err) => {
        console.error("Trends fetch error:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  // -----------------------------
  // Current Selection
  // -----------------------------
  const currentTimeline = metricData[selectedMetric] || [];

  const latest =
    currentTimeline.length > 0
      ? currentTimeline[currentTimeline.length - 1].value
      : null;

  const previous =
    currentTimeline.length > 1
      ? currentTimeline[currentTimeline.length - 2].value
      : null;

  const percent =
    latest !== null && previous !== null && previous !== 0
      ? (((latest - previous) / previous) * 100).toFixed(1)
      : "0";

  const improving =
    latest !== null &&
    previous !== null &&
    (selectedMetric === "cholesterol" || selectedMetric === "glucose"
      ? latest < previous
      : latest > previous);

  const metricMeta = metrics.find((m) => m.id === selectedMetric)!;

  // -----------------------------
  // UI 
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-gray-900 mb-4">Health Trends</h1>
        <p className="text-lg text-gray-600 mb-12">
          Compare values across all reports you uploaded
        </p>

        {/* Metric Selector */}
        <div className="bg-white p-8 rounded-2xl border mb-12 shadow-sm">
          <label className="block text-sm font-medium mb-3">
            Select Metric
          </label>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-4 py-3 border rounded-xl"
          >
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white p-10 rounded-2xl border shadow-sm">
            <p className="text-sm text-gray-600">Latest Value</p>
            <h2 className="text-4xl font-bold text-gray-900">
              {latest ?? "--"}
            </h2>
          </div>

          <div className="bg-blue-50 p-10 rounded-2xl border border-blue-100">
            <p className="text-sm text-blue-700">Normal Range</p>
            <h2 className="text-4xl font-bold text-blue-900">
              {metricMeta.normalRange}
            </h2>
          </div>

          <div className="bg-purple-50 p-10 rounded-2xl border border-purple-100">
            <p className="text-sm text-purple-700">Total Tests</p>
            <h2 className="text-4xl font-bold text-purple-900">
              {currentTimeline.length}
            </h2>
            <p className="text-xs text-purple-600 mt-1">
              % change: {percent}%
            </p>
          </div>
        </div>

        {/* Line Chart */}
        {/* 📊 TWO GRAPHS SIDE BY SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

          {/* LINE CHART */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-bold mb-6">
              {metricMeta.name} Over Time
            </h2>

            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={currentTimeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#6366F1"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* BAR CHART */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm">
            <h2 className="text-xl font-bold mb-6">Recent Comparison</h2>

            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={currentTimeline.slice(-6)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

      </div>

      {loading && (
        <div className="fixed inset-0 flex items-center justify-center text-gray-500">
          Loading trends…
        </div>
      )}
    </div>
  );
}
