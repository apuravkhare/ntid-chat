// const firebase = require('firebase/app');
// const firebaseActions = require('firebase/firestore/lite');

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

class DbRepository {
  constructor() {
    /* Firebase setup */
    this.firebaseConfig = {
      apiKey: "AIzaSyCDhCvbC-wlRaYdJhgpFjk5QJydW98mf4Y",
      authDomain: "speechtotextdb-4e491.firebaseapp.com",
      databaseURL: "https://speechtotextdb-4e491-default-rtdb.firebaseio.com",
      projectId: "speechtotextdb-4e491",
      storageBucket: "speechtotextdb-4e491.appspot.com",
      messagingSenderId: "44531135133",
      appId: "1:44531135133:web:cbbd90a794c98eff2a1a74"
    };

    const serviceAccount = require("./speechtotextdb-4e491-firebase-adminsdk-o6x42-579c07b450.json");

    initializeApp({
      credential: cert(serviceAccount)
    });    
    this.db = getFirestore();
    this.transcriptsCollectionName = "transcript-logs";
  }

  getLog = async function(roomId) {
    const logRef = await this.db.collection(this.transcriptsCollectionName).doc(roomId);
    const doc = await logRef.get();
    return doc.data();
  }

  getLogs = async function () {
    const collection = this.db.collection(this.transcriptsCollectionName);
    const snapshot = await collection.get();
    return snapshot.docs.map(doc => { return { "id": doc.data()["id"], "timestamp": doc.data()["timestamp"].toDate() }; });
  }

  addNewLog = async function (roomId, userIds) {
    // TODO: check with existing and union here if possible
    const data = { "id": roomId, "timestamp": new Date(), "users": userIds, "messages": [] };
    await this.db.collection(this.transcriptsCollectionName).doc(roomId).set(data);
  }

  addMessage = async function (roomId, message) {
    const logRef = await this.db.collection(this.transcriptsCollectionName).doc(roomId);
    await logRef.update({
      "messages": FieldValue.arrayUnion(message)
    });
  }
}

module.exports = { DbRepository }