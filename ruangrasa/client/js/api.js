// ==========================================================================
// API CLIENT WRAPPER (Fetch dengan JWT Bearer & Global Error Handling)
// ==========================================================================

const API_BASE = '/api/ruangrasa';

const Api = {
    getToken() {
        return localStorage.getItem('rr_token');
    },

    setSession(userToken) {
        localStorage.setItem('rr_token', userToken.Token);
        localStorage.setItem('rr_refresh_token', userToken.RefreshToken);
        localStorage.setItem('rr_user', JSON.stringify({
            userId: userToken.UserId,
            fullName: userToken.FullName,
            email: userToken.Email,
            role: userToken.Role
        }));
    },

    clearSession() {
        localStorage.removeItem('rr_token');
        localStorage.removeItem('rr_refresh_token');
        localStorage.removeItem('rr_user');
    },

    getCurrentUser() {
        const userStr = localStorage.getItem('rr_user');
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    getRefreshToken() {
        return localStorage.getItem('rr_refresh_token');
    },

    // Attempt refresh sesi: POST /auth/refresh dengan rotasi refresh token
    async tryRefreshSession() {
        const refreshToken = this.getRefreshToken();
        if (!refreshToken) return false;
        try {
            const res = await this.request('/auth/refresh', {
                method: 'POST',
                body: JSON.stringify({ RefreshToken: refreshToken }),
                skipAuthRefresh: true
            });
            const payload = res && (res.Data || res.data);
            if (payload && payload.Token) {
                this.setSession(payload);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    },

    isAuthenticated() {
        return !!this.getToken() && !!this.getCurrentUser();
    },

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = {
            'Accept': 'application/json',
            ...(options.headers || {})
        };

        // Otomatis pasang Content-Type jika body bukan FormData
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        // Pasang JWT Bearer Token jika tersedia
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            // Global Error Handling (Poin 7 & 11 PDF)
            if (response.status === 401) {
                // Coba perpanjang sesi via refresh token (sekali saja per endpoint)
                if (!options.__isRetry && this.getRefreshToken() && !endpoint.includes('/auth/')) {
                    const refreshed = await this.tryRefreshSession();
                    if (refreshed) {
                        return this.request(endpoint, { ...options, __isRetry: true });
                    }
                }
                this.clearSession();
                if (window.Router) {
                    Router.navigate('#/401');
                } else {
                    window.location.hash = '#/401';
                }
                throw new Error('Sesi Anda telah berakhir. Silakan login kembali.');
            }

            if (response.status === 403) {
                if (window.Router) {
                    Router.navigate('#/403');
                } else {
                    window.location.hash = '#/403';
                }
                throw new Error('Anda tidak memiliki hak akses ke resource ini.');
            }

            if (response.status === 404) {
                throw new Error('Data atau endpoint yang diminta tidak ditemukan (404).');
            }

            const contentType = response.headers.get('content-type');
            let data = null;
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                let errorMsg = (data && (data.message || data.Message)) || `HTTP Error ${response.status}`;

                // 422: validasi server-side per-field (errors = { Field: [msg, ...] })
                if (response.status === 422 && data && data.errors) {
                    const errs = [];
                    for (const key in data.errors) {
                        if (Array.isArray(data.errors[key])) errs.push(...data.errors[key]);
                        else if (typeof data.errors[key] === 'string') errs.push(data.errors[key]);
                    }
                    if (errs.length > 0) errorMsg = errs.join(', ');
                }

                // Kompatibilitas modelState lama (WebAPI default)
                if (data && (data.modelState || data.ModelState)) {
                    const ms = data.modelState || data.ModelState;
                    const errors = [];
                    for (const key in ms) {
                        if (Array.isArray(ms[key])) {
                            errors.push(...ms[key]);
                        } else if (typeof ms[key] === 'string') {
                            errors.push(ms[key]);
                        }
                    }
                    if (errors.length > 0) {
                        errorMsg = errors.join(', ');
                    }
                }

                // 500: fallback API gagal → arahkan ke halaman error 500
                if (response.status >= 500) {
                    if (window.Router) {
                        Router.navigate('#/500');
                    } else {
                        window.location.hash = '#/500';
                    }
                }

                throw new Error(errorMsg);
            }

            return data;
        } catch (err) {
            console.error(`API Error [${endpoint}]:`, err);
            throw err;
        }
    },

    // Shortcuts
    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: body instanceof FormData ? body : JSON.stringify(body)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    },

    async upload(file) {
        const formData = (file instanceof FormData) ? file : new FormData();
        if (file instanceof File) {
            formData.append('file', file);
        }
        return this.request('/upload', {
            method: 'POST',
            body: formData
        });
    }
};
