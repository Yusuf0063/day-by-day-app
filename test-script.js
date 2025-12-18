/**
 * DAY BY DAY - OTOMATİK TEST SCRİPTİ
 * 
 * Kullanım:
 * 1. Tarayıcıda giriş yapın
 * 2. Ana sayfaya gidin (http://localhost:3000)
 * 3. F12 ile Console'u açın
 * 4. Bu scripti kopyalayıp yapıştırın
 * 5. Enter'a basın
 */

console.log('🎮 DAY BY DAY - Test Başlıyor...\n');

// Test sonuçları
const results = {
    passed: [],
    failed: [],
    warnings: []
};

function logTest(name, passed, message) {
    const emoji = passed ? '✅' : '❌';
    const result = `${emoji} ${name}: ${message}`;
    console.log(result);

    if (passed) {
        results.passed.push(name);
    } else {
        results.failed.push({ name, message });
    }
}

function logWarning(message) {
    console.warn(`⚠️ ${message}`);
    results.warnings.push(message);
}

// 1. DOM Elementlerini Kontrol Et
console.log('\n📋 1. UI ELEMENTLERI KONTROLÜ\n');

const marketBtn = document.querySelector('[class*="market"]') ||
    Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Market'));
logTest('Market Butonu', !!marketBtn, marketBtn ? 'Bulundu' : 'Bulunamadı');

const xpBar = document.querySelector('[class*="progress"]') ||
    document.querySelector('[style*="width"]');
logTest('XP Bar', !!xpBar, xpBar ? 'Bulundu' : 'Bulunamadı (Beklenen)');

const levelText = Array.from(document.querySelectorAll('*')).find(el =>
    el.textContent.includes('Seviye') && el.textContent.match(/\d+/)
);
logTest('Seviye Göstergesi', !!levelText, levelText ? `Bulundu: ${levelText.textContent}` : 'Bulunamadı');

const devButtons = Array.from(document.querySelectorAll('button')).filter(btn =>
    btn.textContent.includes('DEV') ||
    btn.textContent.includes('DB Durumu') ||
    btn.textContent.includes('Seviye Sıfırla')
);
logTest('Geliştirici Butonları', devButtons.length >= 3, `${devButtons.length} adet bulundu`);

// 2. LocalStorage Kontrolü
console.log('\n💾 2. LOCALSTORAGE KONTROLÜ\n');

const hasLocalData = !!localStorage.length;
logTest('LocalStorage Verisi', hasLocalData, `${localStorage.length} anahtar bulundu`);

// 3. Firebase Bağlantısı (window objesi kontrolü)
console.log('\n🔥 3. FIREBASE KONTROLÜ\n');

const hasFirebase = typeof window.firebase !== 'undefined' ||
    document.querySelector('[src*="firebase"]');
logTest('Firebase Yüklenmiş', hasFirebase, hasFirebase ? 'Yüklü' : 'Yüklenmemiş olabilir');

// 4. CSS Animasyonları
console.log('\n🎨 4. CSS KONTROLÜ\n');

const hasPurpleTheme = Array.from(document.querySelectorAll('*'))
    .some(el => getComputedStyle(el).color.includes('128, 90, 213')); // purple-600
logTest('Tema Renkleri', hasPurpleTheme, hasPurpleTheme ? 'Purple renk şeması aktif' : 'Varsayılan');

// 5. Responsive Kontrol
console.log('\n📱 5. RESPONSİVE KONTROL\n');

const isMobile = window.innerWidth < 768;
const hasMaxWidth = Array.from(document.querySelectorAll('*'))
    .some(el => getComputedStyle(el).maxWidth === '448px'); // max-w-md
logTest('Mobile Layout', isMobile ? hasMaxWidth : true,
    isMobile ? 'Mobile görünüm aktif' : 'Desktop görünüm');

// 6. Test Butonu Simülasyonu (Sadece kontrol)
console.log('\n🧪 6. TEST KONTROLLERI\n');

if (devButtons.length > 0) {
    console.log('✨ Geliştirici butonları bulundu, test edilebilir:');
    devButtons.forEach((btn, i) => {
        console.log(`   ${i + 1}. ${btn.textContent.trim()}`);
    });

    logWarning('Bu butonlara manuel tıklayarak test edin!');
} else {
    logWarning('Geliştirici butonları bulunamadı. Ana sayfada mısınız?');
}

// 7. Konsol Hataları Kontrolü
console.log('\n🐛 7. HATA KONTROLÜ\n');

const originalError = console.error;
const errors = [];
console.error = function (...args) {
    errors.push(args.join(' '));
    originalError.apply(console, args);
};

setTimeout(() => {
    logTest('Console Hataları', errors.length === 0,
        errors.length === 0 ? 'Hata yok' : `${errors.length} hata bulundu`);

    // 8. Özet Rapor
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST ÖZET RAPORU');
    console.log('='.repeat(50));
    console.log(`✅ Başarılı: ${results.passed.length}`);
    console.log(`❌ Başarısız: ${results.failed.length}`);
    console.log(`⚠️  Uyarılar: ${results.warnings.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Başarısız Testler:');
        results.failed.forEach(f => console.log(`   - ${f.name}: ${f.message}`));
    }

    if (results.warnings.length > 0) {
        console.log('\n⚠️  Uyarılar:');
        results.warnings.forEach(w => console.log(`   - ${w}`));
    }

    const successRate = (results.passed.length / (results.passed.length + results.failed.length) * 100).toFixed(1);
    console.log(`\n📈 Başarı Oranı: ${successRate}%`);

    if (successRate >= 80) {
        console.log('\n🎉 MÜKEMMEL! Tüm sistemler çalışıyor!');
    } else if (successRate >= 60) {
        console.log('\n👍 İYİ! Bazı hatalar var ama genel olarak çalışıyor.');
    } else {
        console.log('\n⚠️  DİKKAT! Ciddi sorunlar var, kontrol edin!');
    }

    console.log('\n' + '='.repeat(50));

}, 1000);

console.log('\n⏳ Test tamamlanıyor...\n');
