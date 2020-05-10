require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const fetch = require('node-fetch')
const axios = require('axios')
const { TelegramClient } = require('messaging-api-telegram')
const username = 'duc.phan'
const password = '12345678'
const client = TelegramClient.connect('972402414:AAE5rvRgp3oanR7tRm7mO2YESRrpE4bya-Q')


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsi

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');

app.get('/', (req, res) => res.render('baucua', { themes: 'mobile' }))

app.get('/myip', (req, res) => {
	var ip = req.headers['x-forwarded-for'] || 
     req.connection.remoteAddress || 
     req.socket.remoteAddress ||
     (req.connection.socket ? req.connection.socket.remoteAddress : null);
	
	res.send(req)
})

app.get('/paste', (req, res) => res.render('paste'))
app.get('/fitness', (req, res) => res.render('fitness'))
app.get('/datcom', (req, res) => {
	// login
	fetch("https://portal.acexis.com/graphqllunch",
		{
			"credentials": "omit",
			"headers": {
				"accept": "*/*",
				"accept-language": "en-US,en;q=0.9",
				"content-type": "application/json",
				"currentsite": "",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"access-token": ""
			},
			"referrer": "https://portal.acexis.com/lun/login",
			"referrerPolicy": "no-referrer-when-downgrade",
			"body": `{\"operationName\":null,\"variables\":{\"input\":{\"username\":\"${username}\",\"password\":\"${password}\"}},\"query\":\"mutation ($input: LoginUserInput!) {\\n  login(input: $input) {\\n    token\\n    userPermissions {\\n      siteId\\n      siteName\\n      sitepermissions\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,
			"method": "POST",
			"mode": "cors"
		})
		.then(res => res.json())
		.then(res => {
			let tokenD = res.data.login.token
			const header = {
				"accept": "*/*",
				"accept-language": "en-US,en;q=0.9",
				"content-type": "application/json",
				"currentsite": "52be5550-be4f-11e9-aa89-2b0626c97f03",
				"sec-fetch-mode": "cors",
				"sec-fetch-site": "same-origin",
				"access-token": tokenD
			}

			// getMenu
			fetch("https://portal.acexis.com/graphqllunch", {
				"credentials": "omit",
				"headers": header,
				"referrer": "https://portal.acexis.com/lun/order",
				"referrerPolicy": "no-referrer-when-downgrade",
				"body": "{\"operationName\":\"menuPublishBySite\",\"variables\":{\"siteId\":\"52be5550-be4f-11e9-aa89-2b0626c97f03\"},\"query\":\"query menuPublishBySite($siteId: String!) {\\n  menuPublishBySite(siteId: $siteId) {\\n    _id\\n    name\\n    isActive\\n    isLocked\\n    isPublished\\n    dishes {\\n      _id\\n      name\\n      count\\n      orderCount\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}",
				"method": "POST",
				"mode": "cors"
			})
				.then(res => res.json())
				.then(async res => {
					let { dishes } = res.data.menuPublishBySite
					let duPhong = dishes[0]
					let monKhongUas = await axios.get("https://github.com/phanduchupdkh/lenhDatComTrua/blob/master/monkhonguathich.txt")
					monKhongUas = monKhongUas.data.split('trunhungmonnayra:')[1].split(/,\s?/)
					let dish;
					monKhongUas.forEach(monKhongUa => {
						dishes = dishes.filter(item => !(item.name.toLowerCase().includes(monKhongUa)))
					})

					const lenDish = dishes.length
					//console.log(dishes.map(item=>item.name))
					if (lenDish) {
						dish = dishes[parseInt(lenDish * Math.random())]
					} else {
						dish = duPhong
					}

					let { _id } = res.data.menuPublishBySite
					return { dish, _id }
				})
				.then(({ dish, _id }) => {
					// check should order
					console.log(dish.name)
					fetch("https://portal.acexis.com/graphqllunch",
						{
							"credentials": "omit",
							"headers": header,
							"referrer": "https://portal.acexis.com/lun/order",
							"referrerPolicy": "no-referrer-when-downgrade",
							"body": `{\"operationName\":\"ordersByUser\",\"variables\":{\"menuId\":\"${_id}\"},\"query\":\"query ordersByUser($menuId: String!) {\\n  ordersByUser(menuId: $menuId) {\\n    _id\\n    menuId\\n    dishId\\n    count\\n    note\\n    isConfirmed\\n    __typename\\n  }\\n}\\n\"}`,
							"method": "POST",
							"mode": "cors"
						})
						.then(res => res.json())
						.then(res => {
							if (res.data.ordersByUser.length) {

								let idConfirm = res.data.ordersByUser[0]._id
								if (res.data.ordersByUser[0].isConfirmed === false) {
									fetch("https://portal.acexis.com/graphqllunch", {
										"credentials": "omit",
										"headers": header,
										"referrer": "https://portal.acexis.com/lun/order",
										"referrerPolicy": "no-referrer-when-downgrade",
										"body": `{\"operationName\":\"updateOrder\",\"variables\":{\"currentSite\":\"52be5550-be4f-11e9-aa89-2b0626c97f03\",\"id\":\"${idConfirm}\",\"input\":{\"isConfirmed\":true}},\"query\":\"mutation updateOrder($id: String!, $input: UpdateOrderInputC!, $currentSite: String!) {\\n  updateOrder2(id: $id, input: $input, currentSite: $currentSite)\\n}\\n\"}`,
										"method": "POST",
										"mode": "cors"
									})
										.then((res) => {
											console.log(res)
											client.sendMessage(-339081841, `@phanduchupdkh ban da confirm thanh cong`).then(() => {
												console.log('sent');
											});
										})
								}
							}
							else {
								// oder
								console.log(header)
								fetch("https://portal.acexis.com/graphqllunch",
									{
										"credentials": "omit",
										"headers": {
											"accept": "*/*", "accept-language": "en-US,en;q=0.9",
											"access-token": tokenD,
											"content-type": "application/json",
											"current-site": "52be5550-be4f-11e9-aa89-2b0626c97f03",
											"sec-fetch-mode": "cors", "sec-fetch-site": "same-origin"
										},
										"referrer": "https://portal.acexis.com/lun/order",
										"referrerPolicy": "no-referrer-when-downgrade",
										"body": `{\"operationName\":\"orderDishC\",\"variables\":{\"input\":{\"menuId\":\"${_id}\",\"dishId\":\"${dish._id}\",\"order\":true}},\"query\":\"mutation orderDishC($input: CreateOrderInputC!) {\\n  orderDishC(input: $input)\\n}\\n\"}`,
										"method": "POST", "mode": "cors"
									})
									.then(res => {
										console.log(res)
										client.sendMessage(-339081841, `@phanduchupdkh ban da dat mon: ${dish.name} thanh cong `).then(() => {
											console.log('sent');
										});

									})
							}
						})
				})
				.catch(err => {
					console.log(err)
				})
		})
		res.send('h')
})
app.get('/pikamobile', (req, res) => res.render('pika', { themes: 'mobile' }));
app.get('/pikabrowser', (req, res) => res.render('pika', { themes: 'browser' }));


app.listen(process.env.PORT || 3001, function () {
	console.log('Server listening on port ');
});
