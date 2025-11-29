// ===========================================================
//   إعداد رابط الـ Backend
// ===========================================================
const API_BASE = "https://amanai-26b5.onrender.com";

// ===========================================================
//   تحميل بيانات الإحصائيات العلوية
// ===========================================================
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE}/dashboard-stats`);
        const data = await res.json();

        document.getElementById("stat_high").innerText = data.high_risk;
        document.getElementById("stat_last_hour").innerText = data.last_hour;
        document.getElementById("stat_total").innerText = data.total;

    } catch (err) {
        console.error("❌ Stats Error:", err);
    }
}

// ===========================================================
//   رسم البلاغات على الخريطة
// ===========================================================
let map;
let incidentMarkers = [];

function initMap() {
    map = L.map("map", { zoomControl: true }).setView([24.467, 39.6], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19
    }).addTo(map);
}

function renderIncidentsOnMap(incidents) {
    // مسح الماركر القديمة
    incidentMarkers.forEach(m => map.removeLayer(m));
    incidentMarkers = [];

    incidents.forEach(inc => {
        try {
            if (!inc.coords) return;
            const [lat, lng] = inc.coords.split(",").map(Number);

            const color =
                inc.level === "منخفض" ? "green" :
                inc.level === "متوسط" ? "orange" : "red";

            const marker = L.circleMarker([lat, lng], {
                radius: 10,
                color: color,
                fillColor: color,
                fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`
                <b>نوع البلاغ:</b> ${inc.type}<br>
                <b>الخطورة:</b> ${inc.level}<br>
                <b>التوصية:</b> ${inc.recommendation || "—"}<br>
                <b>الوقت:</b> ${inc.time}
            `);

            incidentMarkers.push(marker);
        } catch (e) {
            console.log("Bad Incident:", inc);
        }
    });
}

// ===========================================================
//   تحميل البلاغات
// ===========================================================
async function loadIncidents() {
    try {
        const res = await fetch(`${API_BASE}/incidents`);
        const data = await res.json();

        renderIncidentsOnMap(data);

    } catch (err) {
        console.error("❌ Load Incidents Error:", err);
    }
}

// ===========================================================
//   تسجيل بلاغ جديد
// ===========================================================
async function saveIncident() {
    const type = document.getElementById("incident_type").value;
    const level = document.getElementById("incident_level").value;
    const coords = document.getElementById("incident_coords").value;
    const recommendation = document.getElementById("incident_reco").value;

    if (!coords) return alert("الرجاء إدخال الإحداثيات");

    const payload = { type, level, coords, recommendation };

    try {
        const res = await fetch(`${API_BASE}/save-incident`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        alert("تم تسجيل البلاغ بنجاح");
        loadIncidents();

    } catch (err) {
        console.error("❌ Save Error:", err);
        alert("حدث خطأ أثناء الحفظ");
    }
}

// ===========================================================
//   زر: تحليل الازدحام 🔥
// ===========================================================
async function runTrafficForecast() {
    try {
        const res = await fetch(`${API_BASE}/patrol-forecast`);
        const data = await res.json();

        console.log("🔥 Patrol Forecast:", data);
        alert("تم تنفيذ تحليل الازدحام بنجاح");

    } catch (err) {
        console.error("❌ Forecast Error:", err);
        alert("خطأ في الاتصال");
    }
}

// ===========================================================
//   تحميل المخططين (مستوى الخطورة)
// ===========================================================
async function loadCharts() {
    try {
        const res = await fetch(`${API_BASE}/dashboard-stats`);
        const stats = await res.json();

        const ctx = document.getElementById("riskChart");

        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["منخفض", "متوسط", "مرتفع"],
                datasets: [{
                    data: [stats.low, stats.medium, stats.high],
                    backgroundColor: ["#4CAF50", "#FFC107", "#E53935"]
                }]
            }
        });

    } catch (err) {
        console.log("Chart Error:", err);
    }
}

// ===========================================================
//   عند تحميل الصفحة
// ===========================================================
window.onload = () => {
    initMap();
    loadDashboardStats();
    loadIncidents();
    loadCharts();
};
