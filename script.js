/* ============================
   إعداد رابط API الأساسي
============================ */
const API_BASE_URL = "https://amanai-1.onrender.com";

/* ============================
   تحميل الإحصائيات
============================ */
async function loadDashboardStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/dashboard-stats`);
        const data = await res.json();

        document.getElementById("total-incidents").textContent = data.total;
        document.getElementById("high-incidents").textContent = data.high;
        document.getElementById("last-hour").textContent = data.last_hour;
        document.getElementById("high-risk-pct").textContent = data.high_pct + "%";
    } catch (err) {
        console.error("خطأ في تحميل الإحصائيات:", err);
    }
}

/* ============================
   تحميل البلاغات
============================ */
async function loadIncidents() {
    try {
        const res = await fetch(`${API_BASE_URL}/incidents`);
        const data = await res.json();

        const tbody = document.getElementById("incidents-table-body");
        tbody.innerHTML = "";

        data.forEach((item) => {
            const row = `
                <tr>
                    <td>${item.id}</td>
                    <td>${item.time}</td>
                    <td>${item.incident_type}</td>
                    <td>${item.observed_risk}</td>
                    <td>${item.recommendation}</td>
                    <td>${item.lat.toFixed(5)}, ${item.lng.toFixed(5)}</td>
                    <td>${item.source}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (err) {
        console.error("خطأ في تحميل البلاغات:", err);
    }
}

/* ============================
   مسح جميع البلاغات
============================ */
async function clearIncidents() {
    if (!confirm("هل أنت متأكد من مسح جميع البلاغات؟")) return;

    try {
        await fetch(`${API_BASE_URL}/clear-incidents`, { method: "POST" });
        loadIncidents();
        loadDashboardStats();
        alert("تم مسح جميع البلاغات بنجاح.");
    } catch (err) {
        console.error("خطأ في مسح البلاغات:", err);
    }
}

/* ============================
   تحليل الازدحام (AI)
============================ */
async function detectTraffic() {
    try {
        const res = await fetch(`${API_BASE_URL}/detect-traffic`);
        const data = await res.json();

        alert("تم تحليل الازدحام وإضافة بلاغات جديدة.");
        loadIncidents();
        loadDashboardStats();
    } catch (err) {
        console.error("خطأ في تحليل الازدحام:", err);
    }
}

/* ============================
   طبقة الحوادث
============================ */
async function loadIncidentsLayer(map) {
    try {
        const res = await fetch(`${API_BASE_URL}/incidents`);
        const data = await res.json();

        data.forEach((p) => {
            L.circleMarker([p.lat, p.lng], {
                radius: 8,
                color: p.predicted_risk === "مرتفع" ? "red" :
                       p.predicted_risk === "متوسط" ? "orange" : "green",
                weight: 2
            }).addTo(map);
        });

    } catch (err) {
        console.error("خطأ في طبقة الحوادث:", err);
    }
}

/* ============================
   طبقة المرور
============================ */
async function loadTrafficLayer(map) {
    try {
        const res = await fetch(`${API_BASE_URL}/traffic-hotspots`);
        const data = await res.json();

        data.forEach((p) => {
            const color =
                p.level === "مرتفع" ? "red" :
                p.level === "متوسط" ? "orange" : "green";

            L.circle([p.lat, p.lng], {
                radius: 150,
                color: color,
                fillOpacity: 0.4
            }).addTo(map);
        });

    } catch (err) {
        console.error("خطأ في طبقة المرور:", err);
    }
}

/* ============================
   تمركز الدوريات
============================ */
async function loadPatrolForecast(map) {
    try {
        const res = await fetch(`${API_BASE_URL}/patrol-forecast`);
        const data = await res.json();

        data.forEach((p) => {
            L.marker([p.lat, p.lng], { icon: L.divIcon({
                    className: "patrol-icon",
                    html: "🚓",
                    iconSize: [30, 30]
                })
            }).addTo(map);
        });

    } catch (err) {
        console.error("خطأ في تمركز الدوريات:", err);
    }
}

/* ============================
   تحميل الخريطة الحرارية
============================ */
async function loadHeatmap(map) {
    try {
        const res = await fetch(`${API_BASE_URL}/heatmap`);
        const data = await res.json();

        const points = data.points.map(p => [p.lat, p.lng, p.weight]);
        L.heatLayer(points, { radius: 25 }).addTo(map);

    } catch (err) {
        console.error("خطأ في الخريطة الحرارية:", err);
    }
}

/* ============================
   تشغيل النظام عند التحميل
============================ */
window.onload = function () {
    loadDashboardStats();
    loadIncidents();
};
