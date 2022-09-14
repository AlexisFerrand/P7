const PostModel = require('../models/post.model');
const UserModel = require('../models/user.model');
const ObjectId = require('mongoose').Types.ObjectId;
const { uploadErrors } = require('../utils/error.utils');
const fs = require('fs');
const { promisify } = require('util');
const pipeline = promisify(require('stream').pipeline);
let stream = require('stream');

module.exports.readPost = (req, res) => {
  PostModel.find((err, docs) => {
    if (!err) res.send(docs);
    else console.log('Error to get data : ' + err);
  }).sort({ createdAt: -1 });
};

module.exports.createPost = async (req, res) => {
  let fileName;

  if (req.file !== null) {
    try {
      // Vérification du format de l'image
      if (
        req.file.mimetype !== 'image/jpg' &&
        req.file.mimetype !== 'image/png' &&
        req.file.mimetype !== 'image/jpeg'
      )
        throw Error('invalid file');
      if (req.file.size > 500000)
        //en Ko | quand on throw une erreur on arrête le try catch et on passe directement au catch
        throw Error('max size');
    } catch (err) {
      const errors = uploadErrors(err);
      return res.status(201).json({ errors });
    }

    fileName = req.body.posterId + Date.now() + '.jpg';
    let bufferStream = new stream.PassThrough();
    await pipeline(
      // file va créer dans ce chemin la un fichier entièrement
      bufferStream.end(req.file.buffer),
      fs.createWriteStream(
        `${__dirname}/../client/public/uploads/posts/${fileName}`
      )
    );
  }

  const newPost = new PostModel({
    posterId: req.body.posterId,
    message: req.body.message,
    picture: req.file !== null ? './uploads/posts/' + fileName : '',
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

module.exports.commentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  try {
    return PostModel.findByIdAndUpdate(
      req.params.id,
      {
        //$push, on garde les infos dans la base de données, on rajoute ces informations là
        $push: {
          comments: {
            commenterId: req.body.commenterId,
            commenterPseudo: req.body.commenterPseudo,
            text: req.body.text,
            timestamp: new Date().getTime(),
          },
        },
      },
      { new: true },
      (err, docs) => {
        if (!err) return res.send(docs);
        else return res.status(400).send(err);
      }
    );
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.editCommentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  try {
    return PostModel.findById(req.params.id, (err, docs) => {
      const theComment = docs.comments.find((comment) =>
        comment._id.equals(req.body.commentId)
      );
      if (!theComment) return res.status(404).send('Comment not found');
      theComment.text = req.body.text;

      return docs.save((err) => {
        if (!err) return res.status(200).send(docs);
        return res.status(500).send(err);
      });
    });
  } catch (err) {
    return res.status(400).send(err);
  }
};

module.exports.deleteCommentPost = (req, res) => {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).send('ID unknown:' + req.params.id);

  try {
    return PostModel.findByIdAndUpdate(
      req.params.id,
      {
        $pull: {
          comments: {
            _id: req.body.commentId,
          },
        },
      },
      { new: true }
    )
      .then((data) => {
        return res.send(data);
      })
      .catch((err) => {
        return res.status(400).send(err);
      });
  } catch (err) {
    return res.status(400).send(err);
  }
};
