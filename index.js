require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let bodyParser = require('body-parser')
const mongoose = require('mongoose')
mongoose.set('strictQuery', true);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

// let uri = process.env['MONGO_URI']
// mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let urlSchema = new mongoose.Schema({
  original: { type: String, required: true},
  short: Number
})

let Url = mongoose.model('Url', urlSchema)


  
let resObj = {}

app.post('/api/shorturl', bodyParser.urlencoded({ extended: false}), (req, res) => {

  let inputUrl = req.body['url']

  let urlRegex = new RegExp(/[http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)

if(!inputUrl.match(urlRegex)) {
  res.json({error: 'Invalid URL'})
  return
}
   resObj['original_url'] = inputUrl

  let inputShort = 1

  Url.findOne({})
    .sort({short: 'desc'})
    .exec((error, result) => {
      if(!error && result != undefined){
        inputShort = result.short + 1
      }
      if(!error){
        Url.findOneAndUpdate(
          {original: inputUrl}, 
          {original: inputUrl, short: inputShort},
          { new: true, upsert: true },
          (error,savedUrl) => {
            if(!error){
              resObj['short_url'] = savedUrl.short
              res.json(resObj)
            }
          }
        )
      }
    })
})

app.get('/api/shorturl/:input', (req,res) => {
  let input = req.params.input

  Url.findOne({short: input}, (err,result) => {
    if(!err && result != undefined){
      res.redirect(result.original)
    }else{
      res.json('URL not found')
    }
  })
})