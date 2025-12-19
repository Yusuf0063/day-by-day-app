const admin = require('firebase-admin');

// Servis hesabı dosyasının varlığını kontrol et
let serviceAccount;
try {
    serviceAccount = require('../service-account.json');
} catch (e) {
    console.error('HATA: "service-account.json" dosyası bulunamadı!');
    console.error('Lütfen Firebase Konsolundan yeni bir private key indirin ve ana dizine "service-account.json" adıyla kaydedin.');
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];

if (!email) {
    console.error('KULLANIM: node scripts/set-admin.js <kullanici_email>');
    process.exit(1);
}

const setAdmin = async (email) => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });
        console.log(`✅ BAŞARILI!`);
        console.log(`👤 Kullanıcı: ${email}`);
        console.log(`🔑 Yetki: admin=true`);
        console.log(`⚠️  ÖNEMLİ: Bu değişikliğin aktif olması için kullanıcının uygulamadan ÇIKIŞ YAPIP TEKRAR GİRMESİ gerekir.`);
    } catch (error) {
        console.error('❌ HATA:', error.message);
    }
};

setAdmin(email);
