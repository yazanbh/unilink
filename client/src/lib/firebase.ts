import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  increment,
  serverTimestamp,
  writeBatch,
  limit,
  Timestamp,
  getCountFromServer,
  type DocumentData,
} from "firebase/firestore";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABXnp58MQEsv53kwYwQsAC57lchYXKVtI",
  authDomain: "unilink-b8936.firebaseapp.com",
  projectId: "unilink-b8936",
  storageBucket: "unilink-b8936.firebasestorage.app",
  messagingSenderId: "542901151486",
  appId: "1:542901151486:web:ddb207345a9b8037f927af",
  measurementId: "G-B6ZDMFTJK0",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();

// Auth functions
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);

// User types
export interface UserProfile {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  photoURL: string;
  themeId?: string;
  theme: string;
  lang: "ar" | "en";
  role: "user" | "admin" | "superadmin";
  status: "active" | "suspended";
  plan: "free" | "pro" | "business";
  permissions?: AdminPermissions;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastLoginAt?: Date | Timestamp;
  email?: string;
}

export interface AdminPermissions {
  canManageUsers: boolean;
  canManageContent: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canManageReports: boolean;
  canSendNotifications: boolean;
}

// Re-export SmartLinkConditions from SmartLinkSettings
import type { SmartLinkConditions } from "@/components/SmartLinkSettings";
export type { SmartLinkConditions };

export interface Link {
  id: string;
  uid: string;
  title: string;
  url: string;
  icon: string;
  enabled: boolean;
  order: number;
  clicks: number;
  smartConditions?: SmartLinkConditions;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface Analytics {
  uid: string;
  views: number;
  clicks: Record<string, number>;
  updatedAt: Date | Timestamp;
}

// Report types
export interface Report {
  id: string;
  linkId: string;
  linkUrl: string;
  linkTitle: string;
  reportedUserId: string;
  reportedUsername: string;
  reporterUserId: string;
  reporterUsername: string;
  reason: "spam" | "inappropriate" | "malware" | "phishing" | "other";
  description: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewedBy?: string;
  reviewedAt?: Date | Timestamp;
  resolution?: string;
  createdAt: Date | Timestamp;
}

// Notification types
export interface AdminNotification {
  id: string;
  type: "new_user" | "new_report" | "user_suspended" | "system" | "content_flagged";
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date | Timestamp;
}

// Activity Log types
export interface ActivityLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  targetType: "user" | "link" | "report" | "settings" | "system";
  targetId?: string;
  details?: string;
  createdAt: Date | Timestamp;
}

// System Settings types
export interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  maxLinksPerUser: number;
  defaultUserPlan: "free" | "pro" | "business";
  emailNotifications: boolean;
  autoModeration: boolean;
  updatedAt: Date | Timestamp;
  updatedBy?: string;
}

// Username validation
export const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const usernameDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
  return !usernameDoc.exists();
};

// User functions
export const createUserProfile = async (
  uid: string,
  email: string,
  username: string,
  displayName: string
): Promise<void> => {
  const batch = writeBatch(db);

  // Create user profile
  const userRef = doc(db, "users", uid);
  batch.set(userRef, {
    uid,
    username: username.toLowerCase(),
    displayName,
    bio: "",
    photoURL: "",
    theme: "default",
    lang: "en",
    role: "user",
    status: "active",
    plan: "free",
    email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastLoginAt: serverTimestamp(),
  });

  // Reserve username
  const usernameRef = doc(db, "usernames", username.toLowerCase());
  batch.set(usernameRef, { uid });

  // Create analytics document
  const analyticsRef = doc(db, "analytics", uid);
  batch.set(analyticsRef, {
    uid,
    views: 0,
    clicks: {},
    updatedAt: serverTimestamp(),
  });

  await batch.commit();

  // Create notification for admins
  await createAdminNotification({
    type: "new_user",
    title: "New User Registration",
    message: `New user "${username}" has registered.`,
    data: { userId: uid, username, email },
  });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as UserProfile;
};

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  const usernameDoc = await getDoc(doc(db, "usernames", username.toLowerCase()));
  if (!usernameDoc.exists()) return null;
  const { uid } = usernameDoc.data();
  return getUserProfile(uid);
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const updateLastLogin = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    lastLoginAt: serverTimestamp(),
  });
};

