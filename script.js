/* ============================================
   رابط الـ Backend (FastAPI)
============================================ */
const API_BASE = "https://amanai-1.onrender.com";

/* ============================================
   إنشاء الخريطة
============================================ */
var map = L.map("map").setView([24.47, 39.61], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap",
}).addTo(map);

/* طبقات */
let incidentsLayer = null;
let trafficLayer = null;
let patrolLayer = null;
let heatLayer = null;

/* ============================================
   1) تحديث إحصائيات أعلى الصفحة
============================================ */
async function updateDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/dashboard-stats`);
        const data = await res.json();

        document.getElementById("stat_total").innerText = data.total;
        document.getElementById("stat_high").innerText = data.high;
        document.getElementById("stat_last_hour").innerText = data.last_hour;
        document.getElementById("stat_high_pct").innerText = data.high_pct + "%";
    } catch (e) {
        console.error("Error loading dashboard stats", e);
    }
}

/* ============================================
   تنظيف الطبقات
============================================ */
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

/* ============================================
   2) طبقة البلاغات (حوادث + ازدحام...)
============================================ */
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
                    <b>المرصودة:</b> ${inc.observed_risk}<br>
                    <b>التوصية:</b> ${inc.recommendation}<br>
                    <b>المصدر:</b> ${inc.source}<br>
                    <b>الوقت:</b> ${inc.time}
                `
                )
                .addTo(incidentsLayer);
        });
    } catch (e) {
        console.error("Error loading incidents", e);
    }
}

/* زر الواجهة */
function toggleIncidentsLayer() {
    loadIncidents();
    showNotification("🔴 تم تفعيل طبقة الحوادث");
}

/* ============================================
   3) طبقة المرور (Hotspots)
============================================ */
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
    } catch (e) {
        console.error("Error loading traffic layer", e);
    }
}

/* زر الواجهة */
function toggleTrafficLayer() {
    loadTrafficHotspots();
    showNotification("🚦 تم تفعيل طبقة المرور");
}

/* ============================================
   4) تحليل الازدحام تلقائيًا (AI)
============================================ */
async function detectTrafficAutomatically() {
    try {
        await fetch(`${API_BASE}/detect-traffic`);
        await loadIncidents();
        await updateDashboardStats();

        showNotification("🔥 تم تحليل الازدحام وإضافة بلاغات جديدة");
    } catch (e) {
        console.error("Error in detectTraffic:", e);
    }
}

/* ============================================
   5) تمركز الدوريات (Forecast)
============================================ */
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
                    iconSize: [30, 30],
                }),
            })
                .bindPopup("🚓 موقع مقترح لتمركز الدورية")
                .addTo(patrolLayer);
        });

        showNotification("🚔 تم استعراض أفضل تمركز للدوريات");

    } catch (e) {
        console.error("Error loading patrol forecast", e);
    }
}

/* زر الواجهة */
function forecastPatrolZones() {
    loadPatrolForecast();
}

/* ============================================
   6) Heatmap (في حال أردت تفعيلها لاحقًا)
============================================ */
async function loadHeatmap() {
    clearLayers();

    try {
        const res = await fetch(`${API_BASE}/heatmap`);
        const { points } = await res.json();

        heatLayer = L.heatLayer(
            points.map((p) => [p.lat, p.lng, p.weight]),
            { radius: 25 }
        ).addTo(map);

        showNotification("🌡 تم تفعيل الخريطة الحرارية");

    } catch (e) {
        console.error("Error Loading Heatmap", e);
    }
}

/* ============================================
   7) إشعار أعلى الخريطة
============================================ */
function showNotification(text) {
    const box = document.getElementById("map-notify");
    box.innerText = text;
    box.style.display = "block";

    setTimeout(() => {
        box.style.display = "none";
    }, 2500);
}

/* ============================================
   8) عند تحميل الصفحة
============================================ */
window.onload = function () {
    updateDashboardStats();
    loadIncidents();
};
