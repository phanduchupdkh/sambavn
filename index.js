require('dotenv').config();
var express = require ('express');
var app = express();
var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsi

app.use(express.static('public'));

app.get('/', (req, res) => res.send('Hello World!'))

app.listen(process.env.PORT || 3001, function() {
	console.log('Server listening on port ');
});