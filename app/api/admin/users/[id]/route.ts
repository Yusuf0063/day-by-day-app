import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // 1. Yetki Kontrolü: İsteği yapan kişi Admin mi?
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        if (!decodedToken.admin) {
            return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
        }

        // 2. Silinecek Kullanıcı ID'sini al
        const { id: targetUserId } = await params;

        if (!targetUserId) {
            return NextResponse.json({ error: "User ID missing" }, { status: 400 });
        }

        // 3. Kullanıcıyı Authentication'dan sil (Giriş yapamaz hale gelir)
        await adminAuth.deleteUser(targetUserId);

        // 4. Kullanıcı verisini Firestore'dan sil (Opsiyonel: İsterseniz 'deleted' diye işaretleyebilirsiniz)
        // Firestore'da 'users/{userId}' dökümanını ve alt koleksiyonlarını silmek gerekir.
        // Firebase Admin tek komutla recursive delete yapmaz, ama ana dökümanı silebiliriz.
        await adminDb.collection("users").doc(targetUserId).delete();

        console.log(`Kullanıcı silindi: ${targetUserId} (Silen: ${decodedToken.email})`);

        return NextResponse.json({ success: true, message: "User deleted successfully" });
    } catch (error: any) {
        console.error("Delete User Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
