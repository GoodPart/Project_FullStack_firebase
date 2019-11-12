const functions = require("firebase-functions");

//  const express = require('express');
//  const app = express();
const app = require("express")(); //위 두 줄을 한줄로 이렇게도 씀

const FBAuth = require("./util/fbAuth");

const {
  getAllScreams,
  postOneScream,
  getScream,
  commentOnScream
} = require("./handlers/screams");
const {
  signup,
  login,
  uploadImage,
  addUserDetails,
  getAuthenticatedUser
} = require("./handlers/user");

//Scream routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postOneScream);
app.get("/scream/:screamId", getScream);
//TODO: delete scream
//TODO: like a scream
//TODO: unlike a scream
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

//Users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getAuthenticatedUser);

exports.api = functions.https.onRequest(app);
