'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
var bodyParser=require("body-parser");
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// Code for URL Shortener
var Schema=mongoose.Schema;

var urlSchema=new Schema({
  originalURL: String,
  shortURL: Number
  });

var URL=mongoose.model('URL', urlSchema);

var dns=require('dns');

app.post("/api/shorturl/new", function(req,res) {
  var regEx=/^((http|https):\/\/)www\.[A-z]+\.[A-z]{2,}/;
  
  if (regEx.test(req.body.url)) //if URL format is valid
  { 
    var position=req.body.url.indexOf("w");
    var urlWithoutHTTP=req.body.url.slice(position);
    
    dns.lookup(urlWithoutHTTP, (err, address, family) => {
      if (err!=null) //URL format is valid but not real/valid site
      { res.json({"error": "invalid URL"}); }
      else
      {
         URL.findOne({originalURL: req.body.url}, function(err, result) {
            if (err) { console.log(err); }
            if (result!=null) //if find this URL in database, return result from database
            { res.json({original_url: result.originalURL, short_url: result.shortURL}); }
            else // if not found in DB, create a recode in DB and return JSON
            {
              var randomNO=Math.floor(Math.random()*100)+1;
              URL.create([{originalURL: req.body.url, shortURL: randomNO}]);
              res.json({original_url: req.body.url, short_url: randomNO});
            }
         });
       }
     });
   }        
  else 
  { res.json({"error": "invalid URL"}); }
});

app.get("/api/shorturl/:shorturl", function(req,res) { 
  URL.findOne({shortURL: req.params.shorturl}, function(err, result) {
    if (err) { console.log(err); }
    if (result!=null) //if find this short url in database, redirect user to its original url
    { res.redirect(result.originalURL); }
    else // if not found in DB, return JSON
    { res.json({"error": "invalid Short URL"}); }
  });
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});
