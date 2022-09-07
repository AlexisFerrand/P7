const PostModel = require('../models/post.model');
const UserModel = require('../models/user.model');
const ObjectId = require('mongoose').Types.ObjectId;

module.exports.readPost = (req, res) => {
  PostModel.find((err, docs) => {
    if (!err) res.send(docs);
    else console.log('Error to get data : ' + err);
  });
};

module.exports.createPost = async (req, res) => {
  const newPost = new PostModel({
    posterId: req.body.posterId,
    message: req.body.message,
    video: req.body.video,
    likers: [],
    comments: [],
  });

  try {
    const post = await newPost.save();
    return res.status(201).json(post);
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.updatePost = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  const updatedRecord = {
    message: req.body.message,
  };

  PostModel.findByIdAndUpdate(
    req.params.id,
    { $set: updatedRecord },
    { new: true },

    (err, docs) => {
      if (!err) res.send(docs);
      else console.log('Update error : ' + err);
    }
  );
};

module.exports.deletePost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  PostModel.findByIdAndRemove(req.params.id, (err, docs) => {
    if (!err) res.send(docs);
    else console.log('Delete error : ' + err);
  });
};

module.exports.likePost = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  try {
    // On ajout l'utilisateur dans les likers du post
    await PostModel.findByIdAndUpdate(
      //Quand un post est aimé on récupère ce post avec son ID qui est placé dans l'URL
      req.params.id,
      //addToSet: ajoute au tableau déjà existant, n'écrase pas les données déjà collectées. On transmet l'ID de la personne qui a liké
      {
        $addToSet: { likers: req.body.id },
      },
      { new: true }
    )
      .then((docs) => {
        UserModel.findByIdAndUpdate(
          //On récupère l'ID du post dans le body. On rajoute à son tableau l'ID du post
          req.body.id,
          {
            $addToSet: { likes: req.params.id },
          },
          { new: true }
        ).then((data) => {
          res.status(201).json(data);
        });
      })

      .catch((err) => res.status(400).json(err));
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.unlikePost = async (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  try {
    // On ajout l'utilisateur dans les likers du post
    await PostModel.findByIdAndUpdate(
      //Quand un post est unlike on récupère ce post avec son ID qui est placé dans l'URL
      req.params.id,
      //pull: enlève au tableau déjà existant
      {
        $pull: { likers: req.body.id },
      },
      { new: true }
    )
      .then((docs) => {
        UserModel.findByIdAndUpdate(
          //On récupère l'ID du post dans le body. On enlève à son tableau l'ID du post
          req.body.id,
          {
            $pull: { likes: req.params.id },
          },
          { new: true }
        ).then((data) => {
          res.status(201).json(data);
        });
      })

      .catch((err) => res.status(400).json(err));
  } catch (err) {
    return res.status(400).send(err);
  }
};
