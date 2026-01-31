# Firebase Hosting Deployment Guide

هذا الدليل يشرح كيفية نشر تطبيق UniLink على Firebase Hosting.

## المتطلبات

1. **Firebase CLI**: قم بتثبيت Firebase Command Line Interface
   ```bash
   npm install -g firebase-tools
   ```

2. **حساب Firebase**: تأكد من وجود حساب Google وإنشاء مشروع على [Firebase Console](https://console.firebase.google.com)

3. **المشروع مُعد**: تأكد من وجود ملفات `firebase.json` و `.firebaserc` (موجودة بالفعل)

## خطوات الـ Deploy

### 1. تسجيل الدخول إلى Firebase
```bash
firebase login
```
سيفتح متصفح للتحقق من حسابك على Google.

### 2. بناء المشروع
```bash
pnpm build
```
هذا سينشئ مجلد `dist` يحتوي على الملفات الجاهزة للنشر.

### 3. نشر على Firebase Hosting
```bash
firebase deploy
```

أو إذا كنت تريد نشر جزء معين فقط:
```bash
firebase deploy --only hosting
```

### 4. التحقق من النشر
بعد انتهاء النشر، ستحصل على URL مثل:
```
https://your-project-id.web.app
```

## تكوين المشروع

### تحديث معرّف المشروع
إذا كان لديك معرّف مشروع Firebase مختلف، قم بتحديث `.firebaserc`:

```json
{
  "projects": {
    "default": "your-firebase-project-id"
  }
}
```

### متغيرات البيئة
تأكد من أن جميع متغيرات البيئة المطلوبة موجودة:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## استكشاف الأخطاء

### خطأ: "Cannot find module 'firebase'"
```bash
pnpm install
```

### خطأ: "Project not found"
تأكد من تحديث معرّف المشروع في `.firebaserc`

### خطأ: "Permission denied"
تأكد من تسجيل الدخول:
```bash
firebase logout
firebase login
```

## نصائح مفيدة

1. **معاينة محلية قبل النشر**:
   ```bash
   firebase serve
   ```

2. **عرض السجلات**:
   ```bash
   firebase hosting:channel:list
   ```

3. **حذف نسخة قديمة**:
   ```bash
   firebase hosting:channel:delete channel-name
   ```

## الدعم

للمزيد من المعلومات، زر [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
