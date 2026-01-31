# إعداد Firebase للمشروع

## الخطوة 1: إنشاء مشروع Firebase

1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. انقر على "Create a new project"
3. أدخل اسم المشروع (مثل: `unilink-app`)
4. اتبع الخطوات المتبقية وانقر "Create project"

## الخطوة 2: الحصول على بيانات الاتصال

1. في Firebase Console، انقر على رمز الترس (Settings) ثم "Project settings"
2. اذهب إلى تبويب "Service accounts"
3. انقر "Generate new private key" وحفظ الملف
4. اذهب إلى تبويب "General" وانسخ معرّف المشروع

## الخطوة 3: تحديث الإعدادات

### تحديث `.firebaserc`
```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### تحديث متغيرات البيئة في `client/src/lib/firebase.ts`
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## الخطوة 4: تفعيل الخدمات المطلوبة

في Firebase Console:

1. **Authentication**
   - اذهب إلى Authentication
   - انقر "Get started"
   - فعّل "Google" و "Email/Password"

2. **Firestore Database**
   - اذهب إلى Firestore Database
   - انقر "Create database"
   - اختر "Start in production mode"
   - اختر المنطقة الجغرافية

3. **Storage** (اختياري)
   - اذهب إلى Storage
   - انقر "Get started"
   - اقبل القواعس الافتراضية

## الخطوة 5: إعداد قواعس Firestore

### قواعس الأمان الأساسية

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // السماح للمستخدمين بقراءة وكتابة بيانات أنفسهم
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // السماح بقراءة الملفات الشخصية العامة
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    // الروابط
    match /links/{linkId} {
      allow read: if true;
      allow write: if request.auth.uid == resource.data.uid;
    }
    
    // التحليلات
    match /analytics/{analyticsId} {
      allow read: if request.auth.uid == resource.data.uid;
      allow write: if request.auth.uid == resource.data.uid;
    }
    
    // التقارير (للأدمن فقط)
    match /reports/{reportId} {
      allow read: if request.auth.uid == resource.data.reviewedBy || 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
      allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // الإشعارات
    match /notifications/{notificationId} {
      allow read, write: if request.auth.uid == resource.data.userId ||
                           get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## الخطوة 6: تثبيت Firebase CLI

```bash
npm install -g firebase-tools
```

## الخطوة 7: تسجيل الدخول

```bash
firebase login
```

## الخطوة 8: بناء ونشر المشروع

```bash
# بناء المشروع
pnpm build

# نشر على Firebase Hosting
firebase deploy
```

أو استخدم السكريبت المُعد:
```bash
./deploy.sh
```

## استكشاف الأخطاء

### خطأ: "Permission denied"
- تأكد من تسجيل الدخول: `firebase login`
- تأكد من معرّف المشروع الصحيح في `.firebaserc`

### خطأ: "Cannot find module 'firebase'"
```bash
pnpm install
```

### خطأ: "Project not found"
- تحقق من معرّف المشروع في Firebase Console
- حدّث `.firebaserc` بالمعرّف الصحيح

## المراجع

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Hosting Guide](https://firebase.google.com/docs/hosting)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/start)
