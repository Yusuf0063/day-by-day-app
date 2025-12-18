/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// ⚠️ ÖNEMLİ: Bu ayarları .env dosyasından veya Firebase Konsolundan alarak doldurun.
// Service Worker'lar process.env'e erişemez.
const firebaseConfig = {
    apiKey: "BURAYA_API_KEY_YAZIN",
    authDomain: "BURAYA_AUTH_DOMAIN_YAZIN",
    projectId: "BURAYA_PROJECT_ID_YAZIN",
    storageBucket: "BURAYA_STORAGE_BUCKET_YAZIN",
    messagingSenderId: "BURAYA_MESSAGING_SENDER_ID_YAZIN",
    appId: "BURAYA_APP_ID_YAZIN"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Arka plan bildirimlerini dinle
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Arka plan bildirimi alındı:', payload);

    const { title, body } = payload.notification || {};

    self.registration.showNotification(title || 'Day by Day', {
        body: body || 'Zamanı geldi!',
        icon: '/icons/icon-192x192.png', // PWA ikonunuz varsa
        badge: '/icons/badge.png' // Küçük ikon
    });
});
