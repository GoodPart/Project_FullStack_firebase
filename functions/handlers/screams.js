const {db} = require('../util/admin');

exports.getAllScreams = (req, res) => {
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
      .catch((err) => {
        console.error(err);
        res.status(500).json({error: err.code});
        //형태만 조금 바꿈.
      });
  }

  exports.postOneScream = (req, res) => {
    const newScream = {
      body: req.body.body,
      userHandle: req.user.handle,
      createdAt: new Date().toISOString()
    };
  
    db //firebase store(데이터베이스)에 요청해라.
      .collection('screams') //'screams를 찾고
      .add(newScream) // newScream의 형태로 더해라.
      .then(doc => {
        res.json({ message: `document ${doc.id} created successfully!` });
        //만약 성공적이라면 메세지를 띄워라 
      })
      .catch(err => {
        res.status(500).json({ error: `something Fuck...` })
        console.log(err)
      })
  }