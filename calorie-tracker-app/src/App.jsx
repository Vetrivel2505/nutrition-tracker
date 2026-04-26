import { useState, useEffect } from "react";
import "./App.css";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Legend);

function App() {
  // ================= STATE =================
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [weight, setWeight] = useState("");

  const [goal, setGoal] = useState(2000);
  const [darkMode, setDarkMode] = useState(false);
  const [toast, setToast] = useState("");

  // ================= NUTRITION =================
  const [list, setList] = useState(() => {
    const saved = localStorage.getItem("nutrition");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("nutrition", JSON.stringify(list));
  }, [list]);

  // ================= WEIGHT =================
  const [weightList, setWeightList] = useState(() => {
    const saved = localStorage.getItem("weights");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("weights", JSON.stringify(weightList));
  }, [weightList]);

  // ================= DARK MODE =================
  useEffect(() => {
    document.body.className = darkMode ? "dark" : "";
  }, [darkMode]);

  // ================= ADD ENTRY =================
  const addEntry = async () => {
  if (!calories) return;

  const entry = {
    id: Date.now(),
    calories: Number(calories),
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    date: new Date().toLocaleDateString(),
  };

  await axios.post("http://localhost:5000/nutrition", entry);

  setList([...list, entry]);

  setCalories("");
  setProtein("");
  setCarbs("");
  setFat("");

  setToast(`+${entry.calories} kcal added`);
  setTimeout(() => setToast(""), 2000);
};

useEffect(() => {
  axios.get("http://localhost:5000/nutrition")
    .then((res) => setList(res.data));
}, []);
  // ================= DELETE =================
  const deleteItem = async (id) => {
  await axios.delete(`http://localhost:5000/nutrition/${id}`);
  setList(list.filter((item) => item.id !== id));
};

  // ================= TOTALS =================
  const totalCalories = list.reduce((a, b) => a + b.calories, 0);
  const totalProtein = list.reduce((a, b) => a + b.protein, 0);
  const totalCarbs = list.reduce((a, b) => a + b.carbs, 0);
  const totalFat = list.reduce((a, b) => a + b.fat, 0);

  // ================= GROUP =================
  const groupedData = list.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});

  const dates = Object.keys(groupedData);

  const dailyTotals = dates.map((date) =>
    groupedData[date].reduce((sum, item) => sum + item.calories, 0)
  );

  // ================= INSIGHTS =================
  let bestDay = { date: "-", calories: 0 };

  dates.forEach((date) => {
    const total = groupedData[date].reduce((a, b) => a + b.calories, 0);
    if (total > bestDay.calories) bestDay = { date, calories: total };
  });

  const avgCalories =
    dates.length > 0
      ? Math.round(dailyTotals.reduce((a, b) => a + b, 0) / dates.length)
      : 0;

  const status =
    avgCalories > goal
      ? "Above goal ⚠️"
      : avgCalories < goal
      ? "Below goal 👍"
      : "Perfect 🎯";

  // ================= STREAK =================
  const sortedDates = [...dates].sort((a, b) => new Date(a) - new Date(b));
  let streak = 0;

  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const t = groupedData[sortedDates[i]].reduce(
      (a, b) => a + b.calories,
      0
    );
    if (t <= goal) streak++;
    else break;
  }

  // ================= CALORIE CHART =================
  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "Calories",
        data: dailyTotals,
        borderColor: "#6366f1",
        backgroundColor: "rgba(99,102,241,0.2)",
        fill: true,
      },
    ],
  };

  // ================= WEIGHT =================
  const addWeight = async () => {
  if (!weight) return;

  const newWeight = {
    id: Date.now(),
    value: Number(weight),
    date: new Date().toLocaleDateString(),
  };

  await axios.post("http://localhost:5000/weight", newWeight);

  setWeightList([...weightList, newWeight]);

  setWeight("");
};

 const deleteWeight = async (id) => {
  await axios.delete(`http://localhost:5000/weight/${id}`);
  setWeightList(weightList.filter((w) => w.id !== id));
};