// Profile image upload
export const uploadProfileImage = async (uid: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `profileImages/${uid}/${file.name}`);
  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);
  await updateUserProfile(uid, { photoURL: downloadURL });
  return downloadURL;
};

// Link functions
export const getUserLinks = async (uid: string): Promise<Link[]> => {
  const linksQuery = query(
    collection(db, "links"),
    where("uid", "==", uid),
    orderBy("order", "asc")
  );
  const snapshot = await getDocs(linksQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Link));
};

export const createLink = async (
  uid: string,
  title: string,
  url: string,
  icon: string = ""
): Promise<string> => {
  const links = await getUserLinks(uid);
  const newOrder = links.length;
  const linkRef = doc(collection(db, "links"));
  await setDoc(linkRef, {
    uid,
    title,
    url,
    icon,
    enabled: true,
    order: newOrder,
    clicks: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return linkRef.id;
};

export const updateLink = async (linkId: string, data: Partial<Link>): Promise<void> => {
  await updateDoc(doc(db, "links", linkId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteLink = async (linkId: string): Promise<void> => {
  await deleteDoc(doc(db, "links", linkId));
};

export const reorderLinks = async (links: Link[]): Promise<void> => {
  const batch = writeBatch(db);
  links.forEach((link, index) => {
    const linkRef = doc(db, "links", link.id);
    batch.update(linkRef, { order: index, updatedAt: serverTimestamp() });
  });
  await batch.commit();
};

// Analytics functions
export const incrementViews = async (uid: string): Promise<void> => {
  await updateDoc(doc(db, "analytics", uid), {
    views: increment(1),
    updatedAt: serverTimestamp(),
  });
};

export const incrementClicks = async (uid: string, linkId: string): Promise<void> => {
  // Update link clicks
  await updateDoc(doc(db, "links", linkId), {
    clicks: increment(1),
    updatedAt: serverTimestamp(),
  });

  // Update analytics
  await updateDoc(doc(db, "analytics", uid), {
    [`clicks.${linkId}`]: increment(1),
    updatedAt: serverTimestamp(),
  });
};

export const getAnalytics = async (uid: string): Promise<Analytics | null> => {
  const analyticsDoc = await getDoc(doc(db, "analytics", uid));
  if (!analyticsDoc.exists()) return null;
  return analyticsDoc.data() as Analytics;
};

// ==================== ADMIN FUNCTIONS ====================

// Get all users with optional filters
export const getAllUsers = async (filters?: {
  status?: "active" | "suspended";
  role?: "user" | "admin" | "superadmin";
  plan?: "free" | "pro" | "business";
  searchQuery?: string;
}): Promise<UserProfile[]> => {
  let usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(usersQuery);
  let users = snapshot.docs.map((doc) => doc.data() as UserProfile);

  // Apply filters
  if (filters) {
    if (filters.status) {
      users = users.filter((u) => u.status === filters.status);
    }
    if (filters.role) {
      users = users.filter((u) => u.role === filters.role);
    }
    if (filters.plan) {
      users = users.filter((u) => u.plan === filters.plan);
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          u.username?.toLowerCase().includes(query) ||
          u.displayName?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query)
      );
    }
  }

  return users;
};

// Get all links (for admin)
export const getAllLinks = async (): Promise<Link[]> => {
  const linksQuery = query(collection(db, "links"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(linksQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Link));
};

// Get platform statistics
export const getPlatformStats = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalLinks: number;
  totalViews: number;
  totalClicks: number;
  usersByPlan: { free: number; pro: number; business: number };
  recentUsers: UserProfile[];
  pendingReports: number;
}> => {
  // Get users count
  const usersSnapshot = await getDocs(collection(db, "users"));
  const users = usersSnapshot.docs.map((doc) => doc.data() as UserProfile);
  
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;
  const usersByPlan = {
    free: users.filter((u) => u.plan === "free").length,
    pro: users.filter((u) => u.plan === "pro").length,
    business: users.filter((u) => u.plan === "business").length,
  };

  // Get links count
  const linksSnapshot = await getDocs(collection(db, "links"));
  const links = linksSnapshot.docs.map((doc) => doc.data() as Link);
  const totalLinks = links.length;
  const totalClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);

  // Get total views from analytics
  const analyticsSnapshot = await getDocs(collection(db, "analytics"));
  const totalViews = analyticsSnapshot.docs.reduce(
    (sum, doc) => sum + (doc.data().views || 0),
    0
  );

  // Get recent users (last 10)
  const recentUsersQuery = query(
    collection(db, "users"),
    orderBy("createdAt", "desc"),
    limit(10)
  );
  const recentUsersSnapshot = await getDocs(recentUsersQuery);
  const recentUsers = recentUsersSnapshot.docs.map((doc) => doc.data() as UserProfile);

  // Get pending reports count
  const reportsQuery = query(
    collection(db, "reports"),
    where("status", "==", "pending")
  );
  const reportsSnapshot = await getDocs(reportsQuery);
  const pendingReports = reportsSnapshot.docs.length;

  return {
    totalUsers,
    activeUsers,
    suspendedUsers,
    totalLinks,
    totalViews,
    totalClicks,
    usersByPlan,
    recentUsers,
    pendingReports,
  };
};

// User management
export const suspendUser = async (uid: string, adminId?: string): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    status: "suspended",
    updatedAt: serverTimestamp(),
  });

  if (adminId) {
    const user = await getUserProfile(uid);
    await logAdminActivity(adminId, "suspend_user", "user", uid, `Suspended user: ${user?.username}`);
  }
};

