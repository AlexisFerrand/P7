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
      req.file.detectedMimeType !== 'image/jpg' &&
      req.file.detectedMimeType !== 'image/png' &&
      req.file.detectedMimeType !== 'image/jpeg'
    )
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
  res.status(200).json({ fileName });
};
