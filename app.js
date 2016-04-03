'use strict'

const express = require("express")
const pgp = require('pg-promise')()
var Search = require('bing.search')
var util = require('util')

const app = express()
let search = new Search('')

const cn = {
    host: '',
    port: 5432,
    database: '',
    user: '',
    password: ''
}
let db = pgp(cn)

app.use(express.static('.'))
app.get("/api/imagesearch/:search", addHistory)
app.get('/api/latest/imagesearch/', getHistory)

app.listen(process.env.PORT || 80, function(){
	console.log('server listening')
})


function addHistory(req, res){
    db.one({
        name: "add-history",
        text: "INSERT INTO his(url, time) VALUES($1, $2) returning url, time",
        values: [req.params.search, new Date()]
     })
    .then(function(data){
        search.images(req.params.search,{top: req.params.offset || 10},function(err, results){
            res.send(results.map(function(data){
                return {
                    url: data.url,
                    snippet: data.title,
                    thumbnail: data.thumbnail.url,
                    context: data.sourceUrl
                }
            }))
        })
    })
    .catch(function(error){
        res.end(error)
    })
}

function getHistory(req, res){
    db.any({
        name: "get-url",
        text: "SELECT url,time FROM his", 
    })
    .then(function(data){
        res.send(data.reverse().map(function(data){
            return {
                term: data.url,
                when: data.time
            }
        }))
    })
    .catch(function(error){
        res.end(error)
    })
}
