#!/bin/bash

# UniLink Firebase Deployment Script
# هذا السكريبت يساعد في نشر التطبيق على Firebase Hosting

set -e

echo "🚀 بدء نشر UniLink على Firebase Hosting..."
echo ""

# التحقق من وجود firebase.json
if [ ! -f "firebase.json" ]; then
    echo "❌ خطأ: لم يتم العثور على firebase.json"
    exit 1
fi

# التحقق من وجود .firebaserc
if [ ! -f ".firebaserc" ]; then
    echo "❌ خطأ: لم يتم العثور على .firebaserc"
    exit 1
fi

# بناء المشروع
echo "📦 جاري بناء المشروع..."
pnpm build

if [ ! -d "dist" ]; then
    echo "❌ خطأ: فشل بناء المشروع"
    exit 1
fi

echo "✅ تم بناء المشروع بنجاح"
echo ""

# التحقق من firebase-tools
if ! command -v firebase &> /dev/null; then
    echo "⚠️  Firebase CLI غير مثبت. جاري التثبيت..."
    npm install -g firebase-tools
fi

echo "🔐 جاري التحقق من تسجيل الدخول..."
firebase projects:list > /dev/null 2>&1 || {
    echo "📝 يرجى تسجيل الدخول إلى Firebase..."
    firebase login
}

echo ""
echo "🌐 جاري نشر التطبيق..."
firebase deploy --only hosting

echo ""
echo "✅ تم النشر بنجاح!"
echo "🎉 يمكنك الآن الوصول إلى تطبيقك على:"
firebase hosting:sites:list

echo ""
echo "💡 نصيحة: استخدم 'firebase serve' لمعاينة التطبيق محلياً"
