const express = require('express')
const app = express()
const path = require('path')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken');
const fs = require('fs')
const axios = require('axios')
const querystring = require('querystring')
const dotenv = require('dotenv');
dotenv.config();

const getClientSecret = () => {
	// get private key
	const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_FILE_PATH);
	const headers = {
		kid: process.env.KEY_ID,
		alg: "ES256" 
	}
	const claims = {
		'iss': process.env.TEAM_ID,
		'aud': 'https://appleid.apple.com',
		'sub': process.env.CLIENT_ID,
	}

	token = jwt.sign(claims, privateKey, {
		algorithm: 'ES256',
		header: headers,
		expiresIn: '24h'
	});

	return token
}

const decodeToken = (token) => {
	const parts = token.split('.')
	try {
		return JSON.parse(new Buffer(parts[1], 'base64').toString('ascii'))
	} catch (e) {
		return null
	}
}

app.post('/', bodyParser.urlencoded({ extended: false }), (req, res) => {
	const clientSecret = getClientSecret()
	const requestBody = {
		grant_type: 'authorization_code',
		code: req.body.code,
		client_id: process.env.CLIENT_ID,
		client_secret: clientSecret,
	}
	axios.request({
		method: "POST",
		url: "https://appleid.apple.com/auth/token",
		data: querystring.stringify(requestBody),
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
	}).then(response => {
		return res.json({
			success: true,
			data: response.data,
			user:decodeToken(response.data.id_token)
		})
	}).catch(error => {
		return res.status(500).json({
			success: false,
			error: error.response.data
		})
	})
})


app.listen(process.env.PORT || 3000, () => console.log(`App listening on port ${process.env.PORT || 3000}!`))