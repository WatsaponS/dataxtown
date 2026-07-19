// Firebase web config (ค่า public ฝั่ง client — แชร์ได้ ไม่ใช่ความลับ)
// ตั้งเป็น null เพื่อปิด Firebase แล้วกลับไปใช้ WebSocket server ในเครื่อง (server.py)
export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBkatMhjwvElORZOsTP2z80ZAgrYxaqjSY",
  authDomain: "dataxtown.firebaseapp.com",
  databaseURL: "https://dataxtown-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dataxtown",
  storageBucket: "dataxtown.firebasestorage.app",
  messagingSenderId: "872280792438",
  appId: "1:872280792438:web:46eafc0092d8fd7be7ee57",
};
