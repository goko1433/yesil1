document.addEventListener('DOMContentLoaded', () => {
    // ---- DOM ELEMENTLERİ ----
    const views = {
        auth: document.getElementById('auth-view'),
        app: document.getElementById('app-view')
    };
    const modalOverlay = document.getElementById('modal-overlay');
    const modalBoxes = {
        settings: document.getElementById('settings-view'),
        manualTx: document.getElementById('manual-tx-modal'),
        welcome: document.getElementById('welcome-back-modal')
    };

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const registerUsernameInput = document.getElementById('register-username');
    const registerPasswordInput = document.getElementById('register-password');
    const registerBtn = document.getElementById('register-btn');
    const birikimTutarEl = document.getElementById('birikim-tutar');
    const borcTutarEl = document.getElementById('borc-tutar');
    const settingsBtn = document.getElementById('settings-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const saatlikBirikimInput = document.getElementById('saatlik-birikim');
    const guncelBorcInput = document.getElementById('guncel-borc');
    const baslangicTarihiInput = document.getElementById('baslangic-tarihi');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    const welcomeBackMessage = document.getElementById('welcome-back-message');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const manualTxTitle = document.getElementById('manual-tx-title');
    const manualTxAmountInput = document.getElementById('manual-tx-amount');
    const saveManualTxBtn = document.getElementById('save-manual-tx-btn');
    const cancelManualTxBtn = document.getElementById('cancel-manual-tx-btn');
    const manualBtns = document.querySelectorAll('.manual-btn');

    // ---- UYGULAMA DEĞİŞKENLERİ ----
    let currentUser = null;
    let updateInterval = null;
    let currentManualTxType = null;
    let lastValues = { birikim: 0, borc: 0 };

    // ---- YARDIMCI FONKSİYONLAR ----
    const showView = (viewId) => {
        Object.values(views).forEach(view => view.classList.remove('active-view'));
        views[viewId].classList.add('active-view');
    };
    const showModal = (modalId) => {
        Object.values(modalBoxes).forEach(box => box.style.display = 'none');
        if (modalId) {
            modalBoxes[modalId].style.display = 'block';
            modalOverlay.style.display = 'flex';
        } else {
            modalOverlay.style.display = 'none';
        }
    };
    const formatCurrency = (amount) => {
        return amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' });
    };
    const getStorageKey = (key) => `${currentUser}_${key}`;

    const animateValue = (element, start, end) => {
        if (start === end) return;
        element.textContent = formatCurrency(end); // Animasyon yerine direkt güncelleme daha stabil olabilir.
        // İsteğe bağlı olarak daha karmaşık bir animasyon fonksiyonu eklenebilir.
    };

    // ---- TEMEL UYGULAMA MANTIĞI ----
    const startCounter = () => {
        if (updateInterval) clearInterval(updateInterval);
        updateValues(); // Anında bir kez çalıştır
        updateInterval = setInterval(updateValues, 1000);
    };

    const updateValues = () => {
        const settings = JSON.parse(localStorage.getItem(getStorageKey('settings')));
        const state = JSON.parse(localStorage.getItem(getStorageKey('state')));
        if (!settings || !state) { clearInterval(updateInterval); return; }

        const now = Date.now();
        const elapsedMs = now - state.lastUpdate;
        const saniyelikOran = settings.saatlikBirikim / 3600;
        const newBirikim = (elapsedMs / 1000) * saniyelikOran;

        const guncelBirikim = state.guncelBirikim + newBirikim;
        const guncelBorc = state.guncelBorc - newBirikim;

        animateValue(birikimTutarEl, lastValues.birikim, guncelBirikim);
        animateValue(borcTutarEl, lastValues.borc, Math.max(0, guncelBorc));
        
        lastValues = { birikim: guncelBirikim, borc: guncelBorc };

        if (document.hidden === false) {
            birikimTutarEl.classList.add('pulse-green');
            borcTutarEl.classList.add('pulse-red');
            setTimeout(() => {
                birikimTutarEl.classList.remove('pulse-green');
                borcTutarEl.classList.remove('pulse-red');
            }, 1000);
        }

        const newState = { ...state, guncelBirikim, guncelBorc, lastUpdate: now };
        localStorage.setItem(getStorageKey('state'), JSON.stringify(newState));
    };

    const handleOfflineProgress = () => {
        const settings = JSON.parse(localStorage.getItem(getStorageKey('settings')));
        let state = JSON.parse(localStorage.getItem(getStorageKey('state')));
        if (!settings || !state) return;

        const now = Date.now();
        const offlineMs = now - state.lastUpdate;
        if (offlineMs > 5000) {
            const saniyelikOran = settings.saatlikBirikim / 3600;
            const offlineBirikim = (offlineMs / 1000) * saniyelikOran;
            
            state.guncelBirikim += offlineBirikim;
            state.guncelBorc -= offlineBirikim;
            state.lastUpdate = now;
            localStorage.setItem(getStorageKey('state'), JSON.stringify(state));
            
            welcomeBackMessage.textContent = `${Math.floor(offlineMs / 1000)} saniye sonra tekrar hoş geldiniz. Hesaplarınız güncellendi.`;
            showModal('welcome');
        }
    };

    // ---- OLAY DİNLEYİCİLERİ ----
    showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginForm.style.display = 'none'; registerForm.style.display = 'block'; });
    showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerForm.style.display = 'none'; loginForm.style.display = 'block'; });

    registerBtn.addEventListener('click', () => {
        const username = registerUsernameInput.value.trim();
        const password = registerPasswordInput.value.trim();
        if (!username || !password) return alert('Kullanıcı adı ve parola boş olamaz.');
        const users = JSON.parse(localStorage.getItem('app_users')) || {};
        if (users[username]) return alert('Bu kullanıcı adı zaten alınmış.');
        users[username] = { password };
        localStorage.setItem('app_users', JSON.stringify(users));
        alert('Kayıt başarılı!');
        showLoginLink.click();
    });

    loginBtn.addEventListener('click', () => {
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value.trim();
        const users = JSON.parse(localStorage.getItem('app_users')) || {};
        if (users[username] && users[username].password === password) {
            currentUser = username;
            localStorage.setItem('app_last_user', currentUser);
            initAppForUser();
        } else {
            alert('Kullanıcı adı veya parola hatalı.');
        }
    });

    logoutBtn.addEventListener('click', () => {
        clearInterval(updateInterval);
        currentUser = null;
        localStorage.removeItem('app_last_user');
        loginUsernameInput.value = '';
        loginPasswordInput.value = '';
        showView('auth');
    });

    settingsBtn.addEventListener('click', () => showModal('settings'));
    cancelSettingsBtn.addEventListener('click', () => showModal(null));

    saveSettingsBtn.addEventListener('click', () => {
        const saatlikBirikim = parseFloat(saatlikBirikimInput.value);
        const baslangicBorc = parseFloat(guncelBorcInput.value);
        const baslangicTarihi = baslangicTarihiInput.value;
        if (isNaN(saatlikBirikim) || isNaN(baslangicBorc) || !baslangicTarihi) {
            return alert('Lütfen tüm alanları doğru doldurun.');
        }
        const settings = { saatlikBirikim, baslangicBorc };
        localStorage.setItem(getStorageKey('settings'), JSON.stringify(settings));
        const state = {
            guncelBirikim: 0,
            guncelBorc: baslangicBorc,
            lastUpdate: new Date(baslangicTarihi).getTime()
        };
        localStorage.setItem(getStorageKey('state'), JSON.stringify(state));
        showModal(null);
        initAppForUser();
    });

    manualBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentManualTxType = e.currentTarget.dataset.type;
            manualTxTitle.textContent = currentManualTxType === 'birikim' ? 'Manuel Gelir Ekle' : 'Manuel Borç Ödemesi';
            manualTxAmountInput.value = '';
            showModal('manualTx');
            manualTxAmountInput.focus();
        });
    });

    saveManualTxBtn.addEventListener('click', () => {
        const amount = parseFloat(manualTxAmountInput.value);
        if (isNaN(amount) || amount <= 0) return alert('Lütfen geçerli bir pozitif tutar girin.');
        
        let state = JSON.parse(localStorage.getItem(getStorageKey('state')));
        if (!state) return;
        if (currentManualTxType === 'birikim') state.guncelBirikim += amount;
        else if (currentManualTxType === 'borc') state.guncelBorc -= amount;
        localStorage.setItem(getStorageKey('state'), JSON.stringify(state));
        showModal(null);
        updateValues();
    });
    
    cancelManualTxBtn.addEventListener('click', () => showModal(null));
    closeModalBtn.addEventListener('click', () => showModal(null));

    // ---- UYGULAMA BAŞLATMA ----
    const initAppForUser = () => {
        const settings = localStorage.getItem(getStorageKey('settings'));
        if (settings) {
            handleOfflineProgress();
            startCounter();
            showView('app'); // HATAYI DÜZELTEN ANAHTAR ADIM
        } else {
            showModal('settings');
            showView('app'); // Ayar olmasa bile ana arayüzü göster
        }
    };

    const autoLoginAndStart = () => {
        currentUser = localStorage.getItem('app_last_user');
        if (currentUser) {
            initAppForUser();
        } else {
            showView('auth');
        }
    };

    autoLoginAndStart();
});
