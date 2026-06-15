// ==========================================================
// 1. DATA DATABASE UTAMA & BERKAS PENYIMPANAN
// ==========================================================
const defaultEvents = [
    { id: 1, name: "Eksplorasi Privat Borobudur VIP", price: 2500000, image: "assets/borobudur.jpg", desc: "Nikmati sunrise privat Borobudur dan sarapan bintang lima." },
    { id: 2, name: "Golden Sunrise Bromo Tour", price: 3200000, image: "assets/bromo.jpg", desc: "Jeep terbuka premium menuju penanjakan Bromo terbaik." },
    { id: 3, name: "Pertunjukan Sendratari Prambanan VIP", price: 1800000, image: "assets/prambanan.jpg", desc: "Menyaksikan kisah Ramayana langsung di baris terdepan." }
];

const defaultUsers = [{ username: "admin", password: "123" }];

// Memuat data dari penyimpanan lokal browser (LocalStorage)
let events = JSON.parse(localStorage.getItem('maul_events')) || defaultEvents;
let orders = JSON.parse(localStorage.getItem('maul_orders')) || [];
let users = JSON.parse(localStorage.getItem('maul_users')) || defaultUsers;
let currentUser = JSON.parse(localStorage.getItem('maul_current_user')) || null;
let editingEventId = null;

function saveToStorage() {
    localStorage.setItem('maul_events', JSON.stringify(events));
    localStorage.setItem('maul_orders', JSON.stringify(orders));
    localStorage.setItem('maul_users', JSON.stringify(users));
    localStorage.setItem('maul_current_user', JSON.stringify(currentUser));
}

// ==========================================================
// 2. SISTEM UTAMA KELOLA DATA TIKET WISATA (CRUD)
// ==========================================================
function renderUserEvents() {
    const grid = document.getElementById('eventGrid');
    if (!grid) return; grid.innerHTML = '';
    events.forEach(event => {
        const isBest = event.name.toLowerCase().includes('borobudur');
        grid.innerHTML += `
            <div class="event-card">
                ${isBest ? '<div class="badge-best-seller">BEST SELLER</div>' : ''}
                <img src="${event.image}" class="event-img" onerror="this.src='https://unsplash.com'">
                <div class="event-info">
                    <h3>${event.name}</h3>
                    <p>${event.desc}</p>
                    <div class="event-footer">
                        <span class="price">Rp ${event.price.toLocaleString('id-ID')}</span>
                        <button class="btn-premium" onclick="openBookingModal(${event.id})">Pesan</button>
                    </div>
                </div>
            </div>`;
    });
}

function renderAdminEvents() {
    const list = document.getElementById('adminEventList');
    if (!list) return; list.innerHTML = '';
    events.forEach(event => {
        list.innerHTML += `
            <div class="admin-list-item" style="padding:10px 0; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center;">
                <div><strong>${event.name}</strong><br><small style="color:#2e8b57;">Rp ${event.price.toLocaleString('id-ID')}</small></div>
                <div>
                    <button type="button" onclick="startEditEvent(${event.id})" style="background:#f39c12; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px; margin-right:5px;">Edit</button>
                    <button type="button" onclick="deleteEvent(${event.id})" style="background:#e74c3c; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">Hapus</button>
                </div>
            </div>`;
    });
}

function saveEventSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('eventName').value;
    const price = parseInt(document.getElementById('eventPrice').value);
    const image = document.getElementById('eventImage').value;
    const desc = document.getElementById('eventDesc').value;

    if (editingEventId) {
        const idx = events.findIndex(ev => ev.id === editingEventId);
        if (idx !== -1) events[idx] = { id: editingEventId, name, price, image, desc };
        editingEventId = null;
        document.getElementById('formAdminTitle').innerText = "Tambah Destinasi Baru";
        document.getElementById('btnSubmitForm').innerText = "Publikasikan Tiket";
    } else {
        events.push({ id: Date.now(), name, price, image, desc });
    }
    saveToStorage(); renderUserEvents(); renderAdminEvents(); renderAdminDashboard(); renderHeroSlider();
    document.getElementById('addEventForm').reset();
    alert('Data destinasi berhasil disimpan!');
}

