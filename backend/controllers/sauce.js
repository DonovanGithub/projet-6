const Sauce = require("../models/Sauce");
const fs = require("fs");
exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce);
  delete sauceObject._id;
  delete sauceObject._userId;
  const sauce = new Sauce({
    ...sauceObject,
    userId: req.auth.userId,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${
      req.file.filename
    }`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisLiked: [],
  });

  sauce
    .save()
    .then(() => {
      res.status(201).json({ message: "Sauce enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
exports.modifySauce = (req, res, next) => {
  const sauceObject = req.file
    ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };
  delete sauceObject._userId;
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "Unauthorized request" });
      } else {
        sauce.imageUrl.split("/images/")[1];
        Sauce.updateOne(
          { _id: req.params.id },
          { ...sauceObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Sauce modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};
exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId != req.auth.userId) {
        res.status(403).json({ message: "Unauthorized request" });
      } else {
        const filename = sauce.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Sauce supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
};
exports.getOneSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => res.status(200).json(sauce))
    .catch((error) => res.status(404).json({ error }));
};
exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then((sauces) => res.status(200).json(sauces))
    .catch((error) => res.status(400).json({ error }));
};

exports.likeDislike = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id }).then((sauce) => {
    userId = req.body.userId;
    usersLiked = sauce.usersLiked;
    usersDisliked = sauce.usersDisliked;
    likeId = usersLiked.includes(userId);
    dislikeId = usersDisliked.includes(userId);
    if (req.body.like == 1) {
      sauce.usersLiked.push(userId);
      sauce.likes += 1;
    } else if (req.body.like === 0 && likeId) {
      sauce.likes -= 1;
      const deletelikedId = usersLiked.filter((id) => id != userId);
      sauce.usersLiked = deletelikedId;
    }
    if (req.body.like === -1) {
      sauce.usersDisliked.push(userId);
      sauce.dislikes += 1;
    } else if (req.body.like === 0 && dislikeId) {
      sauce.dislikes -= 1;
      const deleteDislikedId = usersDisliked.filter((id) => id != userId);
      sauce.usersDisliked = deleteDislikedId;
    }
    console.log(sauce);

    Sauce.updateOne(
      { _id: req.params.id },
      {
        likes: sauce.likes,
        dislikes: sauce.dislikes,
        usersLiked: sauce.usersLiked,
        usersDisliked: sauce.usersDisliked,
      }
    )
      .then(() => res.status(201).json({ message: "Avis comptabilisé !" }))
      .catch((error) => res.status(401).json({ error }));
  });
};
