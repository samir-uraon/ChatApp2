importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
 
  apiKey: "AIzaSyB_r1-IIiap0Vig04jJSCk4TUp8eFk44qg",
  authDomain: "chat-app-3b927.firebaseapp.com",
  projectId: "chat-app-3b927",
  storageBucket: "chat-app-3b927.firebasestorage.app",
  messagingSenderId: "787750367154",
  appId: "1:787750367154:web:96c0ed87b7493b2566feab",
  measurementId: "G-V2SBQZ0FNF"

});

const messaging = firebase.messaging();