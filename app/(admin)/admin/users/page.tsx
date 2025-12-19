"use client";

export default function UsersPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Kullanıcı Yönetimi
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Sistemdeki kayıtlı kullanıcıları görüntüleyin ve yönetin.
                </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-slate-500">Kullanıcı listesi yakında eklenecek...</p>
            </div>
        </div>
    );
}
