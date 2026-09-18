// ==========================================================================
// DRIVER & CUSTOMER REAL-TIME COMMUNICATION SUITE (Chat & VoIP Call)
// Supports: Live Two-Way Chat, Cross-Tab Broadcast, Audio Chimes,
// Realistic VoIP Call Simulation with Voice Synthesizer & Web Audio API
// ==========================================================================

const DriverComm = {
    activeOrderNumber: null,
    activeRole: 'customer', // 'customer' or 'driver'
    driverName: 'Budi Santoso (Kurir Dedicated Ruang Rasa)',
    driverPhone: '0812-3456-7890',
    customerName: 'Pelanggan Ruang Rasa',
    customerPhone: '0813-9876-5432',
    channel: null,
    callInterval: null,
    callDuration: 0,
    isMuted: false,
    isSpeaker: true,
    audioCtx: null,

    init() {
        if ('BroadcastChannel' in window && !this.channel) {
            this.channel = new BroadcastChannel('ruangrasa_driver_comm');
            this.channel.onmessage = (e) => {
                const data = e.data;
                if (!data) return;
                if (data.type === 'NEW_MESSAGE' && data.orderNumber === this.activeOrderNumber) {
                    this.appendIncomingMessage(data.message);
                } else if (data.type === 'CALL_STATUS' && data.orderNumber === this.activeOrderNumber) {
                    this.handleRemoteCallStatus(data.status);
                }
            };
        }
    },

    getAudioContext() {
        if (!this.audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioCtx = new AudioContext();
            }
        }
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        return this.audioCtx;
    },

    playChime(type = 'message') {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            if (type === 'message') {
                // Dual-tone polite notification chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880.00, now + 0.1); // A5
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'ring') {
                // Telephone ring tone
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                osc.start(now);
                osc.stop(now + 0.8);
            } else if (type === 'end') {
                // Call end tone
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.setValueAtTime(280, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            }
        } catch (e) {
            // Audio context fallback safe
        }
    },

    // =========================================================================
    // 1. LIVE IN-APP CHAT (Customer <-> Driver)
    // =========================================================================
    openChat(orderNumber = 'RR-20260916-0007', options = {}) {
        this.init();
        this.activeOrderNumber = orderNumber;
        const user = Api.getCurrentUser();
        const role = (options.role || (user && user.role) || 'customer').toLowerCase();
        this.activeRole = role === 'driver' ? 'driver' : 'customer';

        if (options.driverName) this.driverName = options.driverName;
        if (options.customerName) this.customerName = options.customerName;

        let modal = document.getElementById('driver-comm-chat-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'driver-comm-chat-modal';
            document.body.appendChild(modal);
        }

        const chatPartnerTitle = this.activeRole === 'customer' ? this.driverName : (this.customerName || 'Pelanggan');
        const chatPartnerSub = this.activeRole === 'customer' 
            ? 'Kurir Motor Ruang Rasa • Honda Vario 160 (D 4589 RR)' 
            : `Penerima Pesanan #${this.activeOrderNumber}`;

        modal.innerHTML = `
            <div class="modal-backdrop active" onclick="DriverComm.closeChat()" style="display:flex; align-items:flex-end; justify-content:center; padding: 0 0.5rem 0.5rem 0.5rem; z-index: 10000;">
                <div class="comm-chat-card" onclick="event.stopPropagation()">
                    <!-- Header Chat -->
                    <div class="comm-chat-header">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="comm-avatar-wrap">
                                <div class="comm-avatar-circle">
                                    <span class="material-symbols-rounded">${this.activeRole === 'customer' ? 'two_wheeler' : 'person'}</span>
                                </div>
                                <span class="comm-status-dot" title="Online"></span>
                            </div>
                            <div>
                                <div class="comm-partner-name">${chatPartnerTitle}</div>
                                <div class="comm-partner-sub">${chatPartnerSub}</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <button type="button" class="comm-action-btn" onclick="DriverComm.openCall('${orderNumber}', { role: '${this.activeRole}' })" title="Panggil Suara (VoIP)">
                                <span class="material-symbols-rounded" style="color: #10b981;">call</span>
                            </button>
                            <button type="button" class="comm-action-btn" onclick="DriverComm.closeChat()" title="Tutup Chat">
                                <span class="material-symbols-rounded">close</span>
                            </button>
                        </div>
                    </div>

                    <!-- Order Banner Reference -->
                    <div class="comm-order-banner">
                        <span class="material-symbols-rounded" style="font-size: 16px; color: var(--accent);">receipt_long</span>
                        <span>Pesanan Aktif: <strong>#${orderNumber}</strong></span>
                        <span style="color: var(--accent); font-weight: 700; margin-left: auto;">Live Connected</span>
                    </div>

                    <!-- Chat Body & Messages -->
                    <div class="comm-chat-body" id="comm-messages-container">
                        <!-- Loaded dynamically -->
                    </div>

                    <!-- Typing Indicator -->
                    <div class="comm-typing-indicator" id="comm-typing-indicator" style="display: none;">
                        <span class="comm-typing-dots"><span></span><span></span><span></span></span>
                        <span id="comm-typing-text">${this.activeRole === 'customer' ? 'Budi Santoso' : 'Pelanggan'} sedang mengetik...</span>
                    </div>

                    <!-- Quick Suggestions Chips -->
                    <div class="comm-chips-bar">
                        ${this.activeRole === 'customer' ? `
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Pesanan tolong ditaruh di teras ya mas')">🚪 Taruh di teras</button>
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Patokan rumah pagar hitam sebelah warung')">📍 Info patokan rumah</button>
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Sudah sampai mana ya mas?')">🛵 Sudah sampai mana?</button>
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Uang pas sudah siap ya mas')">💵 Uang pas siap</button>
                        ` : `
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Saya sudah sampai di depan lokasi ya kak')">📍 Sudah di depan lokasi</button>
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Sedang menunggu lampu merah, estimasi 3 menit')">⏱️ Estimasi 3 menit lagi</button>
                            <button type="button" class="comm-chip-btn" onclick="DriverComm.sendQuick('Baik kak, pesanan kopi aman di tas pemanas')">☕ Kopi aman di thermal bag</button>
                        `}
                    </div>

                    <!-- Footer Input -->
                    <form class="comm-chat-input-form" onsubmit="DriverComm.handleSend(event)">
                        <input type="text" id="comm-chat-input" class="comm-input-field" placeholder="Ketik pesan untuk ${this.activeRole === 'customer' ? 'driver' : 'pelanggan'}..." autocomplete="off" />
                        <button type="submit" class="comm-send-btn" title="Kirim Pesan">
                            <span class="material-symbols-rounded">send</span>
                        </button>
                    </form>
                </div>
            </div>
        `;

        this.loadChatHistory();
        setTimeout(() => {
            const input = document.getElementById('comm-chat-input');
            if (input) input.focus();
        }, 150);
    },

    closeChat() {
        const modal = document.getElementById('driver-comm-chat-modal');
        if (modal) modal.remove();
    },

    getStorageKey() {
        return `ruangrasa_chat_${this.activeOrderNumber}`;
    },

    loadChatHistory() {
        const key = this.getStorageKey();
        let messages = [];
        try {
            const raw = localStorage.getItem(key);
            if (raw) {
                messages = JSON.parse(raw);
            }
        } catch (e) {
            messages = [];
        }

        if (messages.length === 0) {
            // Default initial message from driver
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            messages = [
                {
                    id: 'msg-init-1',
                    sender: 'driver',
                    senderName: 'Budi Santoso',
                    text: 'Halo kak! Pesanan kopi Ruang Rasa sudah saya ambil dari barista. Saya segera meluncur ke lokasi kakak ya!',
                    time: nowTime,
                    status: 'read'
                }
            ];
            this.saveMessages(messages);
        }

        this.renderMessagesList(messages);
    },

    renderMessagesList(messages) {
        const container = document.getElementById('comm-messages-container');
        if (!container) return;

        container.innerHTML = messages.map(msg => {
            const isMe = msg.sender === this.activeRole;
            return `
                <div class="comm-message-row ${isMe ? 'me' : 'partner'}">
                    <div class="comm-message-bubble ${isMe ? 'bubble-me' : 'bubble-partner'}">
                        ${!isMe ? `<div class="comm-sender-tag">${msg.senderName || (msg.sender === 'driver' ? 'Driver' : 'Pelanggan')}</div>` : ''}
                        <div class="comm-message-text">${this.escapeHtml(msg.text)}</div>
                        <div class="comm-message-time">
                            ${msg.time}
                            ${isMe ? '<span class="material-symbols-rounded" style="font-size: 13px; color: #60a5fa; margin-left: 2px;">done_all</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.scrollTop = container.scrollHeight;
    },

    saveMessages(messages) {
        try {
            localStorage.setItem(this.getStorageKey(), JSON.stringify(messages));
        } catch (e) {}
    },

    handleSend(e) {
        e.preventDefault();
        const input = document.getElementById('comm-chat-input');
        if (!input) return;
        const text = input.value.trim();
        if (!text) return;
        input.value = '';
        this.sendMessage(text);
    },

    sendQuick(text) {
        this.sendMessage(text);
    },

    sendMessage(text) {
        const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        const newMessage = {
            id: 'msg-' + Date.now(),
            sender: this.activeRole,
            senderName: this.activeRole === 'customer' ? (this.customerName || 'Pelanggan') : 'Budi Santoso',
            text: text,
            time: nowTime,
            status: 'sent'
        };

        const key = this.getStorageKey();
        let messages = [];
        try {
            messages = JSON.parse(localStorage.getItem(key) || '[]');
        } catch (e) {
            messages = [];
        }
        messages.push(newMessage);
        this.saveMessages(messages);
        this.renderMessagesList(messages);
        this.playChime('message');

        // Broadcast to other tabs (Driver <-> Customer)
        if (this.channel) {
            this.channel.postMessage({
                type: 'NEW_MESSAGE',
                orderNumber: this.activeOrderNumber,
                message: newMessage
            });
        }

        // Auto-reply bot simulation when testing as single user
        if (this.activeRole === 'customer') {
            this.triggerDriverAutoReply(text);
        } else if (this.activeRole === 'driver') {
            this.triggerCustomerAutoReply(text);
        }
    },

    appendIncomingMessage(message) {
        const container = document.getElementById('comm-messages-container');
        if (!container) return;
        this.loadChatHistory();
        this.playChime('message');
    },

    triggerDriverAutoReply(customerText) {
        const typingEl = document.getElementById('comm-typing-indicator');
        if (typingEl) typingEl.style.display = 'flex';

        setTimeout(() => {
            if (typingEl) typingEl.style.display = 'none';

            let replyText = 'Baik kak, terima kasih informasinya! Pesanan segera saya antarkan dengan aman.';
            const lower = customerText.toLowerCase();
            if (lower.includes('teras') || lower.includes('pagar') || lower.includes('titip')) {
                replyText = 'Siap kak, nanti saya letakkan di teras dan saya fotokan ya.';
            } else if (lower.includes('sampai mana') || lower.includes('posisi') || lower.includes('dimana')) {
                replyText = 'Posisi saya saat ini sedang di Jl. Braga menuju lokasi kakak, estimasi sekitar 3-4 menit sampai ya!';
            } else if (lower.includes('uang') || lower.includes('kembalian') || lower.includes('bayar')) {
                replyText = 'Baik kak, kembalian uang pas sudah saya siapkan.';
            } else if (lower.includes('terima kasih') || lower.includes('makasih')) {
                replyText = 'Sama-sama kak! Selamat menikmati seduhan kopi Ruang Rasa :)';
            }

            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const driverMsg = {
                id: 'msg-' + Date.now(),
                sender: 'driver',
                senderName: 'Budi Santoso',
                text: replyText,
                time: nowTime,
                status: 'read'
            };

            const key = this.getStorageKey();
            let messages = [];
            try {
                messages = JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) {
                messages = [];
            }
            messages.push(driverMsg);
            this.saveMessages(messages);
            this.renderMessagesList(messages);
            this.playChime('message');
        }, 1600);
    },

    triggerCustomerAutoReply(driverText) {
        const typingEl = document.getElementById('comm-typing-indicator');
        if (typingEl) {
            const typingText = document.getElementById('comm-typing-text');
            if (typingText) typingText.textContent = 'Pelanggan sedang mengetik...';
            typingEl.style.display = 'flex';
        }

        setTimeout(() => {
            if (typingEl) typingEl.style.display = 'none';
            const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const custMsg = {
                id: 'msg-' + Date.now(),
                sender: 'customer',
                senderName: 'Pelanggan',
                text: 'Baik mas Budi, terima kasih ya! Saya tunggu di depan.',
                time: nowTime,
                status: 'read'
            };
            const key = this.getStorageKey();
            let messages = [];
            try {
                messages = JSON.parse(localStorage.getItem(key) || '[]');
            } catch (e) {
                messages = [];
            }
            messages.push(custMsg);
            this.saveMessages(messages);
            this.renderMessagesList(messages);
            this.playChime('message');
        }, 1800);
    },

    // =========================================================================
    // 2. REAL-TIME VoIP AUDIO CALL SIMULATION
    // =========================================================================
    openCall(orderNumber = 'RR-20260916-0007', options = {}) {
        this.init();
        this.activeOrderNumber = orderNumber;
        const user = Api.getCurrentUser();
        const role = (options.role || (user && user.role) || 'customer').toLowerCase();
        this.activeRole = role === 'driver' ? 'driver' : 'customer';
        this.callDuration = 0;
        this.isMuted = false;
        this.isSpeaker = true;

        if (this.callInterval) clearInterval(this.callInterval);

        let modal = document.getElementById('driver-comm-call-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'driver-comm-call-modal';
            document.body.appendChild(modal);
        }

        const calleeTitle = this.activeRole === 'customer' ? 'Budi Santoso' : (this.customerName || 'Pelanggan Ruang Rasa');
        const calleeRoleTag = this.activeRole === 'customer' ? 'Driver Dedicated Ruang Rasa' : `Pemesan #${this.activeOrderNumber}`;

        modal.innerHTML = `
            <div class="modal-backdrop active" style="display:flex; align-items:center; justify-content:center; background: rgba(18, 12, 8, 0.88); backdrop-filter: blur(28px); z-index: 10001; padding: 1.5rem;">
                <div class="comm-call-screen" onclick="event.stopPropagation()">
                    
                    <!-- Call Header Info -->
                    <div style="text-align: center; margin-bottom: 2rem;">
                        <div class="comm-call-badge">
                            <span class="material-symbols-rounded" style="font-size: 14px; color: #10b981;">lock</span>
                            Enkripsi Suara VoIP End-to-End
                        </div>
                        <h2 class="comm-call-name">${calleeTitle}</h2>
                        <p class="comm-call-sub">${calleeRoleTag}</p>
                        <div class="comm-call-status" id="comm-call-status-label">Menghubungi...</div>
                    </div>

                    <!-- Pulsing Avatar Center -->
                    <div class="comm-call-avatar-container">
                        <div class="comm-call-ripple ripple-1"></div>
                        <div class="comm-call-ripple ripple-2"></div>
                        <div class="comm-call-avatar-circle">
                            <span class="material-symbols-rounded" style="font-size: 54px; color: #ffffff;">
                                ${this.activeRole === 'customer' ? 'two_wheeler' : 'person'}
                            </span>
                        </div>
                    </div>

                    <!-- Live Audio Waveform Animation -->
                    <div class="comm-waveform-wrap" id="comm-waveform-bars" style="opacity: 0;">
                        <span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>

                    <!-- Call Actions Toolbar -->
                    <div class="comm-call-toolbar">
                        <button type="button" class="comm-tool-btn" id="comm-btn-mute" onclick="DriverComm.toggleMute()" title="Mute Mikrofon">
                            <span class="material-symbols-rounded">mic</span>
                            <span>Mute</span>
                        </button>
                        <button type="button" class="comm-tool-btn active" id="comm-btn-speaker" onclick="DriverComm.toggleSpeaker()" title="Speakerphone">
                            <span class="material-symbols-rounded">volume_up</span>
                            <span>Speaker</span>
                        </button>
                        <button type="button" class="comm-tool-btn" onclick="DriverComm.switchToChatFromCall()" title="Buka Chat">
                            <span class="material-symbols-rounded">chat</span>
                            <span>Pesan</span>
                        </button>
                        <button type="button" class="comm-call-end-btn" onclick="DriverComm.endCall()" title="Akhiri Panggilan">
                            <span class="material-symbols-rounded" style="font-size: 32px;">call_end</span>
                        </button>
                    </div>

                </div>
            </div>
        `;

        this.startCallingSequence();
    },

    startCallingSequence() {
        this.playChime('ring');

        // Ring for 2 seconds, then connect automatically
        setTimeout(() => {
            const statusEl = document.getElementById('comm-call-status-label');
            const waveEl = document.getElementById('comm-waveform-bars');
            if (statusEl) {
                statusEl.textContent = '00:00';
                statusEl.style.color = '#34d399';
                statusEl.style.fontWeight = '700';
            }
            if (waveEl) waveEl.style.opacity = '1';

            this.callInterval = setInterval(() => {
                this.callDuration++;
                const mins = String(Math.floor(this.callDuration / 60)).padStart(2, '0');
                const secs = String(this.callDuration % 60).padStart(2, '0');
                if (statusEl) statusEl.textContent = `${mins}:${secs}`;
            }, 1000);

            // Synthesize realistic voice response
            this.speakVoiceResponse();
        }, 2200);
    },

    speakVoiceResponse() {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();

        const message = this.activeRole === 'customer'
            ? 'Halo kak! Ini Budi kurir Ruang Rasa. Pesanan kopi dan makanan kakak aman di tas pemanas. Saya sudah dekat lokasi kakak ya!'
            : 'Halo mas Budi! Iya mas, saya tunggu di depan teras ya.';

        const utter = new SpeechSynthesisUtterance(message);
        utter.lang = 'id-ID';
        utter.rate = 1.0;
        utter.pitch = this.activeRole === 'customer' ? 0.95 : 1.1;

        // Try to pick Indonesian voice if available
        const voices = window.speechSynthesis.getVoices();
        const idVoice = voices.find(v => v.lang.includes('id') || v.name.includes('Indonesia') || v.lang.includes('ID'));
        if (idVoice) utter.voice = idVoice;

        setTimeout(() => {
            if (document.getElementById('driver-comm-call-modal')) {
                window.speechSynthesis.speak(utter);
            }
        }, 1000);
    },

    toggleMute() {
        this.isMuted = !this.isMuted;
        const btn = document.getElementById('comm-btn-mute');
        if (btn) {
            btn.classList.toggle('active', this.isMuted);
            const icon = btn.querySelector('.material-symbols-rounded');
            const label = btn.querySelector('span:last-child');
            if (icon) icon.textContent = this.isMuted ? 'mic_off' : 'mic';
            if (label) label.textContent = this.isMuted ? 'Unmute' : 'Mute';
        }
        Toast.info(this.isMuted ? 'Mikrofon dinonaktifkan (Muted).' : 'Mikrofon aktif.');
    },

    toggleSpeaker() {
        this.isSpeaker = !this.isSpeaker;
        const btn = document.getElementById('comm-btn-speaker');
        if (btn) {
            btn.classList.toggle('active', this.isSpeaker);
        }
        Toast.info(this.isSpeaker ? 'Speakerphone Aktif.' : 'Earpiece Mode Aktif.');
    },

    switchToChatFromCall() {
        const orderNum = this.activeOrderNumber;
        const role = this.activeRole;
        this.endCall(false);
        this.openChat(orderNum, { role });
    },

    endCall(showToast = true) {
        if (this.callInterval) {
            clearInterval(this.callInterval);
            this.callInterval = null;
        }
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        this.playChime('end');

        const modal = document.getElementById('driver-comm-call-modal');
        if (modal) modal.remove();

        if (showToast && this.callDuration > 0) {
            const mins = Math.floor(this.callDuration / 60);
            const secs = this.callDuration % 60;
            Toast.success(`Panggilan suara selesai (${mins > 0 ? `${mins}m ` : ''}${secs}d).`);
        }
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

window.DriverComm = DriverComm;
