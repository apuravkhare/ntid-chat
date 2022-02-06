const firebase = require('firebase/app');
const firebaseActions = require('firebase/firestore/lite');

/* Firebase setup */
const firebaseConfig = {
  apiKey: "AIzaSyCDhCvbC-wlRaYdJhgpFjk5QJydW98mf4Y",
  authDomain: "speechtotextdb-4e491.firebaseapp.com",
  databaseURL: "https://speechtotextdb-4e491-default-rtdb.firebaseio.com",
  projectId: "speechtotextdb-4e491",
  storageBucket: "speechtotextdb-4e491.appspot.com",
  messagingSenderId: "44531135133",
  appId: "1:44531135133:web:cbbd90a794c98eff2a1a74"
};

const firebaseApp = firebase.initializeApp(firebaseConfig);
const db = firebaseActions.getFirestore(app);

async function getLogs() {
  const collection = firebaseActions.collection(db, 'transcript-logs');
  const snapshot = await getDocs(collection);
  return snapshot.docs.map(doc => doc.data());
}