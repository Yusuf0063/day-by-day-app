# Day by Day - Gamified Habit Tracker 🚀

![Project Banner](https://img.shields.io/badge/Status-Active-success) ![Next.js](https://img.shields.io/badge/Next.js-16.0-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Firebase](https://img.shields.io/badge/Firebase-Verified-orange)

**Day by Day**, alışkanlık kazanımını eğlenceli ve sürdürülebilir hale getiren, oyunlaştırma (gamification) tabanlı modern bir alışkanlık takip uygulamasıdır. Kullanıcılar günlük görevlerini tamamlayarak XP kazanır, seviye atlar, rozetler toplar ve sanal marketten ödüller satın alabilirler.

🔗 **Canlı Demo:** [https://day-by-day-seven.vercel.app](https://day-by-day-seven.vercel.app)
📄 **Proje Sunumu:** [https://day-by-day-seven.vercel.app/presentation](https://day-by-day-seven.vercel.app/presentation)

---

## 🌟 Öne Çıkan Özellikler

### 🎮 Oyunlaştırma (Gamification)
- **XP ve Seviye Sistemi:** Her tamamlanan alışkanlık size puan kazandırır ve seviye atlamanızı sağlar.
- **Seri (Streak) Takibi:** Zinciri kırmadan devam ederek ekstra ödüller kazanın.
- **Rozetler ve Başarımlar:** Belirli hedeflere ulaşarak profilinizde sergileyebileceğiniz özel rozetler kazanın.
- **Sanal Market:** Kazandığınız altınlarla profil çerçevenizi ve temasını özelleştirin.

### 📱 Teknik Özellikler
- **PWA (Progressive Web App):** Uygulamayı telefonunuza yükleyebilir ve internet yokken bile (offline) kullanmaya devam edebilirsiniz.
- **Offline-First:** Bağlantı koptuğunda verileriniz yerel olarak saklanır (IndexedDB) ve internet geldiğinde otomatik senkronize edilir.
- **Bildirimler (FCM):** Alışkanlıklarınızı unutmamanız için akıllı hatırlatıcılar.
- **Responsive Tasarım:** Mobil, tablet ve masaüstü cihazlarda kusursuz deneyim.
- **Karanlık Mod (Dark Mode):** Göz yormayan şık tasarım.

## 🛠️ Teknolojik Altyapı

Bu proje, modern web teknolojilerinin en güncel sürümleri kullanılarak geliştirilmiştir:

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router & Server Components)
- **Dil:** [TypeScript](https://www.typescriptlang.org/) (Tam tip güvenliği)
- **Stil:** [Tailwind CSS](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/) (Animasyonlar)
- **Backend & Veritabanı:** [Firebase](https://firebase.google.com/) (Auth, Firestore)
- **İkon Seti:** [Lucide React](https://lucide.dev/)
- **Yerel Depolama:** IndexedDB & LocalStorage

## 🚀 Kurulum ve Çalıştırma

Projeyi kendi bilgisayarınızda çalıştırmak için adımları takip edin:

1. **Repo'yu Klonlayın:**
   ```bash
   git clone https://github.com/Yusuf0063/day-by-day-app.git
   cd day-by-day-app
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Çevresel Değişkenleri (.env.local) Ayarlayın:**
   Firebase proje ayarlarınızı içeren `.env.local` dosyasını ana dizinde oluşturun:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Geliştirme Sunucusunu Başlatın:**
   ```bash
   npm run dev
   ```
   Tarayıcınızda `http://localhost:3000` adresine gidin.

## 🤝 Katkıda Bulunma

1. Bu projeyi Forklayın.
2. Yeni bir feature branch oluşturun (`git checkout -b feature/YeniOzellik`).
3. Değişikliklerinizi commit edin (`git commit -m 'Yeni özellik eklendi'`).
4. Branch'inizi Pushlayın (`git push origin feature/YeniOzellik`).
5. Bir Pull Request oluşturun.

## 📄 Lisans

Bu proje [MIT License](LICENSE) altında lisanslanmıştır.

---
*Üniversite Dönem Projesi kapsamında geliştirilmiştir.*
