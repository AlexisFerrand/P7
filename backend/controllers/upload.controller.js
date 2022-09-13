const UserModel = require('../models/user.model');
// incrémenter des éléments dans des fichiers
const fs = require('fs');
const { promisify } = require('util');
const { uploadErrors } = require('../utils/error.utils');
const pipeline = promisify(require('stream').pipeline);


module.exports.uploadProfil = async (req, res) => {
  try {
    // Vérification du format de l'image
    if (
      req.file.detectedMimeType !== 'image/jpg' &&
      req.file.detectedMimeType !== 'image/png' &&
      req.file.detectedMimeType !== 'image/jpeg'
    )
    throw Error('invalid file');
    //en Ko | quand on throw une erreur on arrête le try catch et on passe directement au catch
    if (req.file.size > 500000) throw Error('max size');
  } catch (err) {
    const errors = uploadErrors(err);
    return res.status(201).json({ errors });
  }

  const fileName = req.body.name + ".jpg";

  await pipeline(
    // file va créer dans ce chemin la un fichier entièrement
    req.file.stream,
    fs.createWriteStream(
      `${__dirname}/../client/public/uploads/profil/${fileName}`
    )
  );
};