function startEditEvent(id) {
    const target = events.find(ev => ev.id === id);
    if (!target) return;
    editingEventId = id;
    document.getElementById('formAdminTitle').innerText = "Edit Data Destinasi Wisata";
    document.getElementById('btnSubmitForm').innerText = "Simpan Perubahan";
    document.getElementById('eventName').value = target.name;
    document.getElementById('eventPrice').value = target.price;
    document.getElementById('eventImage').value = target.image;
    document.getElementById('eventDesc').value = target.desc;
    window.scrollTo({ top: document.getElementById('addEventForm').offsetTop - 100, behavior: 'smooth' });
}

function deleteEvent(id) {
    if (confirm("Hapus tiket wisata ini?")) {
        events = events.filter(ev => ev.id !== id);
        saveToStorage(); renderUserEvents(); renderAdminEvents(); renderAdminDashboard(); renderHeroSlider();
    }
}

// ==========================================================
// 3. LAPORAN TOTAL PENJUALAN & INDIVIDUAL PER WISATA
// ==========================================================
function renderAdminDashboard() {
    const list = document.getElementById('adminStatsList');
    if (!list) return; list.innerHTML = '';

    const overallTickets = orders.reduce((sum, o) => sum + o.qty, 0);
    const overallRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);

    // Box Laporan Toko Kumulatif Teratas
    list.innerHTML += `
        <div class="stats-bar-item" style="background:#1b4d3e; border-left:5px solid #2e8b57; grid-column: 1 / -1;">
            <div class="stats-info">
                <strong style="color:#fff; font-size:16px;">KUMULATIF PENJUALAN TOKO</strong>
                <span style="color:#d1dcd6; font-size:14px;">Total Akumulasi: ${overallTickets} Tiket Terjual</span>
            </div>
            <div class="stats-revenue" style="color:#ffffff; font-size:22px;">Rp ${overallRevenue.toLocaleString('id-ID')}</div>
        </div>`;

    // Box Laporan Per Tiket Wisata Rinci
    events.forEach(event => {
        const matched = orders.filter(o => o.eventName === event.name);
        const totalQty = matched.reduce((sum, o) => sum + o.qty, 0);
        const totalRevenue = matched.reduce((sum, o) => sum + o.totalPrice, 0);

        list.innerHTML += `
            <div class="stats-bar-item">
                <div class="stats-info">
                    <strong>${event.name}</strong>
                    <span>${totalQty} Tiket Terjual</span>
                </div>
                <div class="stats-revenue">Rp ${totalRevenue.toLocaleString('id-ID')}</div>
            </div>`;
    });
}

// ==========================================================
// 4. RIWAYAT TABEL TIKET MASUK (ORDER LOG)
// ==========================================================
function renderAdminOrders() {
    const orderList = document.getElementById('adminOrderList');
    if (!orderList) return; orderList.innerHTML = '';

    if (orders.length === 0) {
        orderList.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">Belum ada riwayat pesanan masuk.</td></tr>`;
        return;
    }

    orders.forEach(order => {
        orderList.innerHTML += `
            <tr>
                <td><strong>#${order.orderId}</strong></td>
                <td>${order.buyerName}</td>
                <td>${order.buyerPhone || '-'}</td>
                <td>${order.eventName}</td>
                <td>${order.qty} Tiket</td>
                <td style="font-weight:600; color:#2e8b57;">Rp ${(order.totalPrice || 0).toLocaleString('id-ID')}</td>
                <td><button type="button" onclick="deleteOrder('${order.orderId}')" style="background:none; border:none; color:#e74c3c; cursor:pointer;"><i class="fas fa-trash-alt"></i></button></td>
            </tr>`;
    });
}

function deleteOrder(orderId) {
    if (confirm(`Hapus data riwayat orderan #${orderId}?`)) {
        orders = orders.filter(o => o.orderId !== orderId);
        saveToStorage(); renderAdminOrders(); renderAdminDashboard();
    }
}

// ==========================================================
// 5. OPERASIONAL PEMESANAN MODAL & TOTAL BAYAR (USER-SIDE)
// ==========================================================
function openBookingModal(eventId) {
    const targetEvent = events.find(e => e.id === parseInt(eventId) || e.id === eventId);
    
    if (!targetEvent) {
        alert("Maaf, data destinasi tidak ditemukan!");
        return;
    }

    document.getElementById('modalEventId').value = targetEvent.id;
    document.getElementById('modalEventName').value = targetEvent.name;
    document.getElementById('modalEventPrice').value = targetEvent.price;
    
    document.getElementById('displayEventName').value = targetEvent.name;
    document.getElementById('ticketQty').value = 1;
    
    calculateModalTotal();
    document.getElementById('bookingModal').classList.add('open');
}

