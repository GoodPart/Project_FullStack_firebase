const functions = require('firebase-functions');

//  const express = require('express');
//  const app = express();
const app = require('express')(); //위 두 줄을 한줄로 이렇게도 씀

const FBAuth = require('./util/fbAuth');

const {getAllScreams, postOneScream} = require('./handlers/screams');
const {signup, login} = require('./handlers/user');




//DB에서 값을 불러오기
app.get('/screams', getAllScreams)
app.post('/scream',FBAuth , postOneScream)

//Users route
app.post('/signup', signup)
app.post('/login', login)


exports.api = functions.https.onRequest(app);