export const activateUser = async (uid: string, adminId?: string): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    status: "active",
    updatedAt: serverTimestamp(),
  });

  if (adminId) {
    const user = await getUserProfile(uid);
    await logAdminActivity(adminId, "activate_user", "user", uid, `Activated user: ${user?.username}`);
  }
};

export const deleteUser = async (uid: string, adminId?: string): Promise<void> => {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return;

  const userData = userDoc.data() as UserProfile;
  const batch = writeBatch(db);

  // Delete username reservation
  batch.delete(doc(db, "usernames", userData.username));

  // Delete user profile
  batch.delete(doc(db, "users", uid));

  // Delete analytics
  batch.delete(doc(db, "analytics", uid));

  await batch.commit();

  // Delete all user links
  const links = await getUserLinks(uid);
  for (const link of links) {
    await deleteDoc(doc(db, "links", link.id));
  }

  if (adminId) {
    await logAdminActivity(adminId, "delete_user", "user", uid, `Deleted user: ${userData.username}`);
  }
};

export const setUserRole = async (
  uid: string,
  role: "user" | "admin" | "superadmin",
  adminId?: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    role,
    updatedAt: serverTimestamp(),
  });

  if (adminId) {
    const user = await getUserProfile(uid);
    await logAdminActivity(adminId, "change_role", "user", uid, `Changed role to ${role} for: ${user?.username}`);
  }
};

export const updateUserPlan = async (
  uid: string,
  plan: "free" | "pro" | "business",
  adminId?: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    plan,
    updatedAt: serverTimestamp(),
  });

  if (adminId) {
    const user = await getUserProfile(uid);
    await logAdminActivity(adminId, "change_plan", "user", uid, `Changed plan to ${plan} for: ${user?.username}`);
  }
};

export const updateUserPermissions = async (
  uid: string,
  permissions: AdminPermissions,
  adminId?: string
): Promise<void> => {
  await updateDoc(doc(db, "users", uid), {
    permissions,
    updatedAt: serverTimestamp(),
  });

  if (adminId) {
    const user = await getUserProfile(uid);
    await logAdminActivity(adminId, "update_permissions", "user", uid, `Updated permissions for: ${user?.username}`);
  }
};

// ==================== REPORTS FUNCTIONS ====================

