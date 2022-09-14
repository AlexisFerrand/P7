const UserModel = require('../models/user.model');
// incrémenter des éléments dans des fichiers
const fs = require('fs');
const { promisify } = require('util');
const { uploadErrors } = require('../utils/error.utils');
const pipeline = promisify(require('stream').pipeline);
let stream = require('stream');

module.exports.uploadProfil = async (req, res) => {
  try {
    // Vérification du format de l'image
    if (
      req.file.mimetype !== 'image/jpg' &&
      req.file.mimetype !== 'image/png' &&
      req.file.mimetype !== 'image/jpeg'
    )
      throw Error ('invalid file');
      if (req.file.size > 500000)
        //throw ('invalid file');
        //console.log(body);
        //en Ko | quand on throw une erreur on arrête le try catch et on passe directement au catch
        throw Error('max size');
  } catch (err) {
    const errors = uploadErrors(err);
    return res.status(201).json({ errors });
  }

  const fileName = req.body.name + '.jpg';
  let bufferStream = new stream.PassThrough();
  await pipeline(
    // file va créer dans ce chemin la un fichier entièrement
    bufferStream.end(req.file.buffer),
    fs.createWriteStream(
      `${__dirname}/../client/public/uploads/profil/${fileName}`
    )
  );
  // Générer automatiquement le chemin de la picture, stocker dans mongoDB: pour l'affichage dans react
  try {
    await UserModel.findByIdAndUpdate(
      req.body.userId,
      { $set : { picture: "./uploads/profil/" + fileName }},
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).then((docs) =>  res.status(200).send(docs))
    .catch((err) => res.status(500).send({ message: err}))
  } catch (err){
    return res.status(500).send({ message: err})
  }
};
