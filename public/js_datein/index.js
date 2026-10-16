const firebaseConfig = {
    apiKey: "AIzaSyB5lzlZti7rj-9ZZxDrs-0sTXY1CrI4Ptk",
    authDomain: "unsere-zeit.firebaseapp.com",
    projectId: "unsere-zeit",
    appId: "1:299622851652:web:86101fd400cade7626c811"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('user').value;
    const password = document.getElementById('pass').value;

    try {
      await auth.signInWithEmailAndPassword(email, password);
      window.location.href = "home.html";
    } catch (err) {
      alert("Login fehlgeschlagen: " + err.message);
    }
});