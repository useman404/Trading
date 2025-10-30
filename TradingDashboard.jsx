import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
} from "recharts";

// NOTE: This single-file component is a starting, self-contained frontend dashboard.
// It uses Tailwind classes for styling. To run it you'll need to install:
// react, react-dom, tailwindcss (configured), framer-motion, recharts
// Optional: react-dnd & react-dnd-html5-backend if you replace the simple HTML5 drag handlers

// ------------------------ Mock Data & Utilities ------------------------
const generatePriceSeries = (points = 80, base = 100) => {
  const out = [];
  let val = base;
  for (let i = 0; i < points; i++) {
    val = +(val + (Math.random() - 0.48) * (base * 0.02)).toFixed(2);
    out.push({
      time: `T${i}`,
      price: val,
      volume: Math.round(Math.random() * 1000),
    });
  }
  return out;
};

const assets = [
  { symbol: "BTC", name: "Bitcoin", color: "#f7931a" },
  { symbol: "ETH", name: "Ethereum", color: "#3c3c3d" },
  { symbol: "SOL", name: "Solana", color: "#00FFA3" },
  { symbol: "ADA", name: "Cardano", color: "#0033ad" },
];

// ------------------------ Small components ------------------------
function KPICard({ title, value, delta }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 shadow-md rounded-2xl p-4 w-full"
    >
      <div className="text-sm text-slate-500 dark:text-slate-300">{title}</div>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-semibold">{value}</div>
        <div
          className={`text-sm font-medium ${
            delta >= 0 ? "text-emerald-500" : "text-red-500"
          }`}
        >
          {delta >= 0 ? `+${delta}%` : `${delta}%`}
        </div>
      </div>
    </motion.div>
  );
}