export const createReport = async (
  reportData: Omit<Report, "id" | "status" | "createdAt">
): Promise<string> => {
  const reportRef = doc(collection(db, "reports"));
  await setDoc(reportRef, {
    ...reportData,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  // Create notification for admins
  await createAdminNotification({
    type: "new_report",
    title: "New Content Report",
    message: `Link "${reportData.linkTitle}" has been reported for ${reportData.reason}.`,
    data: { reportId: reportRef.id, linkId: reportData.linkId },
  });

  return reportRef.id;
};

export const getAllReports = async (status?: Report["status"]): Promise<Report[]> => {
  let reportsQuery;
  if (status) {
    reportsQuery = query(
      collection(db, "reports"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
  } else {
    reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  }
  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Report));
};

export const updateReportStatus = async (
  reportId: string,
  status: Report["status"],
  reviewedBy: string,
  resolution?: string
): Promise<void> => {
  await updateDoc(doc(db, "reports", reportId), {
    status,
    reviewedBy,
    reviewedAt: serverTimestamp(),
    resolution: resolution || null,
  });

  await logAdminActivity(reviewedBy, "review_report", "report", reportId, `Updated report status to: ${status}`);
};

export const deleteLinkByAdmin = async (
  linkId: string,
  adminId: string,
  reason?: string
): Promise<void> => {
  const linkDoc = await getDoc(doc(db, "links", linkId));
  if (!linkDoc.exists()) return;

  const linkData = linkDoc.data() as Link;
  await deleteDoc(doc(db, "links", linkId));

  await logAdminActivity(
    adminId,
    "delete_link",
    "link",
    linkId,
    `Deleted link: ${linkData.title} - ${linkData.url}${reason ? ` (Reason: ${reason})` : ""}`
  );
};

// ==================== NOTIFICATIONS FUNCTIONS ====================

export const createAdminNotification = async (
  notification: Omit<AdminNotification, "id" | "read" | "createdAt">
): Promise<string> => {
  const notifRef = doc(collection(db, "adminNotifications"));
  await setDoc(notifRef, {
    ...notification,
    read: false,
    createdAt: serverTimestamp(),
  });
  return notifRef.id;
};

export const getAdminNotifications = async (
  limitCount: number = 50
): Promise<AdminNotification[]> => {
  const notifsQuery = query(
    collection(db, "adminNotifications"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(notifsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as AdminNotification));
};

export const getUnreadNotificationsCount = async (): Promise<number> => {
  const notifsQuery = query(
    collection(db, "adminNotifications"),
    where("read", "==", false)
  );
  const snapshot = await getDocs(notifsQuery);
  return snapshot.docs.length;
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await updateDoc(doc(db, "adminNotifications", notificationId), {
    read: true,
  });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const notifsQuery = query(
    collection(db, "adminNotifications"),
    where("read", "==", false)
  );
  const snapshot = await getDocs(notifsQuery);
  const batch = writeBatch(db);
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });
  await batch.commit();
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
  await deleteDoc(doc(db, "adminNotifications", notificationId));
};

// ==================== ACTIVITY LOG FUNCTIONS ====================

export const logAdminActivity = async (
  adminId: string,
  action: string,
  targetType: ActivityLog["targetType"],
  targetId?: string,
  details?: string
): Promise<void> => {
  const admin = await getUserProfile(adminId);
  const logRef = doc(collection(db, "activityLogs"));
  await setDoc(logRef, {
    adminId,
    adminUsername: admin?.username || "Unknown",
    action,
    targetType,
    targetId: targetId || null,
    details: details || null,
    createdAt: serverTimestamp(),
  });
};

export const getActivityLogs = async (limitCount: number = 100): Promise<ActivityLog[]> => {
  const logsQuery = query(
    collection(db, "activityLogs"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ActivityLog));
};

// ==================== SYSTEM SETTINGS FUNCTIONS ====================

export const getSystemSettings = async (): Promise<SystemSettings | null> => {
  const settingsDoc = await getDoc(doc(db, "settings", "system"));
  if (!settingsDoc.exists()) {
    // Return default settings
    return {
      siteName: "UniLink",
      siteDescription: "All your links in one place",
      maintenanceMode: false,
      allowRegistration: true,
      maxLinksPerUser: 50,
      defaultUserPlan: "free",
      emailNotifications: true,
      autoModeration: false,
      updatedAt: new Date(),
    };
  }
  return settingsDoc.data() as SystemSettings;
};

export const updateSystemSettings = async (
  settings: Partial<SystemSettings>,
  adminId: string
): Promise<void> => {
  await setDoc(
    doc(db, "settings", "system"),
    {
      ...settings,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
    },
    { merge: true }
  );

  await logAdminActivity(adminId, "update_settings", "settings", "system", "Updated system settings");
};

// ==================== EXPORT FUNCTIONS ====================

export const exportUsersToCSV = (users: UserProfile[]): string => {
  const headers = ["Username", "Display Name", "Email", "Role", "Status", "Plan", "Created At"];
  const rows = users.map((user) => [
    user.username,
    user.displayName,
    user.email || "",
    user.role,
    user.status,
    user.plan,
    user.createdAt instanceof Timestamp
      ? user.createdAt.toDate().toISOString()
      : new Date(user.createdAt).toISOString(),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csvContent;
};

export const exportLinksToCSV = (links: Link[]): string => {
  const headers = ["Title", "URL", "Clicks", "Enabled", "Created At"];
  const rows = links.map((link) => [
    link.title,
    link.url,
    link.clicks.toString(),
    link.enabled ? "Yes" : "No",
    link.createdAt instanceof Timestamp
      ? link.createdAt.toDate().toISOString()
      : new Date(link.createdAt).toISOString(),
  ]);

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return csvContent;
};


// ==================== CUSTOM THEME FUNCTIONS ====================

export interface CustomTheme {
  id: string;
  uid: string;
  name: string;
  // Background
  backgroundColor: string;
  backgroundGradient: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientDirection: "to-r" | "to-l" | "to-t" | "to-b" | "to-br" | "to-bl" | "to-tr" | "to-tl";
  backgroundImage?: string;
  backgroundBlur: number;
  backgroundOverlay: number;
  // Card/Button Styles
  cardBackgroundColor: string;
  cardOpacity: number;
  cardBlur: number;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardBorderRadius: number;
  cardShadow: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  // Text
  textColor: string;
  textSecondaryColor: string;
  fontFamily: string;
  // Effects
  enableAnimation: boolean;
  animationType: "none" | "pulse" | "gradient" | "glow";
  enableGlassmorphism: boolean;
  // Metadata
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Save custom theme for user
export const saveCustomTheme = async (uid: string, theme: Omit<CustomTheme, "id" | "uid" | "createdAt" | "updatedAt">): Promise<string> => {
  const themeRef = doc(collection(db, "customThemes"));
  await setDoc(themeRef, {
    ...theme,
    id: themeRef.id,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  
  // Update user profile to use custom theme
  await updateUserProfile(uid, { themeId: themeRef.id, theme: "custom" });
  
  return themeRef.id;
};

// Update existing custom theme
export const updateCustomTheme = async (themeId: string, theme: Partial<CustomTheme>): Promise<void> => {
  await updateDoc(doc(db, "customThemes", themeId), {
    ...theme,
    updatedAt: serverTimestamp(),
  });
};

// Get user's custom theme
export const getUserCustomTheme = async (uid: string): Promise<CustomTheme | null> => {
  const themesQuery = query(
    collection(db, "customThemes"),
    where("uid", "==", uid),
    orderBy("updatedAt", "desc"),
    limit(1)
  );
  const snapshot = await getDocs(themesQuery);
  if (snapshot.empty) return null;
  return snapshot.docs[0].data() as CustomTheme;
};

// Get custom theme by ID
export const getCustomThemeById = async (themeId: string): Promise<CustomTheme | null> => {
  const themeDoc = await getDoc(doc(db, "customThemes", themeId));
  if (!themeDoc.exists()) return null;
  return themeDoc.data() as CustomTheme;
};

// Delete custom theme
export const deleteCustomTheme = async (themeId: string): Promise<void> => {
  await deleteDoc(doc(db, "customThemes", themeId));
};

// ==================== LINK SCANNING / SAFETY CHECK FUNCTIONS ====================

export interface LinkScanResult {
  url: string;
  isSafe: boolean;
  threats: string[];
  checkedAt: Date;
  source: "google-safe-browsing" | "local-check" | "manual";
}

// Blocked domains list (common phishing/malware domains patterns)
const BLOCKED_PATTERNS = [
  /phishing/i,
  /malware/i,
  /hack/i,
  /scam/i,
  /fake/i,
  /login.*verify/i,
  /account.*suspend/i,
  /bit\.ly.*\?/i, // Suspicious shortened URLs with params
];

// Known safe domains
const SAFE_DOMAINS = [
  "google.com",
  "youtube.com",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "github.com",
  "tiktok.com",
  "spotify.com",
  "apple.com",
  "amazon.com",
  "microsoft.com",
  "discord.com",
  "twitch.tv",
  "reddit.com",
  "pinterest.com",
  "snapchat.com",
  "whatsapp.com",
  "telegram.org",
];

// Extract domain from URL
const extractDomain = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

// Check if URL is valid
export const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
};

// Local link safety check
export const checkLinkSafety = async (url: string): Promise<LinkScanResult> => {
  const threats: string[] = [];
  
  // Check if URL is valid
  if (!isValidUrl(url)) {
    return {
      url,
      isSafe: false,
      threats: ["Invalid URL format"],
      checkedAt: new Date(),
      source: "local-check",
    };
  }

  const domain = extractDomain(url);
  const urlLower = url.toLowerCase();

  // Check against blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(urlLower)) {
      threats.push("Suspicious URL pattern detected");
      break;
    }
  }

  // Check for IP address URLs (often used in phishing)
  const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
  if (ipPattern.test(url)) {
    threats.push("Direct IP address URL (potentially unsafe)");
  }

  // Check for excessive subdomains (common in phishing)
  const subdomainCount = domain.split(".").length - 2;
  if (subdomainCount > 3) {
    threats.push("Excessive subdomains (potentially suspicious)");
  }

  // Check for lookalike domains
  const lookalikeDomains = [
    { fake: /g00gle|googIe|gooogle/i, real: "google" },
    { fake: /faceb00k|facebok|faceboook/i, real: "facebook" },
    { fake: /instag[r]?am|1nstagram/i, real: "instagram" },
    { fake: /tw1tter|twiter/i, real: "twitter" },
    { fake: /paypa1|paypaI/i, real: "paypal" },
  ];

  for (const lookalike of lookalikeDomains) {
    if (lookalike.fake.test(domain)) {
      threats.push(`Possible lookalike domain (mimicking ${lookalike.real})`);
    }
  }

  // Check for data: or javascript: URLs
  if (url.startsWith("data:") || url.startsWith("javascript:")) {
    threats.push("Potentially malicious URL scheme");
  }

  return {
    url,
    isSafe: threats.length === 0,
    threats,
    checkedAt: new Date(),
    source: "local-check",
  };
};

// Check multiple links
export const checkMultipleLinksSafety = async (urls: string[]): Promise<Map<string, LinkScanResult>> => {
  const results = new Map<string, LinkScanResult>();
  
  for (const url of urls) {
    const result = await checkLinkSafety(url);
    results.set(url, result);
  }
  
  return results;
};

// Store link scan result in Firestore
export const storeLinkScanResult = async (linkId: string, result: LinkScanResult): Promise<void> => {
  await setDoc(doc(db, "linkScans", linkId), {
    ...result,
    linkId,
    checkedAt: serverTimestamp(),
  });
};

// Get stored scan result for a link
export const getStoredLinkScanResult = async (linkId: string): Promise<LinkScanResult | null> => {
  const scanDoc = await getDoc(doc(db, "linkScans", linkId));
  if (!scanDoc.exists()) return null;
  return scanDoc.data() as LinkScanResult;
};

// Report unsafe link
export const reportUnsafeLink = async (
  linkId: string,
  linkUrl: string,
  reporterUid: string,
  reason: string
): Promise<void> => {
  const reportRef = doc(collection(db, "unsafeLinkReports"));
  await setDoc(reportRef, {
    id: reportRef.id,
    linkId,
    linkUrl,
    reporterUid,
    reason,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  // Create admin notification
  await createAdminNotification({
    type: "content_flagged",
    title: "Unsafe Link Reported",
    message: `A link has been reported as unsafe: ${linkUrl}`,
    data: { linkId, linkUrl, reporterUid, reason },
  });
};

// Admin: Get all unsafe link reports
export const getUnsafeLinkReports = async (status?: "pending" | "reviewed" | "resolved"): Promise<any[]> => {
  let reportsQuery;
  
  if (status) {
    reportsQuery = query(
      collection(db, "unsafeLinkReports"),
      where("status", "==", status),
      orderBy("createdAt", "desc")
    );
  } else {
    reportsQuery = query(
      collection(db, "unsafeLinkReports"),
      orderBy("createdAt", "desc")
    );
  }
  
  const snapshot = await getDocs(reportsQuery);
  return snapshot.docs.map((doc) => doc.data());
};

// Admin: Update unsafe link report status
export const updateUnsafeLinkReportStatus = async (
  reportId: string,
  status: "reviewed" | "resolved",
  adminId: string,
  resolution?: string
): Promise<void> => {
  await updateDoc(doc(db, "unsafeLinkReports", reportId), {
    status,
    reviewedBy: adminId,
    reviewedAt: serverTimestamp(),
    resolution: resolution || null,
  });
};
