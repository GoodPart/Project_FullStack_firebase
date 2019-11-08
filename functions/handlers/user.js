const {db} = require('../util/admin');

const config = require('../util/config');

const firebase = require('firebase');
firebase.initializeApp(config);

const { validateSignupData, validateLoginData } = require('../util/validators')

exports.signup = (req, res) => {
    const newUser = {
      email: req.body.email,
      password: req.body.password,
      confirmPassword: req.body.confirmPassword,
      handle: req.body.handle,
    };
    
    const { valid, errors } = validateSignupData(newUser);

    if(!valid) return res.status(400).json(errors);
    
  
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
  }

  exports.login = (req,res) => {
    /*email과 paddword를 사용한다 정의 */
    const user = {
      email: req.body.email,
      password: req.body.password
    };

    const { valid, errors } = validateLoginData(user);

    if(!valid) return res.status(400).json(errors);
  
    
  
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
  }