function PriceTicker({ symbols }) {
  return (
    <div className="overflow-hidden whitespace-nowrap py-2 text-sm text-slate-700 dark:text-slate-200">
      <div className="inline-block animate-marquee">
        {symbols.map((s, i) => (
          <span key={s.symbol} className="mx-4 inline-flex items-center">
            <span className="font-semibold mr-2">{s.symbol}</span>
            <span className="text-xs text-slate-400">
              {(100 + i * 3).toFixed(2)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function SimpleLineChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <XAxis dataKey="time" hide />
        <YAxis hide domain={["auto", "auto"]} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="price"
          stroke="#2563eb"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function PortfolioPie({ holdings }) {
  const COLORS = holdings.map((h) => h.color || "#8884d8");
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={holdings}
          dataKey="value"
          nameKey="symbol"
          innerRadius={40}
          outerRadius={70}
        >
          {holdings.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ------------------------ Main Dashboard ------------------------
export default function TradingDashboard() {
  // mock live price series (updates every 2s)
  const [series, setSeries] = useState(() => generatePriceSeries(120, 4250));

  // portfolio mock
  const [portfolio, setPortfolio] = useState([
    { symbol: "BTC", qty: 0.25, avg: 42000, color: "#f7931a" },
    { symbol: "ETH", qty: 1.8, avg: 2900, color: "#3c3c3d" },
    { symbol: "SOL", qty: 10, avg: 32, color: "#00FFA3" },
  ]);

  // widget layout order (simple list for drag & drop)
  const [widgets, setWidgets] = useState([
    "charts",
    "orders",
    "portfolio",
    "news",
  ]);

  // orders panel state
  const [order, setOrder] = useState({
    side: "buy",
    symbol: "BTC",
    amount: 0.001,
    price: 0,
  });
  const [modalOpen, setModalOpen] = useState(false);

  // news feed
  const [news, setNews] = useState(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      title: `Market news ${i + 1}`,
      time: `${i + 1}h ago`,
      body: "Simulated news snippet.",
    }));
  });

  useEffect(() => {
    const t = setInterval(() => {
      setSeries((prev) => {
        const last = prev[prev.length - 1];
        const nextPrice = +(last.price + (Math.random() - 0.5) * 20).toFixed(2);
        const next = {
          time: `T${prev.length}`,
          price: Math.max(0, nextPrice),
          volume: Math.round(Math.random() * 2000),
        };
        const out = [...prev.slice(-119), next];
        return out;
      });
    }, 2000);
    return () => clearInterval(t);
  }, []);

  // Simulate portfolio P&L changes
  useEffect(() => {
    const t = setInterval(() => {
      setPortfolio((prev) =>
        prev.map((p) => ({
          ...p,
          current: +(p.avg * (1 + (Math.random() - 0.5) * 0.06)).toFixed(2),
        }))
      );
    }, 5000);
    return () => clearInterval(t);
  }, []);

  // drag handlers (simple HTML5 drag/drop for demo)
  function onDragStart(e, idx) {
    e.dataTransfer.setData("text/plain", idx);
  }
  function onDrop(e, dropIdx) {
    const from = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from)) return;
    setWidgets((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(from, 1);
      arr.splice(dropIdx, 0, item);
      return arr;
    });
  }
  function onDragOver(e) {
    e.preventDefault();
  }

  // order submit (local only)
  function submitOrder() {
    // locally update portfolio mimic
    const side = order.side;
    const symbol = order.symbol;
    const qty = Number(order.amount);
    setModalOpen(false);
    setPortfolio((prev) => {
      const found = prev.find((p) => p.symbol === symbol);
      if (found) {
        if (side === "buy") {
          found.qty += qty;
        } else {
          found.qty = Math.max(0, found.qty - qty);
        }
        return [...prev];
      }
      return [...prev, { symbol, qty, avg: order.price || 0, color: "#888" }];
    });
  }

  const holdingsForPie = useMemo(() => {
    // compute mocked values
    const withVal = portfolio.map((p) => ({
      symbol: p.symbol,
      value: +(p.qty * (p.current || p.avg)).toFixed(2),
      color: p.color,
    }));
    return withVal;
  }, [portfolio]);

  // infinite scroll for news
  const loadMoreNews = () => {
    setNews((prev) => {
      const next = Array.from({ length: 5 }).map((_, i) => ({
        id: prev.length + i,
        title: `Live update ${prev.length + i}`,
        time: "just now",
        body: "More simulated feed.",
      }));
      return [...prev, ...next];
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-6">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            Trading Dashboard — Zakaria / Rabya / Yassir
          </h1>
          <div className="text-sm text-slate-500">
            Mocked real-time demo · Frontend only
          </div>
        </div>
        <div className="w-2/5">
          <PriceTicker symbols={assets} />
        </div>
      </header>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Portfolio Value"
          value={`$${(
            portfolio.reduce((s, p) => s + p.qty * (p.current || p.avg), 0) || 0
          ).toFixed(2)}`}
          delta={+((Math.random() - 0.4) * 4).toFixed(2)}
        />
        <KPICard
          title="24h Volume"
          value={`$${(Math.random() * 1_000_000).toFixed(0)}`}
          delta={+((Math.random() - 0.4) * 20).toFixed(2)}
        />
        <KPICard
          title="Open Orders"
          value={Math.floor(Math.random() * 4)}
          delta={-1.2}
        />
        <KPICard
          title="Unrealized P/L"
          value={`$${(Math.random() * 5000 - 1000).toFixed(0)}`}
          delta={+(Math.random() * 10 - 5).toFixed(2)}
        />
      </div>

      {/* Draggable grid */}
      <div className="grid grid-cols-12 gap-4">
        {widgets.map((w, idx) => (
          <div
            key={w}
            draggable
            onDragStart={(e) => onDragStart(e, idx)}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, idx)}
            className="col-span-8 md:col-span-6 lg:col-span-4"
          >
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold capitalize">{w}</div>
                <div className="text-xs text-slate-400">drag</div>
              </div>

              {w === "charts" && (
                <div>
                  <div className="mb-3">
                    <SimpleLineChart data={series} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {assets.map((a) => (
                      <div
                        key={a.symbol}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-center"
                      >
                        <div className="text-sm font-medium">{a.symbol}</div>
                        <div className="text-lg font-semibold">
                          {(Math.random() * 50000).toFixed(2)}
                        </div>
                        <div className="text-xs text-slate-400">24h</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {w === "orders" && (
                <div>
                  <div className="mb-2 text-sm">Orders Panel</div>
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setOrder((o) => ({ ...o, side: "buy" }))}
                      className={`px-3 py-1 rounded ${
                        order.side === "buy"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setOrder((o) => ({ ...o, side: "sell" }))}
                      className={`px-3 py-1 rounded ${
                        order.side === "sell"
                          ? "bg-red-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700"
                      }`}
                    >
                      Sell
                    </button>
                  </div>
                  <div className="mb-2">
                    <select
                      value={order.symbol}
                      onChange={(e) =>
                        setOrder((o) => ({ ...o, symbol: e.target.value }))
                      }
                      className="w-full rounded p-2 bg-slate-50 dark:bg-slate-700"
                    >
                      {assets.map((a) => (
                        <option key={a.symbol} value={a.symbol}>
                          {a.symbol} — {a.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    Amount:{" "}
                    <input
                      type="range"
                      min={0}
                      max={5}
                      step={0.01}
                      value={order.amount}
                      onChange={(e) =>
                        setOrder((o) => ({ ...o, amount: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-slate-400">
                      Preview: {order.side.toUpperCase()} {order.amount}{" "}
                      {order.symbol}
                    </div>
                    <div>
                      <button
                        onClick={() => setModalOpen(true)}
                        className="px-3 py-1 rounded bg-blue-600 text-white"
                      >
                        Place
                      </button>
                    </div>
                  </div>

                  {modalOpen && (
                    <div className="fixed inset-0 flex items-center justify-center z-50">
                      <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setModalOpen(false)}
                      />
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-xl p-6 z-10 w-96"
                      >
                        <div className="font-semibold mb-2">Confirm Order</div>
                        <div className="text-sm text-slate-500 mb-4">
                          {order.side.toUpperCase()} {order.amount}{" "}
                          {order.symbol}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setModalOpen(false)}
                            className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={submitOrder}
                            className="px-3 py-1 rounded bg-emerald-500 text-white"
                          >
                            Confirm
                          </button>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              )}

              {w === "portfolio" && (
                <div>
                  <div className="mb-3">
                    <PortfolioPie holdings={holdingsForPie} />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-slate-500 text-left">
                        <tr>
                          <th>Asset</th>
                          <th>Qty</th>
                          <th>Price</th>
                          <th>Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.map((p) => (
                          <tr
                            key={p.symbol}
                            className="border-t border-slate-100 dark:border-slate-700"
                          >
                            <td className="py-2">{p.symbol}</td>
                            <td>{p.qty}</td>
                            <td>{p.current || p.avg}</td>
                            <td>{((p.current || p.avg) * p.qty).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {w === "news" && (
                <div>
                  <div className="space-y-3">
                    {news.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700"
                      >
                        <div className="text-sm font-medium">{n.title}</div>
                        <div className="text-xs text-slate-400">{n.time}</div>
                        <div className="text-xs mt-1">{n.body}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <button
                      onClick={loadMoreNews}
                      className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-700"
                    >
                      Load more
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </div>

      <footer className="mt-8 text-xs text-slate-500">
        This is a mocked frontend — no backend. Customize the components,
        replace charts with TradingView widget or ApexCharts candlesticks, and
        integrate real websockets for live data.
      </footer>

      {/* small style for marquee */}
      <style>{`
        .animate-marquee { animation: marquee 18s linear infinite; }
        @keyframes marquee { from { transform: translateX(0%); } to { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