function closeBookingModal() {
    document.getElementById('bookingModal').classList.remove('open');
    document.getElementById('orderForm').reset();
}

function calculateModalTotal() {
    const price = parseInt(document.getElementById('modalEventPrice').value) || 0;
    const qty = parseInt(document.getElementById('ticketQty').value) || 1;
    const total = price * qty;
    
    // SUDAH FIX 100%: Menggunakan pembungkus backtick ( ` ) asli keyboard agar anti-error
    // KUNCI PERBAIKAN: Memastikan teks total terbungkus backtick asli keyboard dengan benar
    document.getElementById('modalTotalDisplay').innerText = `Rp ${total.toLocaleString('id-ID')}`;
}

function submitOrder(e) {
    e.preventDefault();
    
    // Mengambil nilai teks .value murni agar nama tidak berupa [object HTMLInputElement]
    const nameValue = document.getElementById('buyerName').value.trim();
    const phoneValue = document.getElementById('buyerPhone').value.trim();
    const eventName = document.getElementById('modalEventName').value;
    const price = parseInt(document.getElementById('modalEventPrice').value);
    const qty = parseInt(document.getElementById('ticketQty').value);

    orders.push({
        orderId: 'TRX-' + Math.floor(1000 + Math.random() * 9000),
        buyerName: nameValue, 
        buyerPhone: phoneValue, 
        eventName: eventName, 
        qty: qty, 
        totalPrice: price * qty
    });

    saveToStorage(); 
    renderAdminOrders(); 
    renderAdminDashboard(); 
    closeBookingModal();
    
    // Menampilkan pesan sukses dengan memanggil variabel nama asli
    alert(`Terima kasih ${nameValue}, Pemesanan sukses dikonfirmasi!`);
}

// ==========================================================
// 6. FORM KEAMANAN AKSES & ANIMASI SLIDER LATAR
// ==========================================================
function handleLogin(e) {
    e.preventDefault();
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value;
    if (users.find(u => u.username === user && u.password === pass)) {
        currentUser = user; saveToStorage(); showSection('admin');
    } else { alert('Username atau Password salah!'); }
}

function handleRegister(e) {
    e.preventDefault();
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value;
    if (users.some(u => u.username.toLowerCase() === user.toLowerCase())) { alert('Username terdaftar!'); return; }
    users.push({ username: user, password: pass }); saveToStorage();
    alert('Daftar sukses! Silakan login.'); toggleAuthForm();
}

function handleLogout() { currentUser = null; saveToStorage(); showSection('user'); }
function toggleAuthForm() {
    document.getElementById('loginBox').classList.toggle('hidden');
    document.getElementById('registerBox').classList.toggle('hidden');
}

function renderHeroSlider() {
    const container = document.getElementById('heroSlidesContainer');
    if (!container) return; container.innerHTML = '';
    events.forEach((event, idx) => {
        container.innerHTML += `<div class="slide ${idx === 0 ? 'active' : ''}" style="background-image: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.4)), url('${event.image}');"></div>`;
    });
}

function showSection(section) {
    const userSec = document.getElementById('user-section');
    const adminSec = document.getElementById('admin-section');
    const authSec = document.getElementById('auth-section');
    const heroBanner = document.getElementById('hero-banner');
    
    userSec.classList.add('hidden'); adminSec.classList.add('hidden'); authSec.classList.add('hidden'); heroBanner.classList.add('hidden');

    if (section === 'admin') {
        if (!currentUser) { authSec.classList.remove('hidden'); } 
        else { adminSec.classList.remove('hidden'); renderAdminEvents(); renderAdminOrders(); renderAdminDashboard(); }
    } else { userSec.classList.remove('hidden'); heroBanner.classList.remove('hidden'); }
}

let currentSlide = 0;
setInterval(() => {
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
}, 4000);

function toggleMenu() { document.getElementById('navLinks').classList.toggle('active'); }

window.onload = () => {
    renderHeroSlider(); renderUserEvents();
    renderAdminEvents(); renderAdminOrders(); renderAdminDashboard();
};
