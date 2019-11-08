const functions = require('firebase-functions');
const admin = require('firebase-admin');

//  const express = require('express');
//  const app = express();
const app = require('express')(); //위 두 줄을 한줄로 이렇게도 씀

admin.initializeApp();


//firebase에서 앱 등록에서 구할 수 있음.
const config = {
  apiKey: "AIzaSyDEyu3nXaRLftPgLr5NgkWGjlGVCAiRIHQ",
  authDomain: "socialape-32b84.firebaseapp.com",
  databaseURL: "https://socialape-32b84.firebaseio.com",
  projectId: "socialape-32b84",
  storageBucket: "socialape-32b84.appspot.com",
  messagingSenderId: "161076161308",
  // appId: "1:161076161308:web:c5c253f6348a7cf94828d9",
  // measurementId: "G-GJYWJP4ZKJ"
};




const firebase = require('firebase')
firebase.initializeApp(config)

//편하게 쓸려고 정의.
const db = admin.firestore();



//DB에서 값을 불러오기
app.get('/screams', (req, res) => {
  db
    .collection('screams')
    .orderBy('createdAt', 'desc')//먼저 만들어진 순으로 먼저 보여주기. desc- 내림차순
    .get()
    .then((data) => {
      let screams = [];
      data.forEach((doc) => {
        screams.push({
          screamId: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
    })
    .catch((err) => console.error(err))
})

//DB에있는 것을 모두 긁어오는 요청
// exports.getScreams = functions.https.onRequest((req, res) => {
//     admin.firestore().collection('screams').get()
//         .then(data => {
//             let screams = [];
//             data.forEach(doc => {
//                 screams.push(doc.data());
//             });
//             return res.json(screams);
//         })
//         .catch(err => console.error(err))
// });

//새로운 Table? 생성 요청(get 방식만)
// exports.createScream = functions.https.onRequest((req, res) => {
//     const newScream = {
//         body : req.body.body,
//         userHandle : req.body.userHandle,
//         createdAt : admin.firestore.Timestamp.fromDate(new Date())
//     };

//     admin.firestore()
//         .collection('screams')
//         .add(newScream)
//         .then(doc => {
//             res.json({ message: `document ${doc.id} created successfully!`});
//         })
//         .catch(err => {
//             res.status(500).json({ error: `something Fuck...`})
//             console.log(err)
//         })
// })

app.post('/screams', (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db
    .collection('screams')
    .add(newScream)
    .then(doc => {
      res.json({ message: `document ${doc.id} created successfully!` });
    })
    .catch(err => {
      res.status(500).json({ error: `something Fuck...` })
      console.log(err)
    })
})
//이메일 정규식 확인절차
const isEmail = (email) => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if(email.match(regEx)) return true;
  else return false
}

//빈공간 
const isEmpty = (string) => {
  if(string.trim() === '') return true
  else return false
}


//Signup route
app.post('/signup', (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle,
  };

  //온전하지 않은 회원정보에 대한 에러조치. 128~ 140
  let errors = {};

  if(isEmpty(newUser.email)) {
    errors.email = 'email must not be empty'
  }else if(!isEmail(newUser.email)) {
    errors.email = 'must be a valid email address'
  }

   if(isEmpty(newUser.password)) errors.password = 'Must not be empty'
   if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'passwords must match';
   if(isEmpty(newUser.handle)) errors.handle = 'Must not be empty'

   if(Object.keys(errors).length > 0) return res.status(400).json(errors);

  //TODO: validate data
  /*신규 사용자의 이메일 주소와 비밀번호를 "createUserWithEmailAndPassword"에 전달하여 신규계정을 생성 */
  let token, userId;
  db.doc(`/users/${newUser.handle}`).get()
    .then(doc => {
      if(doc.exists) {
        return res.status(400).json({handle: `this handle is already taken`});
      }else {
        return firebase
        .auth()
        .createUserWithEmailAndPassword(newUser.email, newUser.password)
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
      
    })
    .then(idToken => {
      token = idToken;
      // return res.status(201).json({token});
      const userCredentials = {
        handle : newUser.handle,
        email : newUser.email,
        created : new Date().toISOString(),
        userId
      };
      return db.doc(`/users/${newUser.handle}`).set(userCredentials);
    })
    .then(()=> {
      return res.status(201).json({ token })
    })
    .catch(err => {
      console.error(err)
      if(err.code === 'auth/email-already-in-use'){
        return res.status(400).json({email: `Email is already is use`});
      }else {
        return res.status(500).json({error: err.code}); 
      }
      
    })
})
//로그인 에서...
app.post('/login', (req,res) => {
  /*email과 paddword를 사용한다 정의 */
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  //에러 정의.
  let errors = {};

  /* 정의한 'user에 email, password에 isempty(스페이스바)가 있는지 확인하고 있으면 err' */
  if(isEmpty(user.email)) errors.email = 'Must not be empty';
  if(isEmpty(user.password)) errors.password = 'Must not be empty';

  /* 잘 모르겠지만 글씨가 없을떄 에러나는거 같음 */
  if(Object.keys(errors).length > 0) return res.status(400).json(errors) 

  /* 사용자가 앱에 로그인하면, 이메일, 패스워드를 "signInWithEmailAndPassword"에 전달 */
  firebase.auth().signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token })
    })
    .catch(err => {
      console.error(err)
      /*만약 에러 코드가 'auth/wrong-password'가 뜨면, 403페이지에 json({...}에 텍스트를 보여주어라) */
      if(err.code ==='auth/wrong-password'){ 
        return res
          .status(403)
          .json({general: 'Worng credentials, please try agian'});
      }else return res.status(500).json({ error: err.code})
    })
})

exports.api = functions.https.onRequest(app);