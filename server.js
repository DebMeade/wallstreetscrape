var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

var axios = require("axios");
var cheerio = require("cheerio");

var db = require("./models");

var PORT = process.env.PORT || 3000;

var app = express();

app.use(logger("dev"));

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

mongoose.connect(process.env.MONDODB_URI || "mongodb://localhost/wallstreetscrape", { useNewUrlParser: true });

//Routes

app.get("/scrape", function(req, res) {
  axios.get("https://www.wsj.com/").then(function(response) {

  var $ = cheerio.load(response.data);

  $(".wsj-card").each(function(i, element) {
    var result = {};

    result.title = $(this).children("h3").children("a").text();
    result.link = $(this).children("h3").children().attr("href");
    result.summary = $(this).children(".wsj-card-body").children("p").children("span").text();

    db.Article.create(result)
    .then(function(dbArticle) {
      console.log(dbArticle);
    })
    .catch(function(err) {
      return res.json(err);
    });
  });
    
    res.send("Scrape Complete");
  });
});


//adding the / for heroku
app.get("/", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

app.get("/articles/:id", function(req, res) {
  db.Article.findOne({ _id: req.params.id })
  .populate("note")
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.post("/articles/:id", function(req, res) {
  db.Note.create(req.body)
  .then(function(dbNote) {
    return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
  })
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) { 
    res.json(err);
  });
});

app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});