useEffect(() => {
  axios.get("http://localhost:5000/weight")
    .then((res) => setWeightList(res.data));
}, []);

  const lastWeight = weightList[weightList.length - 1]?.value;
  const prevWeight = weightList[weightList.length - 2]?.value;

  let weightChange = 0;
  if (lastWeight !== undefined && prevWeight !== undefined) {
    weightChange = lastWeight - prevWeight;
  }

  const weightChartData = {
    labels: weightList.map((w) => w.date),
    datasets: [
      {
        label: "Weight",
        data: weightList.map((w) => w.value),
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,0.2)",
        fill: true,
      },
    ],
  };

  // ================= WEEKLY AVG =================
  const getWeekNumber = (dateStr) => {
    const d = new Date(dateStr);
    return Math.ceil(d.getDate() / 7);
  };

  const weeklyData = {};

  weightList.forEach((w) => {
    const week = getWeekNumber(w.date);
    if (!weeklyData[week]) weeklyData[week] = [];
    weeklyData[week].push(w.value);
  });

  const weeklyAvg = Object.keys(weeklyData).map((week) => {
    const values = weeklyData[week];
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    return {
      week,
      avg: Math.round(avg),
    };
  });

  // ================= PROGRESS =================
  const progress = goal ? Math.min((totalCalories / goal) * 100, 100) : 0;

  return (
    <div className="container">
      {toast && <div className="toast">{toast}</div>}

      {/* HEADER */}
      <div className="header">
        <h1>Nutrition Tracker</h1>
        <h2>{totalCalories} kcal</h2>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card"><p>Calories</p><h3>{totalCalories}</h3></div>
        <div className="stat-card"><p>Protein</p><h3>{totalProtein}g</h3></div>
        <div className="stat-card"><p>Carbs</p><h3>{totalCarbs}g</h3></div>
        <div className="stat-card"><p>Fat</p><h3>{totalFat}g</h3></div>
      </div>

      {/* PROGRESS */}
      <div className="progress-wrapper">
        <div className="progress-container">
          <div
            className="progress-bar"
            style={{
              width: `${progress}%`,
              background: totalCalories > goal ? "#ef4444" : "#22c55e",
            }}
          />
        </div>
        <p>{Math.round(progress)}% of goal</p>
      </div>

      <div className="streak">🔥 Streak: {streak}</div>

      {/* INSIGHTS */}
      <div className="card">
        <h3>Insights</h3>
        <p>🔥 Best: {bestDay.calories} ({bestDay.date})</p>
        <p>📊 Avg: {avgCalories}/day</p>
        <p>⚡ {status}</p>
      </div>

      {/* CALORIE CHART */}
      <div className="card">
        <h3>Progress Chart</h3>
        <Line data={chartData} />
      </div>

      {/* INPUTS */}
      <div className="controls">
        <button onClick={() => setDarkMode(!darkMode)}>Toggle Mode</button>
        <input type="number" value={goal} onChange={(e) => setGoal(Number(e.target.value))} placeholder="Goal" />
        <input type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Calories" />
        <input type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="Protein" />
        <input type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="Carbs" />
        <input type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Fat" />
        <button onClick={addEntry}>Add</button>
      </div>

      {/* WEIGHT */}
      <div className="card">
        <h3>Weight Tracker</h3>

        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder="Enter weight"
        />

        {weightList.length > 1 && (
          <p style={{ color: weightChange > 0 ? "red" : "green" }}>
            {weightChange > 0
              ? `⬆️ +${weightChange} kg`
              : `⬇️ ${Math.abs(weightChange)} kg`}
          </p>
        )}

        <button onClick={addWeight}>Add Weight</button>

        {weightList.map((w) => (
          <div key={w.id} className="entry">
            <span>{w.date} → {w.value} kg</span>
            <button onClick={() => deleteWeight(w.id)}>Delete</button>
          </div>
        ))}

        {weightList.length > 0 && <Line data={weightChartData} />}
      </div>

      {/* WEEKLY AVG */}
      <div className="card">
        <h3>Weekly Avg Weight</h3>
        {weeklyAvg.map((w) => (
          <p key={w.week}>Week {w.week}: {w.avg} kg</p>
        ))}
      </div>

      {/* LOGS */}
      {dates.map((date) => (
        <div key={date} className="card">
          <h3>{date}</h3>

          {groupedData[date].map((item) => (
            <div key={item.id} className="entry">
              <span>
                {item.calories} kcal | P:{item.protein} C:{item.carbs} F:{item.fat}
              </span>
              <button onClick={() => deleteItem(item.id)}>Delete</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default App;