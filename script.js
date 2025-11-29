// ============================
// رابط السيرفر (Backend API)
// ============================
const API_BASE = "https://amanai-1.onrender.com";

// ============================
// تهيئة الخريطة
// ============================
var map = L.map('map').setView([24.47, 39.61], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
}).addTo(map);

let incidentsLayer = null;
let trafficLayer = null;
let patrolLayer = null;
let heatLayer = null;

// ============================
// تحديث الإحصائيات أعلى الصفحة
// ============================
async function updateDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/dashboard-stats`);
        const data = await res.json();

        document.getElementById("totalIncidents").innerText = data.total;
        document.getElementById("highIncidents").innerText = data.high ?? 0;
        document.getElementById("lastHourIncidents").innerText = data.last_hour;
        document.getElementById("highPct").innerText = data.high_pct + "%";
    } catch (e) {
        console.error("Error loading dashboard stats", e);
    }
}

// ============================
// جلب البلاغات
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
                .bindPopup(
                    `
                <b>نوع البلاغ:</b> ${inc.incident_type}<br>
                <b>الخطورة:</b> ${inc.predicted_risk}<br>
                <b>التوصية:</b> ${inc.recommendation}<br>
                <b>المصدر:</b> ${inc.source}<br>
                <b>الوقت:</b> ${inc.time}
            `
                )
                .addTo(incidentsLayer);
        });

    } catch (err) {
        console.error("Error loading incidents:", err);
    }
}

// ============================
// طبقة المرور
// ============================
async function loadTrafficHotspots() {
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
                fillOpacity: 0.9,
            })
                .bindPopup(`🚦 مستوى الازدحام: <b>${p.level}</b>`)
                .addTo(trafficLayer);
        });

    } catch (err) {
        console.error("Error loading traffic hotspots:", err);
    }
}

// ============================
// تحليل الازدحام (AI)
// ============================
async function detectTraffic() {
    try {
        await fetch(`${API_BASE}/detect-traffic`);
        await loadIncidents();
        await updateDashboardStats();
        alert("✔︎ تم تحليل الازدحام وإضافة بلاغات جديدة");
    } catch (err) {
        console.error("Error detectTraffic:", err);
    }
}

// ============================
// تمركز الدوريات
// ============================
async function loadPatrolForecast() {
    clearLayers();

    try {
        const res = await fetch(`${API_BASE}/patrol-forecast`);
        const data = await res.json();

        patrolLayer = L.layerGroup().addTo(map);

        data.forEach((p) => {
            L.marker([p.lat, p.lng], {
                icon: L.divIcon({
                    className: "patrol-icon",
                    html: "🚔",
                    iconSize: [30, 30]
                })
            })
                .bindPopup("🚓 تمركز مقترح للدورية")
                .addTo(patrolLayer);
        });

    } catch (err) {
        console.error("Error loading patrol forecast:", err);
    }
}

// ============================
// Heatmap
// ============================
async function loadHeatmap() {
    clearLayers();

    try {
        const res = await fetch(`${API_BASE}/heatmap`);
        const { points } = await res.json();

        heatLayer = L.heatLayer(
            points.map((p) => [p.lat, p.lng, p.weight]),
            { radius: 25, maxZoom: 17 }
        ).addTo(map);

    } catch (err) {
        console.error("Error loading heatmap:", err);
    }
}

// ============================
// تنظيف كل الطبقات
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
