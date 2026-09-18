// ==========================================================================
// LIVE DELIVERY TRACKING ENGINE (Leaflet.js + OSRM Real Road + Traffic Simulation)
// Ruang Rasa Coffee Shop - Real-Time Customer & Driver Delivery Map
// Bandung Traffic Engine: Hijau (Lancar 1s), Kuning (Padat 2-3s), Merah (Macet 3-5s)
// Flow: Dapur Menyiapkan (Kurir Standby di Kedai) -> Driver Klik Antar -> Kurir Berjalan di Maps -> Sampai
// ==========================================================================

const TrackingPage = {
    map: null,
    driverMarker: null,
    cafeMarker: null,
    customerMarker: null,
    routeSegmentPolylines: [],
    routeBorderLines: [],
    activeOrderId: 'RR-20260916-0007',
    activeOrders: [],
    driverLocation: { lat: -6.917500, lng: 107.609800 },
    cafeLocation: { lat: -6.917500, lng: 107.609800 }, // Ruang Rasa Flagship Jl. Braga No. 45, Bandung
    customerLocation: { lat: -6.904000, lng: 107.618000 }, // Tujuan Pengantaran
    roadCoordinates: [], // Koordinat titik jalan asli
    trafficSegments: [], // Segmen-segmen jalan dengan kondisi lalu lintas
    densePath: [], // Titik-titik interpolasi halus
    currentStepIndex: 0,
    currentSpeedKmH: 0,
    currentTrafficCondition: 'smooth', // 'smooth' | 'moderate' | 'congested'
    currentStreetName: 'Jl. Braga No. 45 (Kedai)',
    simTimeoutId: null,
    isSimRunning: false,
    pollInterval: null,
    isBroadcasting: false,
    watchId: null,
    isDeliveredState: false,
    ratingSubmitted: false,
    isDriverMode: false,

    getStorageKey() {
        return `ruangrasa_tracking_${this.activeOrderId || 'default'}`;
    },

    saveTrackingState() {
        try {
            const state = {
                orderId: this.activeOrderId,
                stepIndex: this.currentStepIndex,
                totalSteps: this.densePath.length,
                driverLocation: this.driverLocation,
                currentTrafficCondition: this.currentTrafficCondition,
                currentSpeedKmH: this.currentSpeedKmH,
                currentStreetName: this.currentStreetName,
                isSimRunning: this.isSimRunning,
                isDeliveredState: this.isDeliveredState,
                ratingSubmitted: this.ratingSubmitted,
                timestamp: Date.now()
            };
            localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
        } catch (e) {
            console.warn('saveTrackingState error:', e);
        }
    },

    loadTrackingState() {
        try {
            const raw = localStorage.getItem(this.getStorageKey());
            if (raw) {
                return JSON.parse(raw);
            }
        } catch (e) {
            console.warn('loadTrackingState error:', e);
        }
        return null;
    },

    async init() {
        this.stopSimulation();
        this.stopDriverGps();

        const user = Api.getCurrentUser();
        const hash = window.location.hash || '';
        
        this.isDriverMode = (user && (user.role || '').toLowerCase() === 'driver') || hash.includes('driver') || hash.includes('role=driver');

        // Tangkap parameter order dari URL hash jika ada misal #/tracking?order=RR-20260916-0009
        if (hash.includes('?')) {
            const queryPart = hash.split('?')[1];
            const params = new URLSearchParams(queryPart);
            const orderParam = params.get('order');
            if (orderParam) {
                this.activeOrderId = decodeURIComponent(orderParam);
            }
            if (params.get('role') === 'driver') {
                this.isDriverMode = true;
            }
        }

        // Render struktur awal
        this.render();

        // Muat data pesanan aktif dari database
        try {
            await this.loadActiveOrders();
            this.render();
        } catch (err) {
            console.warn('TrackingPage loadActiveOrders warn:', err);
        }

        // Inisialisasi Peta Leaflet & Rute Jalan
        setTimeout(async () => {
            await this.initMap();
        }, 80);

        this.startLivePolling();
    },

    toggleDriverMode(mode) {
        this.isDriverMode = mode !== undefined ? mode : !this.isDriverMode;
        this.render();
        setTimeout(() => this.initMap(), 80);
    },

    async loadActiveOrders() {
        try {
            const res = await Api.get('/tracking/active-deliveries');
            if (res && res.Data && res.Data.length > 0) {
                this.activeOrders = res.Data;
                if (!this.activeOrderId) {
                    this.activeOrderId = res.Data[0].OrderNumber;
                }
            } else {
                this.fallbackOrders();
            }
        } catch {
            this.fallbackOrders();
        }

        if (this.activeOrderId && !this.activeOrders.some(o => o.OrderNumber === this.activeOrderId)) {
            try {
                const user = Api.getCurrentUser();
                if (user && user.id) {
                    const histRes = await Api.get(`/orders/customer/${user.id || user.userId || user.UserId}`);
                    if (histRes && histRes.Data) {
                        const matched = histRes.Data.find(o => o.OrderNumber === this.activeOrderId);
                        if (matched) {
                            this.activeOrders.unshift(matched);
                        }
                    }
                }
            } catch (err) {
                console.warn('Load history order fallback warn:', err);
            }
        }
    },

    fallbackOrders() {
        if (!this.activeOrders || this.activeOrders.length === 0) {
            this.activeOrders = [
                {
                    OrderNumber: this.activeOrderId || 'RR-20260916-0007',
                    CustomerName: 'Pelanggan Ruang Rasa',
                    CustomerPhone: '081234567890',
                    DeliveryAddress: 'Jl. LLRE Martadinata (Riau) No. 45, Citarum, Kec. Bandung Wetan, Kota Bandung',
                    OrderStatus: 'Cooking',
                    TotalAmount: 58000,
                    DriverName: 'Budi Santoso (Kurir Dedicated Ruang Rasa)'
                }
            ];
        }
    },

    // =========================================================================
    // INISIALISASI PETA LEAFLET & TRAFFIC ENGINE
    // =========================================================================
    async initMap() {
        const mapContainer = document.getElementById('tracking-leaflet-map');
        if (!mapContainer) return;

        if (typeof L === 'undefined') {
            setTimeout(() => this.initMap(), 100);
            return;
        }

        if (this.map) {
            try {
                this.map.off();
                this.map.remove();
            } catch (e) {
                console.warn('Leaflet map remove warn:', e);
            }
            this.map = null;
            this.driverMarker = null;
            this.cafeMarker = null;
            this.customerMarker = null;
            this.routeSegmentPolylines = [];
            this.routeBorderLines = [];
        }

        try {
            if (mapContainer._leaflet_id) {
                delete mapContainer._leaflet_id;
            }
        } catch {}
        mapContainer._leaflet_id = null;
        mapContainer.innerHTML = '';

        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];
        if (currentOrder && currentOrder.DeliveryAddress) {
            const gpsMatch = currentOrder.DeliveryAddress.match(/\[Koordinat GPS:\s*([-\d.]+),\s*([-\d.]+)\]/);
            if (gpsMatch) {
                const lat = parseFloat(gpsMatch[1]);
                const lng = parseFloat(gpsMatch[2]);
                if (!isNaN(lat) && !isNaN(lng)) {
                    this.customerLocation = { lat, lng };
                }
            } else if (currentOrder.DeliveryAddress.toLowerCase().includes('cibadak') || currentOrder.DeliveryAddress.toLowerCase().includes('astana')) {
                this.customerLocation = { lat: -6.921500, lng: 107.599200 };
            } else if (currentOrder.DeliveryAddress.toLowerCase().includes('riau') || currentOrder.DeliveryAddress.toLowerCase().includes('citarum')) {
                this.customerLocation = { lat: -6.904000, lng: 107.618000 };
            } else if (currentOrder.DeliveryAddress.toLowerCase().includes('dago') || currentOrder.DeliveryAddress.toLowerCase().includes('coblong')) {
                this.customerLocation = { lat: -6.886000, lng: 107.614000 };
            }
        } else if (window.ProfilePage && window.ProfilePage.selectedLocation && window.ProfilePage.selectedLocation.lat) {
            this.customerLocation = {
                lat: window.ProfilePage.selectedLocation.lat,
                lng: window.ProfilePage.selectedLocation.lng
            };
        }

        const cafeLat = this.cafeLocation?.lat || -6.917500;
        const cafeLng = this.cafeLocation?.lng || 107.609800;
        let custLat = this.customerLocation?.lat || -6.904000;
        let custLng = this.customerLocation?.lng || 107.618000;

        if (Math.abs(custLat - cafeLat) < 0.0001 && Math.abs(custLng - cafeLng) < 0.0001) {
            custLat = -6.904000;
            custLng = 107.618000;
            this.customerLocation = { lat: custLat, lng: custLng };
        }

        try {
            this.map = L.map(mapContainer, {
                zoomControl: true,
                scrollWheelZoom: true,
                fadeAnimation: true
            }).setView([cafeLat, cafeLng], 14);

            const osmTile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap contributors | Ruang Rasa Braga'
            });

            const cartoTile = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                subdomains: 'abcd',
                maxZoom: 20,
                attribution: '© CARTO | © OpenStreetMap | Ruang Rasa'
            });

            cartoTile.addTo(this.map);
            osmTile.addTo(this.map);

            // Marker Kedai Braga
            const cafeIcon = L.divIcon({
                className: 'custom-map-pin cafe-pin',
                html: `
                    <div style="background: #2c2420; color: #fff; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.38); border: 2.5px solid #b87d4b;">
                        <span class="material-symbols-rounded" style="font-size: 22px; color: #e8c39e;">local_cafe</span>
                    </div>
                `,
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });

            this.cafeMarker = L.marker([cafeLat, cafeLng], { icon: cafeIcon }).addTo(this.map)
                .bindPopup("<b><span class='material-symbols-rounded' style='font-size:14px; vertical-align:middle;'>local_cafe</span> Ruang Rasa Braga Flagship</b><br>Jl. Braga No. 45, Bandung<br><small style='color:#b87d4b; font-weight:700;'>Titik Awal Pengiriman Kopi</small>");

            // Marker Alamat Pelanggan
            const customerIcon = L.divIcon({
                className: 'custom-map-pin customer-pin',
                html: `
                    <div style="background: #3b7a57; color: #fff; width: 42px; height: 42px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0,0,0,0.3); border: 2.5px solid #ffffff;">
                        <span class="material-symbols-rounded" style="font-size: 22px;">home</span>
                    </div>
                `,
                iconSize: [42, 42],
                iconAnchor: [21, 21]
            });

            const customerAddrText = currentOrder?.DeliveryAddress || 'Alamat Tujuan Pelanggan';
            this.customerMarker = L.marker([custLat, custLng], { icon: customerIcon }).addTo(this.map)
                .bindPopup(`<b><span class='material-symbols-rounded' style='font-size:14px; vertical-align:middle;'>home</span> Tujuan Pengantaran</b><br>${customerAddrText}`);

            // Buat rute jalan & segmen lalu lintas
            this.generateRealisticTrafficRoute();
            this.drawTrafficRoute();

            // Cek status pesanan saat ini
            const st = currentOrder?.OrderStatus || 'Cooking';
            const savedState = this.loadTrackingState();
            const isOrderDelivered = (st === 'Delivered' || st === 'Completed') || (savedState && savedState.isDeliveredState);
            const isOrderBeingDelivered = (st === 'Delivering' || st === 'OnDelivery') && !isOrderDelivered;

            let initialLat = cafeLat;
            let initialLng = cafeLng;

            if (isOrderDelivered) {
                this.isDeliveredState = true;
                this.isSimRunning = false;
                this.currentStepIndex = Math.max(0, this.densePath.length - 1);
                initialLat = custLat;
                initialLng = custLng;
                this.driverLocation = { lat: custLat, lng: custLng };
                this.currentSpeedKmH = 0;
                this.currentStreetName = 'Alamat Tujuan Pelanggan (Telah Sampai)';
                this.currentTrafficCondition = 'smooth';
            } else if (isOrderBeingDelivered) {
                // Pulihkan posisi kurir yang sedang dalam perjalanan
                if (savedState && savedState.driverLocation && savedState.stepIndex !== undefined && savedState.stepIndex > 0) {
                    this.currentStepIndex = Math.min(savedState.stepIndex, this.densePath.length - 1);
                    if (this.densePath[this.currentStepIndex]) {
                        initialLat = this.densePath[this.currentStepIndex].lat;
                        initialLng = this.densePath[this.currentStepIndex].lng;
                        this.currentTrafficCondition = this.densePath[this.currentStepIndex].condition;
                        this.currentStreetName = this.densePath[this.currentStepIndex].street;
                        this.currentSpeedKmH = this.densePath[this.currentStepIndex].speedKmH;
                    }
                } else {
                    this.currentStepIndex = 0;
                    this.currentSpeedKmH = 40;
                }
            } else {
                // STATUS MASIH DI DAPUR / COOKING / READY -> DRIVER DIAM DI KEDAI BRAGA
                this.currentStepIndex = 0;
                this.isSimRunning = false;
                this.isDeliveredState = false;
                initialLat = cafeLat;
                initialLng = cafeLng;
                this.currentSpeedKmH = 0;
                this.currentStreetName = 'Jl. Braga No. 45 (Kedai Ruang Rasa)';
                this.currentTrafficCondition = 'smooth';
            }

            // Update Marker Driver Motor
            this.updateDriverMarker(initialLat, initialLng);

            // Invalidate size berkala
            [30, 100, 250, 600, 1200].forEach(delay => {
                setTimeout(() => {
                    if (this.map) {
                        this.map.invalidateSize();
                        this.fitMapToBounds();
                    }
                }, delay);
            });

            this.fetchRealRoadRoute().then(() => {
                if (this.map) {
                    this.drawTrafficRoute();
                    this.fitMapToBounds();
                    if (this.isDeliveredState) {
                        this.updateDriverMarker(custLat, custLng);
                    }
                }
            }).catch(() => {});

            // JALANKAN PERGERAKAN HANYA JIKA STATUS SUDAH "Delivering" / "OnDelivery" DAN BELUM SAMPAI
            if (isOrderBeingDelivered && this.currentStepIndex < this.densePath.length - 1) {
                this.startSimulation();
            } else if (isOrderDelivered) {
                this.handleOrderArrival(false);
            }

        } catch (err) {
            console.error('TrackingPage initMap error:', err);
        }
    },

    generateRealisticTrafficRoute() {
        const start = [this.cafeLocation.lat, this.cafeLocation.lng]; // Jl. Braga
        const end = [this.customerLocation.lat, this.customerLocation.lng];

        const latDelta = end[0] - start[0];
        const lngDelta = end[1] - start[1];

        const p1 = [start[0] + latDelta * 0.25, start[1] + lngDelta * 0.10];
        const p2 = [start[0] + latDelta * 0.50, start[1] + lngDelta * 0.40];
        const p3 = [start[0] + latDelta * 0.75, start[1] + lngDelta * 0.75];

        this.trafficSegments = [
            {
                name: 'Segmen 1: Jl. Braga - Perintis Kemerdekaan',
                street: 'Jl. Braga',
                condition: 'smooth',
                color: '#10b981',
                speedKmH: 45,
                stepDelay: 1000,
                instruction: 'Mulai dari Ruang Rasa Flagship Braga, lurus terus ke arah utara',
                points: [start, p1]
            },
            {
                name: 'Segmen 2: Koridor Jl. Wastukencana / Merdeka',
                street: 'Jl. Wastukencana',
                condition: 'moderate',
                color: '#f59e0b',
                speedKmH: 22,
                stepDelay: 2500,
                instruction: 'Belok kanan melintasi koridor Jl. Wastukencana (Lalu lintas agak ramai)',
                points: [p1, p2]
            },
            {
                name: 'Segmen 3: Persimpangan Jam Sibuk / Pasar Baru',
                street: 'Simpang Jam Sibuk Bandung',
                condition: 'congested',
                color: '#ef4444',
                speedKmH: 9,
                stepDelay: 4000,
                instruction: 'Hati-hati: Antrean kendaraan padat merayap di persimpangan jalan',
                points: [p2, p3]
            },
            {
                name: 'Segmen 4: Menuju Alamat Penerima',
                street: 'Jl. Dekat Alamat Penerima',
                condition: 'smooth',
                color: '#10b981',
                speedKmH: 38,
                stepDelay: 1000,
                instruction: 'Jalanan kembali lancar, mendekati alamat tujuan pelanggan',
                points: [p3, end]
            }
        ];

        this.roadCoordinates = [start, p1, p2, p3, end];
        this.buildDensePath();
    },

    buildDensePath() {
        this.densePath = [];

        this.trafficSegments.forEach((seg) => {
            const pStart = seg.points[0];
            const pEnd = seg.points[1];
            const stepsPerSegment = 12;

            for (let i = 0; i < stepsPerSegment; i++) {
                const fraction = i / stepsPerSegment;
                const lat = pStart[0] + (pEnd[0] - pStart[0]) * fraction;
                const lng = pStart[1] + (pEnd[1] - pStart[1]) * fraction;
                this.densePath.push({
                    lat,
                    lng,
                    condition: seg.condition,
                    color: seg.color,
                    street: seg.street,
                    speedKmH: seg.speedKmH,
                    stepDelay: seg.stepDelay,
                    segmentName: seg.name,
                    instruction: seg.instruction
                });
            }
        });

        const lastSeg = this.trafficSegments[this.trafficSegments.length - 1];
        const lastPoint = lastSeg.points[lastSeg.points.length - 1];
        this.densePath.push({
            lat: lastPoint[0],
            lng: lastPoint[1],
            condition: lastSeg.condition,
            color: lastSeg.color,
            street: 'Alamat Pelanggan',
            speedKmH: 0,
            stepDelay: 1000,
            segmentName: 'Tiba di Lokasi',
            instruction: 'Tiba di alamat pengantaran pelanggan.'
        });
    },

    async fetchRealRoadRoute() {
        const startLng = this.cafeLocation.lng;
        const startLat = this.cafeLocation.lat;
        const endLng = this.customerLocation.lng;
        const endLat = this.customerLocation.lat;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            const data = await res.json();

            if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                if (coords.length >= 4) {
                    this.roadCoordinates = coords;
                    const quarter = Math.floor(coords.length / 4);
                    this.trafficSegments[0].points = coords.slice(0, quarter + 1);
                    this.trafficSegments[1].points = coords.slice(quarter, quarter * 2 + 1);
                    this.trafficSegments[2].points = coords.slice(quarter * 2, quarter * 3 + 1);
                    this.trafficSegments[3].points = coords.slice(quarter * 3);
                    this.buildDensePath();
                }
            }
        } catch {}
    },

    drawTrafficRoute() {
        if (!this.map || !this.trafficSegments || this.trafficSegments.length === 0) return;

        this.routeBorderLines.forEach(l => {
            try { this.map.removeLayer(l); } catch {}
        });
        this.routeSegmentPolylines.forEach(l => {
            try { this.map.removeLayer(l); } catch {}
        });
        this.routeBorderLines = [];
        this.routeSegmentPolylines = [];

        this.trafficSegments.forEach((seg) => {
            if (!seg.points || seg.points.length < 2) return;

            const borderLine = L.polyline(seg.points, {
                color: '#1f1917',
                weight: 9,
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(this.map);
            this.routeBorderLines.push(borderLine);

            const trafficLine = L.polyline(seg.points, {
                color: seg.color,
                weight: 6,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(this.map);

            const statusLabel = seg.condition === 'smooth' ? '🟢 Jalur Lancar' : (seg.condition === 'moderate' ? '🟡 Lalu Lintas Agak Padat' : '🔴 Jalur Macet / Merayap');
            trafficLine.bindTooltip(`<b>${seg.street}</b><br>${statusLabel} (~${seg.speedKmH} km/h)`, {
                sticky: true,
                className: 'traffic-tooltip'
            });

            this.routeSegmentPolylines.push(trafficLine);
        });
    },

    fitMapToBounds() {
        if (!this.map || !this.roadCoordinates || this.roadCoordinates.length === 0) return;
        try {
            const bounds = L.latLngBounds(this.roadCoordinates);
            if (bounds && bounds.isValid && bounds.isValid()) {
                this.map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
            }
        } catch (e) {
            console.warn('fitMapToBounds warn:', e);
        }
    },

    // =========================================================================
    // AKSI DRIVER: TERIMA PESANAN & MULAI PENGANTARAN (BARU MULAI JALAN)
    // =========================================================================
    async startDeliveryOrder() {
        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];
        if (!currentOrder) return;

        // Bug 6 Fix: Gunakan user ID driver yang login, bukan hardcode 1
        const user = Api.getCurrentUser();
        const driverUserId = user ? (user.userId || user.UserId || user.id || 1) : 1;

        Toast.info('Mengonfirmasi penjemputan pesanan di bar resto...');

        try {
            if (currentOrder.OrderId) {
                await Api.put(`/orders/${currentOrder.OrderId}/status`, {
                    NewStatus: 'Delivering',
                    StaffUserId: driverUserId
                });
            }
        } catch (err) {
            console.warn('Update order status to Delivering warn:', err);
        }

        currentOrder.OrderStatus = 'Delivering';
        this.currentStepIndex = 0;
        this.isDeliveredState = false;

        Toast.success('🏍️ Pesanan kopi telah diambil oleh kurir! Mulai meluncur ke alamat pelanggan...');

        this.render();
        setTimeout(() => {
            this.initMap();
            this.startSimulation();
        }, 100);
    },

    updateDriverMarker(lat, lng) {
        this.driverLocation = { lat, lng };

        let pinColor = '#10b981'; // Hijau
        let speedClass = 'traffic-smooth';
        if (this.currentTrafficCondition === 'moderate') {
            pinColor = '#f59e0b'; // Kuning
            speedClass = 'traffic-moderate';
        } else if (this.currentTrafficCondition === 'congested') {
            pinColor = '#ef4444'; // Merah
            speedClass = 'traffic-congested';
        }

        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];
        const isCooking = currentOrder && (currentOrder.OrderStatus === 'Cooking' || currentOrder.OrderStatus === 'Processing' || currentOrder.OrderStatus === 'PendingPayment');

        if (isCooking) {
            pinColor = '#b87d4b'; // Brown/coffee standby
        }

        const isArrived = this.isDeliveredState || this.currentStepIndex >= this.densePath.length - 1;
        if (isArrived) {
            pinColor = '#2e7d32'; // Arrived deep green
        }

        const driverIcon = L.divIcon({
            className: `custom-map-pin driver-pin ${speedClass}`,
            html: `
                <div style="background: ${pinColor}; color: #ffffff; width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px ${pinColor}88; border: 3px solid #ffffff; transition: background 0.4s ease;">
                    <span class="material-symbols-rounded" style="font-size: 24px;">${isArrived ? 'done_all' : (isCooking ? 'storefront' : 'two_wheeler')}</span>
                </div>
            `,
            iconSize: [46, 46],
            iconAnchor: [23, 23]
        });

        if (!this.driverMarker && this.map) {
            this.driverMarker = L.marker([lat, lng], { icon: driverIcon }).addTo(this.map)
                .bindPopup("<b><span class='material-symbols-rounded' style='font-size:14px; vertical-align:middle;'>two_wheeler</span> Kurir Ruang Rasa Braga</b><br>Sedang menyusuri rute jalan menuju lokasi Anda.");
        } else if (this.driverMarker) {
            this.driverMarker.setIcon(driverIcon);
            this.driverMarker.setLatLng([lat, lng]);
        }

        this.updateTrafficHUD();
        this.saveTrackingState();
    },

    updateTrafficHUD() {
        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];
        const isCooking = currentOrder && (currentOrder.OrderStatus === 'Cooking' || currentOrder.OrderStatus === 'Processing' || currentOrder.OrderStatus === 'PendingPayment');
        const isArrived = this.isDeliveredState || this.currentStepIndex >= this.densePath.length - 1;

        const distKm = isArrived ? 0 : this.calculateDistance(
            this.driverLocation.lat, this.driverLocation.lng,
            this.customerLocation.lat, this.customerLocation.lng
        );

        let remainingSeconds = 0;
        for (let i = this.currentStepIndex; i < this.densePath.length; i++) {
            remainingSeconds += (this.densePath[i].stepDelay || 1000) / 1000;
        }
        const etaMinutes = isArrived ? 0 : (isCooking ? 15 : Math.max(1, Math.ceil(remainingSeconds / 60) + (distKm > 0.5 ? 1 : 0)));

        const hudStreetEl = document.getElementById('tracking-hud-street');
        const hudTrafficEl = document.getElementById('tracking-hud-traffic');
        const hudSpeedEl = document.getElementById('tracking-hud-speed');
        const driverInstrEl = document.getElementById('tracking-driver-instruction');
        const distEl = document.getElementById('tracking-distance-text');
        const etaEl = document.getElementById('tracking-eta-text');
        const etaHeaderEl = document.getElementById('tracking-eta-header');
        const updateEl = document.getElementById('tracking-last-update');
        const progressBarEl = document.getElementById('tracking-progress-bar');

        let progressPercent = isArrived 
            ? 100 
            : (isCooking ? 35 : (this.densePath.length > 0 ? Math.min(99, Math.round((this.currentStepIndex / (this.densePath.length - 1)) * 100)) : 0));

        if (progressBarEl) {
            progressBarEl.style.width = `${progressPercent}%`;
        }

        if (hudStreetEl) {
            if (isArrived) {
                hudStreetEl.textContent = 'Alamat Pelanggan (Telah Tiba)';
            } else if (isCooking) {
                hudStreetEl.textContent = 'Kedai Ruang Rasa Braga (Dapur)';
            } else {
                hudStreetEl.textContent = this.currentStreetName || 'Jl. Braga No. 45';
            }
        }

        if (driverInstrEl) {
            if (isArrived) {
                driverInstrEl.textContent = '🎉 Selamat! Pesanan kopi telah sampai di tangan pelanggan.';
            } else if (isCooking) {
                driverInstrEl.textContent = 'Barista sedang meracik pesanan di bar. Klik "Mulai Pengantaran" saat pesanan siap.';
            } else {
                const currentInstruction = this.densePath[this.currentStepIndex]?.instruction || 'Menuju ke alamat pelanggan';
                driverInstrEl.textContent = currentInstruction;
            }
        }

        if (hudTrafficEl) {
            if (isArrived) {
                hudTrafficEl.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #059669; margin-right: 4px;"></span> 🏁 Telah Tiba di Lokasi`;
                hudTrafficEl.style.color = '#059669';
            } else if (isCooking) {
                hudTrafficEl.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #b87d4b; margin-right: 4px;"></span> 🍽️ Sedang Diracik di Dapur`;
                hudTrafficEl.style.color = '#b87d4b';
            } else if (this.currentTrafficCondition === 'smooth') {
                hudTrafficEl.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #10b981; margin-right: 4px;"></span> 🟢 Rute Lancar (1s/titik)`;
                hudTrafficEl.style.color = '#059669';
            } else if (this.currentTrafficCondition === 'moderate') {
                hudTrafficEl.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #f59e0b; margin-right: 4px;"></span> 🟡 Lalu Lintas Agak Padat (2-3s/titik)`;
                hudTrafficEl.style.color = '#d97706';
            } else {
                hudTrafficEl.innerHTML = `<span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #ef4444; margin-right: 4px;"></span> 🔴 Macet Padat Merayap (3-5s/titik)`;
                hudTrafficEl.style.color = '#dc2626';
            }
        }

        if (hudSpeedEl) {
            if (isArrived) {
                hudSpeedEl.textContent = `0 km/h (Parkir)`;
                hudSpeedEl.style.background = '#ecfdf5';
                hudSpeedEl.style.color = '#059669';
                hudSpeedEl.style.borderColor = '#a7f3d0';
            } else if (isCooking) {
                hudSpeedEl.textContent = `0 km/h (Di Kedai)`;
                hudSpeedEl.style.background = '#fef3c7';
                hudSpeedEl.style.color = '#92400e';
                hudSpeedEl.style.borderColor = '#fde68a';
            } else {
                hudSpeedEl.textContent = `${this.currentSpeedKmH} km/h`;
                hudSpeedEl.style.background = this.currentTrafficCondition === 'smooth' ? '#ecfdf5' : (this.currentTrafficCondition === 'moderate' ? '#fffbeb' : '#fef2f2');
                hudSpeedEl.style.color = this.currentTrafficCondition === 'smooth' ? '#059669' : (this.currentTrafficCondition === 'moderate' ? '#b45309' : '#dc2626');
                hudSpeedEl.style.borderColor = this.currentTrafficCondition === 'smooth' ? '#a7f3d0' : (this.currentTrafficCondition === 'moderate' ? '#fde68a' : '#fecaca');
            }
        }

        if (distEl) distEl.textContent = isArrived ? '0.00 km' : `${distKm.toFixed(2)} km`;
        if (etaEl) etaEl.textContent = isArrived ? 'Telah Tiba' : (isCooking ? '15 - 20 Menit' : `${etaMinutes} Menit`);
        if (etaHeaderEl) etaHeaderEl.textContent = isArrived ? 'Pesanan Telah Tiba' : (isCooking ? '15 - 20 Menit (Sedang Diracik)' : `${etaMinutes} Menit (${progressPercent}% Selesai)`);
        if (updateEl) updateEl.textContent = `Real-Time • ${new Date().toLocaleTimeString('id-ID')}`;
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    // =========================================================================
    // SIMULASI REAL-TIME DENGAN KECEPATAN SESUAI KONDISI LALU LINTAS
    // =========================================================================
    startSimulation() {
        if (this.isSimRunning) return;

        if (this.isDeliveredState || this.currentStepIndex >= this.densePath.length - 1) {
            this.handleOrderArrival(false);
            return;
        }

        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];
        const st = currentOrder?.OrderStatus || 'Cooking';

        if (st === 'Delivered' || st === 'Completed') {
            this.handleOrderArrival(false);
            return;
        }

        // Jika status masih belum diantar (masih di dapur), ubah dulu statusnya ke Delivering
        if (st !== 'Delivering' && st !== 'OnDelivery' && !this.isDeliveredState) {
            const user = Api.getCurrentUser();
            const driverUserId = user ? (user.userId || user.UserId || user.id || 1) : 1;
            currentOrder.OrderStatus = 'Delivering';
            if (currentOrder.OrderId) {
                Api.put(`/orders/${currentOrder.OrderId}/status`, { NewStatus: 'Delivering', StaffUserId: driverUserId }).catch(() => {});
            }
            this.render();
            setTimeout(() => this.initMap(), 80);
            return;
        }

        this.isDeliveredState = false;
        this.isSimRunning = true;
        this.updateControlButtonsState();

        const runNextStep = () => {
            if (!this.isSimRunning) return;

            if (this.currentStepIndex < this.densePath.length - 1) {
                this.currentStepIndex++;
                const curr = this.densePath[this.currentStepIndex];

                this.currentTrafficCondition = curr.condition;
                this.currentStreetName = curr.street;
                this.currentSpeedKmH = curr.speedKmH;

                this.updateDriverMarker(curr.lat, curr.lng);

                const simUser = Api.getCurrentUser();
                const simDriverId = simUser ? (simUser.userId || simUser.UserId || simUser.id || 1) : 1;
                const simDriverName = simUser ? (simUser.fullName || simUser.FullName || 'Kurir Ruang Rasa') : 'Budi Santoso (Kurir Ruang Rasa Braga)';
                Api.post('/tracking/update', {
                    DriverId: simDriverId,
                    DriverName: simDriverName,
                    OrderId: this.activeOrderId,
                    Latitude: curr.lat,
                    Longitude: curr.lng,
                    Speed: curr.speedKmH
                }).catch(() => {});

                const delay = curr.stepDelay || 1000;
                this.simTimeoutId = setTimeout(runNextStep, delay);
            } else {
                // Kurir sampai di titik tujuan -> HENTIKAN PERJALANAN & TETAPKAN TITIK DI TUJUAN
                this.handleOrderArrival(true);
            }
        };

        const initialDelay = this.densePath[this.currentStepIndex]?.stepDelay || 1000;
        this.simTimeoutId = setTimeout(runNextStep, initialDelay);
    },

    stopSimulation() {
        if (this.simTimeoutId) {
            clearTimeout(this.simTimeoutId);
            this.simTimeoutId = null;
        }
        this.isSimRunning = false;
        this.updateControlButtonsState();
        this.saveTrackingState();
    },

    resetSimulation() {
        // Bug 8/10 Fix: Cegah reset jika order sudah Delivered/Completed
        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];
        if (currentOrder) {
            const st = (currentOrder.OrderStatus || '').toLowerCase();
            if (st === 'delivered' || st === 'completed') {
                Toast.warning('Pesanan ini sudah selesai diantar. Tidak dapat di-reset kembali ke status sebelumnya.');
                return;
            }
        }

        this.stopSimulation();
        this.isDeliveredState = false;
        this.ratingSubmitted = false;
        this.currentStepIndex = 0;

        this.driverLocation = { lat: this.cafeLocation.lat, lng: this.cafeLocation.lng };
        this.currentSpeedKmH = 0;
        this.currentStreetName = 'Jl. Braga No. 45 (Kedai)';

        Toast.info('Rute kurir di-reset ke titik awal kedai.');
        this.saveTrackingState();
        this.render();
        setTimeout(() => this.initMap(), 80);
    },

    // =========================================================================
    // KETIKA PESANAN SUDAH SAMPAI DI TUJUAN (LOCK TITIK DI TUJUAN & ARRIVAL STATE)
    // =========================================================================
    handleOrderArrival(showToast = true) {
        if (this.simTimeoutId) {
            clearTimeout(this.simTimeoutId);
            this.simTimeoutId = null;
        }
        this.isSimRunning = false;
        this.isDeliveredState = true;
        this.currentStepIndex = Math.max(0, this.densePath.length - 1);
        this.currentSpeedKmH = 0;
        this.currentTrafficCondition = 'smooth';
        this.currentStreetName = 'Alamat Tujuan Pelanggan (Telah Sampai)';

        const targetLat = this.customerLocation?.lat || (this.densePath[this.currentStepIndex] ? this.densePath[this.currentStepIndex].lat : -6.904000);
        const targetLng = this.customerLocation?.lng || (this.densePath[this.currentStepIndex] ? this.densePath[this.currentStepIndex].lng : 107.618000);

        this.driverLocation = { lat: targetLat, lng: targetLng };
        this.updateDriverMarker(targetLat, targetLng);
        this.updateControlButtonsState();
        this.saveTrackingState();

        const curOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId);
        if (curOrder) {
            curOrder.OrderStatus = 'Delivered';
            if (curOrder.OrderId) {
                const user = Api.getCurrentUser();
                const driverUserId = user ? (user.userId || user.UserId || user.id || 1) : 1;
                Api.put(`/orders/${curOrder.OrderId}/status`, {
                    NewStatus: 'Delivered',
                    StaffUserId: driverUserId
                }).catch(() => {});
            }
        }

        // Simpan titik akhir permanen ke backend
        const arrUser = Api.getCurrentUser();
        const arrDriverId = arrUser ? (arrUser.userId || arrUser.UserId || arrUser.id || 1) : 1;
        const arrDriverName = arrUser ? (arrUser.fullName || arrUser.FullName || 'Kurir Ruang Rasa') : 'Budi Santoso (Kurir Ruang Rasa Braga)';
        Api.post('/tracking/update', {
            DriverId: arrDriverId,
            DriverName: arrDriverName,
            OrderId: this.activeOrderId,
            Latitude: targetLat,
            Longitude: targetLng,
            Speed: 0
        }).catch(() => {});

        this.updateTrafficHUD();

        if (showToast) {
            Toast.success('🎉 Pesanan kopi hangat telah sampai di alamat tujuan pelanggan!');
            setTimeout(() => {
                this.openArrivalModal();
            }, 600);
        }
    },

    openArrivalModal() {
        let modal = document.getElementById('arrival-celebration-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'arrival-celebration-modal';
            document.body.appendChild(modal);
        }

        modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(20, 16, 14, 0.78) !important; backdrop-filter: blur(10px) !important; -webkit-backdrop-filter: blur(10px) !important; display: flex !important; align-items: center !important; justify-content: center !important; z-index: 999999 !important; padding: 1.5rem !important; margin: 0 !important; box-sizing: border-box !important; overflow-y: auto !important;';
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                TrackingPage.closeArrivalModal();
            }
        };

        try {
            document.body.style.overflow = 'hidden';
        } catch {}

        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0];

        modal.innerHTML = `
            <div class="modal-card" style="max-width: 480px; width: 100%; border-radius: 22px; text-align: center; padding: 2.25rem 1.85rem; position: relative; background: #ffffff; box-shadow: 0 25px 60px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(232, 195, 158, 0.6); animation: scaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; margin: auto !important;" onclick="event.stopPropagation()">
                
                <!-- Floating Celebration Badge -->
                <div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #2c2420, #4a3b32); border: 3.5px solid #e8c39e; display: flex; align-items: center; justify-content: center; margin: -10px auto 1.25rem auto; box-shadow: 0 10px 28px rgba(184,125,75,0.45);">
                    <span class="material-symbols-rounded" style="font-size: 42px; color: #e8c39e;">local_cafe</span>
                </div>

                <div style="display: inline-flex; align-items: center; gap: 0.35rem; background: #e8f5e9; color: #2e7d32; font-size: 0.78rem; font-weight: 800; padding: 5px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 0.5rem; border: 1px solid #c8e6c9;">
                    <span class="material-symbols-rounded" style="font-size: 16px;">done_all</span>
                    Pesanan Selesai Diantar
                </div>

                <h3 style="font-size: 1.55rem; font-family: 'Playfair Display', serif; margin: 0.5rem 0 0.35rem 0; color: #2c2420; font-weight: 700;">
                    ${this.isDriverMode ? 'Pengantaran Selesai!' : 'Pesananmu Telah Tiba!'}
                </h3>

                <p style="font-size: 0.9rem; color: #5c5550; margin: 0 0 1.35rem 0; line-height: 1.5;">
                    ${this.isDriverMode 
                        ? `Terima kasih! Pesanan <b>#${currentOrder?.OrderNumber || ''}</b> telah berhasil diserahkan kepada pelanggan.`
                        : `Kurir <b>${currentOrder?.DriverName || 'Budi Santoso'}</b> telah sampai di alamat Anda. Selamat menikmati aroma & cita rasa istimewa Ruang Rasa!`}
                </p>

                ${!this.isDriverMode ? `
                    <!-- Rating & Review Bintang -->
                    <div style="background: #faf7f4; padding: 1.15rem 1rem; border-radius: 14px; border: 1.5px solid #f0e6dc; margin-bottom: 1.5rem; text-align: center;">
                        <div style="font-size: 0.82rem; font-weight: 800; color: #2c2420; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.3px;">
                            Beri Penilaian untuk Barista & Kurir
                        </div>
                        <div style="display: flex; justify-content: center; gap: 0.6rem; font-size: 32px; color: #f59e0b; cursor: pointer; user-select: none;" id="star-rating-box">
                            <span class="material-symbols-rounded" style="font-size: 32px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="TrackingPage.setRating(1)">star</span>
                            <span class="material-symbols-rounded" style="font-size: 32px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="TrackingPage.setRating(2)">star</span>
                            <span class="material-symbols-rounded" style="font-size: 32px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="TrackingPage.setRating(3)">star</span>
                            <span class="material-symbols-rounded" style="font-size: 32px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="TrackingPage.setRating(4)">star</span>
                            <span class="material-symbols-rounded" style="font-size: 32px; transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'" onclick="TrackingPage.setRating(5)">star</span>
                        </div>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem; justify-content: center; margin-top: 0.85rem;">
                            <span class="tag-badge" style="font-size: 0.74rem; font-weight: 700; padding: 4px 10px; background: #ffffff; border: 1px solid #e8c39e; color: #78350f; border-radius: 14px; cursor: pointer;" onclick="this.classList.toggle('active'); this.style.background='var(--primary)'; this.style.color='#fff';">🔥 Kopi Tetap Hangat</span>
                            <span class="tag-badge" style="font-size: 0.74rem; font-weight: 700; padding: 4px 10px; background: #ffffff; border: 1px solid #e8c39e; color: #78350f; border-radius: 14px; cursor: pointer;" onclick="this.classList.toggle('active'); this.style.background='var(--primary)'; this.style.color='#fff';">⚡ Pengantaran Cepat</span>
                            <span class="tag-badge" style="font-size: 0.74rem; font-weight: 700; padding: 4px 10px; background: #ffffff; border: 1px solid #e8c39e; color: #78350f; border-radius: 14px; cursor: pointer;" onclick="this.classList.toggle('active'); this.style.background='var(--primary)'; this.style.color='#fff';">😊 Kurir Ramah</span>
                        </div>
                    </div>
                ` : `
                    <!-- Ringkasan Perjalanan Driver -->
                    <div style="background: #faf7f4; padding: 1.15rem; border-radius: 14px; border: 1.5px solid #f0e6dc; margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: left;">
                        <div>
                            <div style="font-size: 0.72rem; color: #8c827a; font-weight: 700; text-transform: uppercase;">Alamat Pengantaran</div>
                            <div style="font-size: 0.84rem; font-weight: 700; color: #2c2420; margin-top: 2px;">${currentOrder?.DeliveryAddress || 'Bandung'}</div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 0.72rem; color: #8c827a; font-weight: 700; text-transform: uppercase;">Status Komisi Kurir</div>
                            <div style="font-size: 1.05rem; font-weight: 800; color: #16a34a; margin-top: 2px;">+Rp 8.000 (Cair)</div>
                        </div>
                    </div>
                `}

                <div style="display: flex; gap: 0.75rem; justify-content: center;">
                    <button type="button" class="btn btn-primary" style="flex: 1; padding: 0.75rem 1.25rem; font-weight: 800; font-size: 0.92rem; border-radius: 12px; box-shadow: 0 4px 14px rgba(184,125,75,0.35);" onclick="TrackingPage.closeArrivalModal()">
                        ${this.isDriverMode ? 'Selesai & Ke Dashboard' : 'Selesai & Nikmati Kopi'}
                    </button>
                    ${!this.isDriverMode ? `
                        <a href="#/products" class="btn btn-outline" style="padding: 0.75rem 1.25rem; font-weight: 700; font-size: 0.92rem; border-radius: 12px; text-decoration: none; border: 1.5px solid #d4c5b9; color: #2c2420;" onclick="TrackingPage.closeArrivalModal()">
                            Pesan Lagi
                        </a>
                    ` : ''}
                </div>

            </div>
        `;
    },

    setRating(starCount) {
        const box = document.getElementById('star-rating-box');
        if (box) {
            const stars = box.querySelectorAll('.material-symbols-rounded');
            stars.forEach((s, idx) => {
                s.style.color = idx < starCount ? '#f59e0b' : '#d1d5db';
            });
            Toast.success(`Terima kasih atas bintang ${starCount} untuk barista & kurir Ruang Rasa!`);
            this.ratingSubmitted = true;
            this.saveTrackingState();
        }
    },

    closeArrivalModal() {
        const modal = document.getElementById('arrival-celebration-modal');
        if (modal) modal.remove();
        try {
            document.body.style.overflow = '';
        } catch {}
        if (this.isDriverMode) {
            window.location.hash = '#/dashboard';
        }
    },

    startLivePolling() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(async () => {
            if (this.isSimRunning || this.isBroadcasting || this.isDeliveredState) return;
            try {
                const curOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId);
                if (curOrder && (curOrder.OrderStatus === 'Delivered' || curOrder.OrderStatus === 'Completed')) {
                    this.isDeliveredState = true;
                    return;
                }
                const res = await Api.get(`/tracking/latest/${this.activeOrderId}`);
                if (res && res.Data && res.Data.Latitude && res.Data.Longitude) {
                    if (!this.isDeliveredState) {
                        this.updateDriverMarker(res.Data.Latitude, res.Data.Longitude);
                    }
                }
            } catch {}
        }, 5000);
    },

    updateControlButtonsState() {
        const simBtn = document.getElementById('btn-tracking-sim');
        if (simBtn) {
            simBtn.className = `btn ${this.isSimRunning ? 'btn-danger' : 'btn-primary'} btn-sm`;
            simBtn.innerHTML = `
                <span class="material-symbols-rounded" style="font-size: 16px;">${this.isSimRunning ? 'pause' : 'play_arrow'}</span>
                <span>${this.isSimRunning ? 'Jeda Kurir' : 'Lanjutkan Kurir'}</span>
            `;
        }
    },

    startDriverGps() {
        if (!navigator.geolocation) {
            Toast.error('Browser perangkat tidak mendukung Geolocation GPS.');
            return;
        }

        this.stopSimulation();
        this.isBroadcasting = true;
        Toast.info('Mengaktifkan sensor GPS Driver HP...');

        this.watchId = navigator.geolocation.watchPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 25;

                this.currentSpeedKmH = speed;
                this.updateDriverMarker(lat, lng);
                if (this.map) this.map.panTo([lat, lng]);

                try {
                    const gpsUser = Api.getCurrentUser();
                    const gpsDriverId = gpsUser ? (gpsUser.userId || gpsUser.UserId || gpsUser.id || 1) : 1;
                    const gpsDriverName = gpsUser ? (gpsUser.fullName || gpsUser.FullName || 'Kurir Ruang Rasa') : 'Budi Santoso (Kurir Ruang Rasa Braga)';
                    await Api.post('/tracking/update', {
                        DriverId: gpsDriverId,
                        DriverName: gpsDriverName,
                        OrderId: this.activeOrderId,
                        Latitude: lat,
                        Longitude: lng,
                        Speed: speed
                    });
                } catch {}
            },
            (err) => {
                console.warn('Geolocation error:', err);
                Toast.warning('Gagal membaca sensor GPS: ' + err.message);
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    },

    stopDriverGps() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        if (this.isBroadcasting) {
            this.isBroadcasting = false;
            Toast.info('Mode broadcast GPS HP dinonaktifkan.');
        }
    },

    // =========================================================================
    // RENDER STRUKTUR HALAMAN
    // =========================================================================
    render() {
        const root = document.getElementById('page-root');
        if (!root) return;

        const currentOrder = this.activeOrders.find(o => o.OrderNumber === this.activeOrderId) || this.activeOrders[0] || {
            OrderNumber: 'RR-20260916-0007',
            CustomerName: 'Pelanggan Ruang Rasa',
            CustomerPhone: '081234567890',
            DeliveryAddress: 'Jl. Braga No. 45, Sumur Bandung, Kota Bandung',
            OrderStatus: 'Cooking',
            TotalAmount: 58000
        };

        const isArrived = this.isDeliveredState || this.currentStepIndex >= this.densePath.length - 1;
        const orderStatus = isArrived ? 'Delivered' : (currentOrder.OrderStatus || 'Cooking');

        let currentStep = 2;
        let statusTitle = 'Dapur Sedang Menyiapkan Pesananmu';
        let statusDesc = 'Barista Ruang Rasa sedang meracik kopi & pastry dengan presisi.';
        let etaText = '15 - 20 Menit (Sedang Diracik)';
        let statusIcon = 'soup_kitchen';

        if (isArrived) {
            currentStep = 4;
            statusTitle = '🎉 Pesanan Kopi Telah Sampai di Lokasi!';
            statusDesc = 'Kurir telah tiba di alamat pengantaran. Selamat menikmati sajian hangat Ruang Rasa!';
            etaText = 'Telah Sampai di Lokasi';
            statusIcon = 'done_all';
        } else if (orderStatus === 'PendingPayment') {
            currentStep = 1;
            statusTitle = 'Menunggu Pembayaran';
            statusDesc = 'Selesaikan pembayaran agar pesanan segera diracik oleh barista.';
            etaText = '~30 Menit';
            statusIcon = 'payments';
        } else if (orderStatus === 'Confirmed' || orderStatus === 'WaitingConfirmation') {
            currentStep = 1;
            statusTitle = 'Pesanan Dikonfirmasi Resto';
            statusDesc = 'Pesanan telah diterima dan diteruskan ke barista di bar Braga.';
            etaText = '20 - 25 Menit';
            statusIcon = 'receipt_long';
        } else if (orderStatus === 'Cooking' || orderStatus === 'Processing') {
            currentStep = 2;
            statusTitle = 'Dapur Sedang Menyiapkan Pesananmu';
            statusDesc = 'Pesanan Anda sedang disiapkan dan dipacking aman untuk pengantaran.';
            etaText = '15 - 20 Menit';
            statusIcon = 'soup_kitchen';
        } else if (orderStatus === 'Ready' || orderStatus === 'ReadyForDelivery') {
            currentStep = 2;
            statusTitle = 'Pesanan Siap, Menunggu Driver';
            statusDesc = 'Pesanan sudah selesai diracik dan siap diambil oleh kurir.';
            etaText = '10 - 15 Menit';
            statusIcon = 'inventory_2';
        } else if (orderStatus === 'Delivering' || orderStatus === 'OnDelivery') {
            currentStep = 3;
            statusTitle = 'Driver Dalam Perjalanan Mengantar';
            statusDesc = 'Driver sedang menyusuri rute jalan kota Bandung menuju ke alamat Anda.';
            etaText = '5 - 10 Menit';
            statusIcon = 'two_wheeler';
        }

        const isStillInKitchen = (orderStatus === 'Cooking' || orderStatus === 'Processing' || orderStatus === 'PendingPayment' || orderStatus === 'Ready' || orderStatus === 'ReadyForDelivery');

        root.innerHTML = `
            <div class="container" style="padding-top: 1.5rem; padding-bottom: 3rem;">
                
                <!-- 1. Header & Switcher Pesanan & Mode Perspective -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <span class="material-symbols-rounded" style="font-size: 1.6rem; color: var(--primary);">${this.isDriverMode ? 'sports_motorsports' : 'receipt_long'}</span>
                            <h2 style="font-size: 1.5rem; margin: 0; font-family: 'Playfair Display', serif;">
                                ${this.isDriverMode ? 'Kokpit Navigasi Driver Kurir' : 'Rincian Pesanan & Tracking'}
                            </h2>
                        </div>
                        <div style="font-size: 0.84rem; color: var(--text-muted); margin-top: 0.2rem;">
                            No. Pesanan: <b style="color: var(--primary);">#${currentOrder.OrderNumber}</b> • ${currentOrder.OrderDate ? new Date(currentOrder.OrderDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB' : 'Hari Ini'}
                        </div>
                    </div>

                    <!-- Switcher Mode Perspektif (Customer / Driver) -->
                    <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
                        <div style="background: var(--bg-surface); padding: 3px; border-radius: var(--radius-pill); border: 1px solid var(--border-medium); display: flex;">
                            <button type="button" class="btn btn-sm ${!this.isDriverMode ? 'btn-primary' : 'btn-ghost'}" style="font-size: 0.76rem; padding: 0.25rem 0.75rem; border-radius: var(--radius-pill);" onclick="TrackingPage.toggleDriverMode(false)">
                                <span class="material-symbols-rounded" style="font-size: 14px;">person</span> Customer View
                            </button>
                            <button type="button" class="btn btn-sm ${this.isDriverMode ? 'btn-primary' : 'btn-ghost'}" style="font-size: 0.76rem; padding: 0.25rem 0.75rem; border-radius: var(--radius-pill);" onclick="TrackingPage.toggleDriverMode(true)">
                                <span class="material-symbols-rounded" style="font-size: 14px;">two_wheeler</span> Driver View
                            </button>
                        </div>

                        ${this.activeOrders.length > 1 ? `
                            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap; align-items: center;">
                                ${this.activeOrders.map(o => `
                                    <button type="button" class="btn ${o.OrderNumber === currentOrder.OrderNumber ? 'btn-primary' : 'btn-outline'} btn-sm" 
                                            style="font-size: 0.74rem; padding: 0.25rem 0.55rem; border-radius: var(--radius-pill);"
                                            onclick="TrackingPage.activeOrderId='${o.OrderNumber}'; TrackingPage.isDeliveredState=false; TrackingPage.render(); TrackingPage.initMap();">
                                        #${o.OrderNumber.split('-').pop()} (${o.OrderStatus})
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- 2. Status Banner & Stepper Card -->
                <div class="card" style="padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; background: ${isArrived ? 'linear-gradient(135deg, #1b3824 0%, #2b573a 100%)' : 'linear-gradient(135deg, #2c2420 0%, #443730 100%)'}; color: #ffffff; border-radius: var(--radius-md); box-shadow: 0 8px 24px rgba(44,36,32,0.18); transition: background 0.4s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(232, 195, 158, 0.2); color: #e8c39e; padding: 0.2rem 0.6rem; border-radius: 4px; font-size: 0.76rem; font-weight: 700; margin-bottom: 0.4rem;">
                                <span class="material-symbols-rounded" style="font-size: 14px;">${isArrived ? 'check_circle' : 'schedule'}</span>
                                <span id="tracking-eta-header">Estimasi Tiba: ${etaText}</span>
                            </div>
                            <h3 style="margin: 0; font-size: 1.35rem; font-weight: 800; color: #ffffff; display: flex; align-items: center; gap: 0.5rem;">
                                <span class="material-symbols-rounded" style="color: #e8c39e; font-size: 26px;">${statusIcon}</span>
                                ${statusTitle}
                            </h3>
                            <p style="margin: 0.3rem 0 0 0; font-size: 0.88rem; color: rgba(255,255,255,0.85);">
                                ${statusDesc}
                            </p>
                        </div>

                        <div style="background: rgba(255,255,255,0.12); padding: 0.6rem 1rem; border-radius: var(--radius-sm); text-align: right; border: 1px solid rgba(255,255,255,0.18);">
                            <div style="font-size: 0.72rem; color: rgba(255,255,255,0.7); font-weight: 600;">Total Tagihan</div>
                            <div style="font-size: 1.25rem; font-weight: 800; color: #e8c39e;">${App.formatRupiah(currentOrder.TotalAmount || 58000)}</div>
                            <div style="font-size: 0.72rem; color: rgba(255,255,255,0.85);">${currentOrder.PaymentMethod || 'Transfer Virtual Account'}</div>
                        </div>
                    </div>

                    <!-- Horizontal Stepper -->
                    <div style="position: relative; padding: 0.5rem 0.5rem 0 0.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 2;">
                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 1 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 1 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">receipt_long</span>
                                </div>
                                <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 1 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Dipesan</span>
                            </div>

                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 2 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 2 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">soup_kitchen</span>
                                </div>
                                <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 2 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Disiapkan</span>
                            </div>

                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 3 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 3 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">two_wheeler</span>
                                </div>
                                <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 3 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Diantar</span>
                            </div>

                            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; width: 25%;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${currentStep >= 4 ? '#e8c39e' : 'rgba(255,255,255,0.2)'}; color: ${currentStep >= 4 ? '#2c2420' : '#ffffff'}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; margin-bottom: 0.35rem; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">done_all</span>
                                </div>
                                <span style="font-size: 0.74rem; font-weight: 700; color: ${currentStep >= 4 ? '#e8c39e' : 'rgba(255,255,255,0.6)'};">Sampai</span>
                            </div>
                        </div>

                        <div style="position: absolute; top: 23px; left: 12%; right: 12%; height: 3px; background: rgba(255,255,255,0.2); z-index: 1;">
                            <div id="tracking-progress-bar" style="height: 100%; width: ${currentStep === 1 ? '0%' : currentStep === 2 ? '35%' : currentStep === 3 ? '70%' : '100%'}; background: #e8c39e; transition: width 0.4s ease;"></div>
                        </div>
                    </div>
                </div>

                <!-- 3. Grid Utama: Peta Live Leaflet (Kiri) & Driver / Customer Cockpit (Kanan) -->
                <div style="display: grid; grid-template-columns: 1fr 380px; gap: 1.25rem; align-items: start;">
                    
                    <!-- PETA LIVE OSRM REAL ROAD DENGAN TRAFFIC ENGINE -->
                    <div class="card" style="padding: 0; overflow: hidden; position: relative; border-radius: var(--radius-md); box-shadow: 0 6px 20px rgba(0,0,0,0.06); background: #e5e3df; min-height: 520px;">
                        
                        <!-- HUD KONDISI LALU LINTAS REAL-TIME (TOP FLOATING CARD) -->
                        <div style="position: absolute; top: 12px; left: 12px; right: 12px; z-index: 500; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; pointer-events: none;">
                            
                            <!-- Status Jalan & Kemacetan -->
                            <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); padding: 0.55rem 0.9rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto; display: flex; align-items: center; gap: 0.75rem;">
                                <div style="width: 32px; height: 32px; border-radius: 50%; background: #2c2420; color: #e8c39e; display: flex; align-items: center; justify-content: center;">
                                    <span class="material-symbols-rounded" style="font-size: 18px;">${isStillInKitchen ? 'storefront' : (this.isDriverMode ? 'navigation' : 'traffic')}</span>
                                </div>
                                <div>
                                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">
                                        ${isStillInKitchen ? 'Lokasi Penjemputan' : (this.isDriverMode ? 'Instruksi Jalan Kurir' : 'Posisi Jalan Terkini')}
                                    </div>
                                    <div id="tracking-hud-street" style="font-weight: 800; font-size: 0.88rem; color: var(--text-heading);">
                                        ${isStillInKitchen ? 'Kedai Ruang Rasa Braga No. 45' : 'Jl. Braga No. 45'}
                                    </div>
                                </div>
                                <div style="border-left: 1px solid var(--border-subtle); padding-left: 0.75rem;">
                                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Kondisi Pesanan</div>
                                    <div id="tracking-hud-traffic" style="font-weight: 800; font-size: 0.82rem; color: ${isStillInKitchen ? '#b87d4b' : '#059669'}; display: flex; align-items: center;">
                                        ${isStillInKitchen ? '🍽️ Sedang Diracik di Dapur' : '🟢 Rute Lancar (1s/titik)'}
                                    </div>
                                </div>
                            </div>

                            <!-- Speedometer Kurir Pill -->
                            <div style="background: rgba(255,255,255,0.96); backdrop-filter: blur(10px); padding: 0.45rem 0.85rem; border-radius: var(--radius-pill); border: 1px solid var(--border-subtle); box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto; display: flex; align-items: center; gap: 0.4rem;">
                                <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary);">speed</span>
                                <span style="font-size: 0.72rem; font-weight: 700; color: var(--text-muted);">Status Kurir:</span>
                                <span id="tracking-hud-speed" style="font-size: 0.82rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; border: 1px solid ${isStillInKitchen ? '#fde68a' : '#a7f3d0'}; background: ${isStillInKitchen ? '#fef3c7' : '#ecfdf5'}; color: ${isStillInKitchen ? '#92400e' : '#059669'};">
                                    ${isStillInKitchen ? 'Standby di Kedai' : '42 km/h'}
                                </span>
                            </div>
                        </div>

                        <!-- MAP CONTAINER -->
                        <div id="tracking-leaflet-map" style="width: 100%; height: 520px; min-height: 480px; z-index: 1; display: block;"></div>
                        
                        <!-- TRAFFIC LEGEND & RUTE INFO -->
                        <div style="position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 500; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; pointer-events: none;">
                            
                            <!-- Asal - Tujuan -->
                            <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 0.5rem 0.85rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.75rem; box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto;">
                                <div>
                                    <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Asal Resto</div>
                                    <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-heading);">Braga No. 45</div>
                                </div>
                                <span class="material-symbols-rounded" style="color: var(--accent); font-size: 16px;">arrow_forward</span>
                                <div>
                                    <div style="font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Tujuan Pengantaran</div>
                                    <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-heading); max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${currentOrder.DeliveryAddress || 'Alamat Pelanggan'}</div>
                                </div>
                            </div>

                            <!-- Traffic Color Legend -->
                            <div style="background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); padding: 0.45rem 0.75rem; border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); display: flex; align-items: center; gap: 0.6rem; box-shadow: 0 4px 14px rgba(0,0,0,0.12); pointer-events: auto; font-size: 0.74rem; font-weight: 700;">
                                <div style="display: flex; align-items: center; gap: 4px; color: #059669;">
                                    <span style="width: 12px; height: 4px; background: #10b981; border-radius: 2px; display: inline-block;"></span>
                                    <span>Lancar (1s)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; color: #d97706;">
                                    <span style="width: 12px; height: 4px; background: #f59e0b; border-radius: 2px; display: inline-block;"></span>
                                    <span>Padat (2-3s)</span>
                                </div>
                                <div style="display: flex; align-items: center; gap: 4px; color: #dc2626;">
                                    <span style="width: 12px; height: 4px; background: #ef4444; border-radius: 2px; display: inline-block;"></span>
                                    <span>Macet (3-5s)</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    <!-- KOLOM KANAN: Driver Info / Driver Actions Card + Rincian Alamat & Menu -->
                    <div style="display: flex; flex-direction: column; gap: 1.15rem;">
                        
                        ${this.isDriverMode ? `
                            <!-- KARTU KHUSUS PERSPEKTIF DRIVER -->
                            <div class="card" style="padding: 1.25rem; border: 2px solid var(--primary); background: var(--bg-warm);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                                    <span style="font-size: 0.78rem; font-weight: 800; color: var(--primary); text-transform: uppercase;">Kokpit Pengantaran Driver</span>
                                    <span style="font-size: 0.74rem; background: #e8f5e9; color: #2e7d32; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                                        ● Mode Driver
                                    </span>
                                </div>

                                <div style="font-size: 0.82rem; color: var(--text-body); margin-bottom: 1rem; line-height: 1.45;">
                                    <div style="font-weight: 700; color: var(--text-heading); margin-bottom: 4px;" id="tracking-driver-instruction">
                                        ${isArrived ? '🎉 Pesanan telah sampai di lokasi tujuan.' : (isStillInKitchen ? '🍽️ Pesanan sedang disiapkan di dapur resto. Klik tombol di bawah untuk mulai mengantar ke pelanggan.' : 'Lurus terus menyusuri rute menuju lokasi penerima.')}
                                    </div>
                                    <div style="font-size: 0.76rem; color: var(--text-muted);">
                                        Pelanggan: <b>${currentOrder.CustomerName || 'Pelanggan'}</b> (${currentOrder.CustomerPhone || '081234567890'})
                                    </div>
                                </div>

                                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                    ${isStillInKitchen ? `
                                        <button type="button" class="btn btn-primary" style="width: 100%; font-weight: 800; padding: 0.7rem; font-size: 0.9rem;" onclick="TrackingPage.startDeliveryOrder()">
                                            <span class="material-symbols-rounded">two_wheeler</span> Terima & Mulai Antar Pesanan
                                        </button>
                                    ` : (!isArrived ? `
                                        <button type="button" class="btn btn-success" style="width: 100%; font-weight: 800; padding: 0.65rem;" onclick="TrackingPage.handleOrderArrival(true)">
                                            <span class="material-symbols-rounded">done_all</span> Tandai Sudah Sampai di Pelanggan
                                        </button>
                                    ` : `
                                        <button type="button" class="btn btn-primary" style="width: 100%; font-weight: 800; padding: 0.65rem;" onclick="TrackingPage.openArrivalModal()">
                                            <span class="material-symbols-rounded">check_circle</span> Lihat Rincian Pengantaran Berhasil
                                        </button>
                                    `)}

                                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                        <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openChat('${currentOrder.OrderNumber}', { role: 'driver', customerName: '${currentOrder.CustomerName || 'Pelanggan Ruang Rasa'}' })" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700;">
                                            <span class="material-symbols-rounded" style="font-size: 16px; color: #25d366;">chat</span> Chat Pelanggan
                                        </button>
                                        <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openCall('${currentOrder.OrderNumber}', { role: 'driver', customerName: '${currentOrder.CustomerName || 'Pelanggan Ruang Rasa'}' })" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700;">
                                            <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary);">call</span> Telepon
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ` : `
                            <!-- Driver Info Card (Customer View) -->
                            <div class="card" style="padding: 1.25rem; border: 1px solid var(--border-medium);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                                    <span style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">Driver Pengantar</span>
                                    <span style="font-size: 0.74rem; background: ${isStillInKitchen ? '#fef3c7' : '#e8f5e9'}; color: ${isStillInKitchen ? '#92400e' : '#2e7d32'}; font-weight: 700; padding: 2px 8px; border-radius: 4px;">
                                        ${isStillInKitchen ? '● Menunggu Pesanan Siap' : '● Sedang Mengantar'}
                                    </span>
                                </div>

                                <div style="display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem;">
                                    <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--bg-warm); border: 2px solid var(--primary); display: flex; align-items: center; justify-content: center; color: var(--primary);">
                                        <span class="material-symbols-rounded" style="font-size: 28px;">sports_motorsports</span>
                                    </div>
                                    <div>
                                        <div style="font-weight: 800; font-size: 1rem; color: var(--text-heading);">${currentOrder.DriverName || 'Budi Santoso'}</div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.3rem; margin-top: 2px;">
                                            <span>Honda Vario 160 (D 4589 RR)</span>
                                            <span>•</span>
                                            <span style="color: #f59e0b; font-weight: 700;">★ 4.9</span>
                                        </div>
                                    </div>
                                </div>

                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                                    <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openChat('${currentOrder.OrderNumber}', { role: 'customer', driverName: '${currentOrder.DriverName || 'Budi Santoso'}' })" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700;">
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: #25d366;">chat</span>
                                        Chat Driver
                                    </button>
                                    <button type="button" class="btn btn-outline btn-sm" onclick="DriverComm.openCall('${currentOrder.OrderNumber}', { role: 'customer', driverName: '${currentOrder.DriverName || 'Budi Santoso'}' })" style="display: flex; align-items: center; justify-content: center; gap: 0.35rem; font-size: 0.8rem; font-weight: 700;">
                                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--primary);">call</span>
                                        Telepon
                                    </button>
                                </div>
                            </div>
                        `}

                        <!-- Status & Jarak Pengantaran Card -->
                        <div class="card" style="padding: 1.15rem; background: var(--bg-surface); border: 1px solid var(--border-subtle);">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; text-align: center;">
                                <div style="background: var(--bg-warm); padding: 0.6rem; border-radius: var(--radius-sm);">
                                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Jarak Rute</div>
                                    <div id="tracking-distance-text" style="font-size: 1.1rem; font-weight: 800; color: var(--primary);">${isArrived ? '0.00 km' : '1.85 km'}</div>
                                </div>
                                <div style="background: var(--bg-warm); padding: 0.6rem; border-radius: var(--radius-sm);">
                                    <div style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Estimasi Waktu</div>
                                    <div id="tracking-eta-text" style="font-size: 1.1rem; font-weight: 800; color: var(--accent);">${isArrived ? 'Telah Tiba' : (isStillInKitchen ? '15 Menit' : '8 Menit')}</div>
                                </div>
                            </div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px dashed var(--border-subtle);">
                                <span>Status Update:</span>
                                <span id="tracking-last-update" style="font-weight: 600; color: ${isStillInKitchen ? '#b87d4b' : 'var(--success)'};">
                                    ${isArrived ? 'Pesanan Sampai di Lokasi' : (isStillInKitchen ? 'Sedang Diracik di Dapur Braga' : 'Kurir Sedang Berjalan')}
                                </span>
                            </div>
                        </div>

                        <!-- Alamat Pengantaran Card -->
                        <div class="card" style="padding: 1.25rem;">
                            <div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.82rem; font-weight: 700; color: var(--text-heading); margin-bottom: 0.6rem;">
                                <span class="material-symbols-rounded" style="font-size: 18px; color: var(--primary);">location_on</span>
                                Alamat Pengantaran
                            </div>
                            <div style="font-size: 0.85rem; color: var(--text-body); line-height: 1.45; margin-bottom: 0.5rem;">
                                ${currentOrder.DeliveryAddress || 'Jl. Braga No. 45, Bandung'}
                            </div>
                            <div style="font-size: 0.78rem; color: var(--text-muted);">
                                Kontak Penerima: <b>${currentOrder.CustomerPhone || '081234567890'}</b>
                            </div>
                        </div>

                        <!-- Rincian Menu yang Dipesan Card -->
                        <div class="card" style="padding: 1.25rem;">
                            <div style="display: justify; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.5rem;">
                                <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-heading);">Menu Dipesan</span>
                                <span style="font-size: 0.76rem; color: var(--text-muted); float: right;">${(currentOrder.Items || []).length > 0 ? currentOrder.Items.length + ' Item' : 'Rincian'}</span>
                            </div>

                            <div style="max-height: 140px; overflow-y: auto; margin-bottom: 0.75rem; clear: both;">
                                ${(currentOrder.Items || []).length === 0 ? `
                                    <div style="font-size: 0.82rem; color: var(--text-muted); padding: 0.35rem 0;">
                                        Pesanan Kopi & Pastry Ruang Rasa Braga
                                    </div>
                                ` : (currentOrder.Items || []).map(it => `
                                    <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: 0.35rem 0; border-bottom: 1px dashed var(--border-subtle);">
                                        <div>
                                            <b>${it.Quantity}x</b> ${it.MenuName}
                                        </div>
                                        <span style="font-weight: 600;">${App.formatRupiah(it.SubtotalPrice || (it.UnitPrice * it.Quantity))}</span>
                                    </div>
                                `).join('')}
                            </div>

                            <div style="font-size: 0.82rem; display: flex; flex-direction: column; gap: 0.3rem; border-top: 1px solid var(--border-subtle); padding-top: 0.6rem;">
                                <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                                    <span>Subtotal Menu</span>
                                    <span>${App.formatRupiah(currentOrder.Subtotal || (currentOrder.TotalAmount ? currentOrder.TotalAmount - 14400 : 43600))}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; color: var(--text-muted);">
                                    <span>Ongkir Kurir</span>
                                    <span>${App.formatRupiah(currentOrder.DeliveryFee || 8000)}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; font-weight: 800; font-size: 0.95rem; color: var(--text-heading); border-top: 1px dashed var(--border-subtle); padding-top: 0.4rem; margin-top: 0.2rem;">
                                    <span>Total Tagihan</span>
                                    <span style="color: var(--accent);">${App.formatRupiah(currentOrder.TotalAmount || 58000)}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>

                <!-- 4. Kontrol Simulasi & Uji Coba Navigasi -->
                <div class="card" style="margin-top: 1.5rem; padding: 1.15rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; background: var(--bg-warm); border: 1.5px dashed var(--primary); border-radius: var(--radius-md);">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center;">
                            <span class="material-symbols-rounded" style="font-size: 22px;">explore</span>
                        </div>
                        <div>
                            <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-heading);">Kontrol Navigasi & Alur Pengantaran</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
                                ${isStillInKitchen ? 'Pesanan masih di tahap persiapan dapur. Kurir standby di kedai sampai driver klik "Mulai Antar".' : 'Kurir sedang dalam perjalanan. Kecepatan menyesuaikan kondisi lalu lintas (🟢 1s, 🟡 2-3s, 🔴 3-5s).'}
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                        ${isStillInKitchen ? `
                            <button type="button" class="btn btn-primary btn-sm" onclick="TrackingPage.startDeliveryOrder()">
                                <span class="material-symbols-rounded">two_wheeler</span>
                                Driver Berangkat (Mulai Antar)
                            </button>
                        ` : `
                            <button type="button" id="btn-tracking-sim" class="btn ${this.isSimRunning ? 'btn-danger' : 'btn-primary'} btn-sm" onclick="${this.isSimRunning ? 'TrackingPage.stopSimulation()' : 'TrackingPage.startSimulation()'}">
                                <span class="material-symbols-rounded">${this.isSimRunning ? 'pause' : 'play_arrow'}</span>
                                ${this.isSimRunning ? 'Jeda Kurir' : 'Lanjutkan Kurir'}
                            </button>
                        `}
                        <button type="button" class="btn btn-outline btn-sm" onclick="TrackingPage.resetSimulation()">
                            <span class="material-symbols-rounded">replay</span>
                            Reset ke Dapur
                        </button>
                        ${isArrived ? `
                            <button type="button" class="btn btn-outline btn-sm" style="color: var(--success); border-color: var(--success);" onclick="TrackingPage.openArrivalModal()">
                                <span class="material-symbols-rounded">celebration</span>
                                Buka Penilaian
                            </button>
                        ` : ''}
                    </div>
                </div>

            </div>
        `;
    }
};

window.TrackingPage = TrackingPage;
