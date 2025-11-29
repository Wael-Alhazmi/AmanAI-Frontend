// ============================
// رابط السيرفر (Backend API)
// ============================
const API_BASE = "https://amanai-1.onrender.com";

// ============================
// تهيئة الخريطة
// ============================
var map = L.map("map").setView([24.47, 39.61], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
}).addTo(map);

let incidentsLayer = null;
let trafficLayer = null;
let patrolLayer = null;
let heatLayer = null;

// ============================
// تحديث الإحصائيات
// ============================
async function updateDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/dashboard-stats`);
        const data = await res.json();

        document.getElementById("stat_total").innerText = data.total;
        document.getElementById("stat_high").innerText = data.high;
        document.getElementById("stat_last_hour").innerText = data.last_hour;
        document.getElementById("stat_high_pct").innerText = data.high_pct + "%";
    } catch (err) {
        console.error("Error loading dashboard stats", err);
    }
}

// ============================
// جلب البلاغات على الخريطة
// ============================
async function loadIncidents() {
    clearLayers();

    try {
        const res = await fetch(`${API_BASE}/incidents`);
        const data = await res.json();

        incidentsLayer = L.layerGroup().addTo(map);

        data.forEach((inc) => {
            let color =
                inc.predicted_risk === "مرتفع"
                    ? "red"
                    : inc.predicted_risk === "متوسط"
                    ? "orange"
                    : "green";

            L.circleMarker([inc.lat, inc.lng], {
                radius: 8,
                color: color,
                fillColor: color,
                fillOpacity: 0.8,
            })
                .bindPopup(`
                    <b>نوع البلاغ:</b> ${inc.incident_type}<br>
                    <b>الخطورة:</b> ${inc.predicted_risk}<br>
                    <b>التوصية:</b> ${inc.recommendation}<br>
                    <b>المصدر:</b> ${inc.source}<br>
                    <b>الوقت:</b> ${inc.time}
                `)
                .addTo(incidentsLayer);
        });

        renderIncidentTable(data);
        renderCharts(data);

    } catch (err) {
        console.error("Error loading incidents:", err);
    }
}

// ===============================
// جدول البلاغات
// ===============================
function renderIncidentTable(data) {
    const tbody = document.getElementById("incident_table");
    tbody.innerHTML = "";

    data.slice().reverse().forEach((inc) => {
        tbody.innerHTML += `
            <tr>
                <td>${inc.incident_type}</td>
                <td>${inc.predicted_risk}</td>
                <td>${inc.observed_risk}</td>
                <td>${inc.recommendation}</td>
                <td>${inc.lat.toFixed(4)}, ${inc.lng.toFixed(4)}</td>
                <td>${inc.time}</td>
                <td>—</td>
            </tr>
        `;
    });
}

// ===============================
// المخططات (Chart.js)
// ===============================
function renderCharts(data) {
    const counts = { منخفض: 0, متوسط: 0, مرتفع: 0 };

    data.forEach((inc) => {
        if (counts[inc.predicted_risk] !== undefined) {
            counts[inc.predicted_risk]++;
        }
    });

    // Pie chart
    new Chart(document.getElementById("riskChart"), {
        type: "pie",
        data: {
            labels: ["منخفض", "متوسط", "مرتفع"],
            datasets: [
                {
                    data: [counts.منخفض, counts.متوسط, counts.مرتفع],
                    backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
                },
            ],
        },
    });

    // Bar chart
    new Chart(document.getElementById("riskBarChart"), {
        type: "bar",
        data: {
            labels: ["منخفض", "متوسط", "مرتفع"],
            datasets: [
                {
                    label: "عدد البلاغات",
                    data: [counts.منخفض, counts.متوسط, counts.مرتفع],
                    backgroundColor: ["#22c55e", "#f59e0b", "#ef4444"],
                },
            ],
        },
    });
}

// ============================
// طبقة المرور
// ============================
async function toggleTraffic() {
    clearLayers();

    try {
        const res = await fetch(`${API_BASE}/traffic-hotspots`);
        const data = await res.json();

        trafficLayer = L.layerGroup().addTo(map);

        data.forEach((p) => {
            let color =
                p.level === "مرتفع"
                    ? "red"
                    : p.level === "متوسط"
                    ? "orange"
                    : "green";

            L.circleMarker([p.lat, p.lng], {
                radius: 10,
                color: color,
                fillColor: color,
                fillOpacity: 1,
            })
                .bindPopup(`🚦 مستوى الازدحام: <b>${p.level}</b>`)
                .addTo(trafficLayer);
        });

    } catch (err) {
        console.error("Traffic error:", err);
    }
}

// ============================
// طبقة الحوادث
// ============================
async function toggleIncidents() {
    loadIncidents();
}

// ============================
// تحليل الازدحام
// ============================
async function detectTraffic() {
    try {
        await fetch(`${API_BASE}/detect-traffic`);
        loadIncidents();
        updateDashboardStats();
    } catch (err) {
        console.error("Error detectTraffic:", err);
    }
}

// ============================
// تمركز الدوريات (Forecast AI)
// ============================
async function forecastPatrolZones() {
    clearLayers();

    try {
        const res = await fetch(`${API_BASE}/patrol-forecast`);
        const data = await res.json();

        patrolLayer = L.layerGroup().addTo(map);

        data.forEach((p) => {
            L.marker([p.lat, p.lng], {
                icon: L.divIcon({
                    className: "patrol-pulse",
                    iconSize: [30, 30],
                }),
            })
                .bindPopup("🚓 تمركز مقترح للدورية خلال 24 ساعة")
                .addTo(patrolLayer);
        });

    } catch (err) {
        console.error("Error patrol forecast:", err);
    }
}

// ============================
// تسجيل بلاغ يدوي
// ============================
async function logIncident() {
    const payload = {
        incident_type: document.getElementById("incident_type").value,
        observed_risk: document.getElementById("observed_risk").value,
        recommendation: document.getElementById("manual_recommendation").value,
        lat: parseFloat(document.getElementById("manual_lat").value),
        lng: parseFloat(document.getElementById("manual_lng").value),
    };

    try {
        await fetch(`${API_BASE}/log-incident`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        document.getElementById("log_output").innerText = "✔ تم حفظ البلاغ بنجاح";

        loadIncidents();
        updateDashboardStats();

    } catch (err) {
        console.error("Error saving incident:", err);
    }
}

// ============================
// مسح البلاغات
// ============================
async function clearIncidents() {
    if (!confirm("هل أنت متأكد من حذف جميع البلاغات؟")) return;

    await fetch(`${API_BASE}/clear-incidents`, { method: "POST" });
    loadIncidents();
    updateDashboardStats();
}

// ============================
// تنظيف الطبقات
// ============================
function clearLayers() {
    if (incidentsLayer) map.removeLayer(incidentsLayer);
    if (trafficLayer) map.removeLayer(trafficLayer);
    if (patrolLayer) map.removeLayer(patrolLayer);
    if (heatLayer) map.removeLayer(heatLayer);

    incidentsLayer = null;
    trafficLayer = null;
    patrolLayer = null;
    heatLayer = null;
}

// ============================
// عند تحميل الصفحة
// ============================
window.onload = function () {
    updateDashboardStats();
    loadIncidents();
};
