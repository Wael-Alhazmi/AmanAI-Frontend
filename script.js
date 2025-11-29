// ==============================================
// إعداد الرابط الأساسي للـ Backend
// ==============================================
const API_BASE = "https://amanai-1.onrender.com";

// ==============================================
// تحميل البيانات مباشرة عند فتح الصفحة
// ==============================================
document.addEventListener("DOMContentLoaded", () => {
    loadDashboard();
});

// ======================================================
// دالة جلب إحصائيات الـ Dashboard
// ======================================================
function loadDashboard() {
    fetch(`${API_BASE}/dashboard-stats`)
        .then((res) => res.json())
        .then((data) => {
            document.getElementById("totalReports").innerText = data.total;
            document.getElementById("highReports").innerText = data.high;
            document.getElementById("lastHourReports").innerText = data.last_hour;
            document.getElementById("riskPercentage").innerText = data.high_pct + "%";
        })
        .catch((err) => console.error("Dashboard error:", err));
}

// ======================================================
// إعداد الخريطة
// ======================================================
var map = L.map("map").setView([24.47, 39.61], 13);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "AmanAI Maps",
}).addTo(map);

// ======================================================
// طبقات مختلفة للخريطة
// ======================================================
var trafficLayer = L.layerGroup().addTo(map);
var incidentLayer = L.layerGroup().addTo(map);
var patrolLayer = L.layerGroup().addTo(map);

// ======================================================
// زر: تحليل الازدحام 🔥
// ======================================================
function detectTraffic() {
    fetch(`${API_BASE}/detect-traffic`)
        .then((res) => res.json())
        .then(() => {
            alert("تم تحليل الازدحام وإضافة بلاغات جديدة");
            loadIncidents();
            loadTrafficLayer();
        })
        .catch((err) => console.error("Error:", err));
}

// ======================================================
// جلب البلاغات من قاعدة البيانات
// ======================================================
function loadIncidents() {
    incidentLayer.clearLayers();

    fetch(`${API_BASE}/incidents`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach(row => {
                L.circleMarker([row.lat, row.lng], {
                    radius: 8,
                    color: row.predicted_risk === "مرتفع" ? "red" :
                           row.predicted_risk === "متوسط" ? "orange" : "green",
                    fillOpacity: 0.8,
                })
                .bindPopup(`
                    <b>نوع البلاغ:</b> ${row.incident_type}<br>
                    <b>الخطر المتوقع:</b> ${row.predicted_risk}<br>
                    <b>الخطر المرصود:</b> ${row.observed_risk}<br>
                    <b>التوصية:</b> ${row.recommendation}<br>
                    <b>الوقت:</b> ${row.time}<br>
                    <b>المصدر:</b> ${row.source}
                `)
                .addTo(incidentLayer);
            });
        });
}

// ======================================================
// طبقة الحوادث 🔴
// ======================================================
function toggleIncidents() {
    if (map.hasLayer(incidentLayer)) {
        map.removeLayer(incidentLayer);
    } else {
        loadIncidents();
        map.addLayer(incidentLayer);
    }
}

// ======================================================
// طبقة المرور 🚦
// ======================================================
function loadTrafficLayer() {
    trafficLayer.clearLayers();

    fetch(`${API_BASE}/traffic-hotspots`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach(p => {
                L.circle([p.lat, p.lng], {
                    radius: 120,
                    color: p.level === "مرتفع" ? "red" :
                           p.level === "متوسط" ? "orange" : "green",
                    fillOpacity: 0.4,
                })
                .bindPopup(`📍 مستوى الازدحام: <b>${p.level}</b>`)
                .addTo(trafficLayer);
            });
        });
}

function toggleTraffic() {
    if (map.hasLayer(trafficLayer)) {
        map.removeLayer(trafficLayer);
    } else {
        loadTrafficLayer();
        map.addLayer(trafficLayer);
    }
}

// ======================================================
// تمركز الدوريات 🚓
// ======================================================
function loadPatrolForecast() {
    patrolLayer.clearLayers();

    fetch(`${API_BASE}/patrol-forecast`)
        .then((res) => res.json())
        .then((data) => {
            data.forEach(p => {
                L.marker([p.lat, p.lng])
                    .bindPopup("🚓 موقع مقترح لتمركز الدورية")
                    .addTo(patrolLayer);
            });
        });
}

function togglePatrol() {
    if (map.hasLayer(patrolLayer)) {
        map.removeLayer(patrolLayer);
    } else {
        loadPatrolForecast();
        map.addLayer(patrolLayer);
    }
}

// ======================================================
// Heatmap (الخريطة الحرارية)
// ======================================================
function loadHeatmap() {
    fetch(`${API_BASE}/heatmap`)
        .then((res) => res.json())
        .then((data) => {
            var points = data.points.map(p => [p.lat, p.lng, p.weight]);
            if (window.heatLayer) map.removeLayer(window.heatLayer);

            window.heatLayer = L.heatLayer(points, {
                radius: 25,
                blur: 15,
                maxZoom: 17
            }).addTo(map);
        });
}
