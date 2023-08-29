import express from "express"
import cors from "cors"
import { port, formats } from "./config.js"
import { fetchRecords } from "./service.js"

const app = express()
app.use(cors())
app.set("json spaces", 2)

app.get("/:dbkey", async (req, res, next) => {

  // TODO: flags: xpn, levels
  const { dbkey } = req.params
  const { ids, format, method, mailto, delim } = req.query

  // check query
  var message
  if (!ids || !format) {      
    message = "Missing query parameter!"
  } else if (!dbkey || !dbkey.match(/^[a-z0-9-]+$/)) {      
    message = `Missing or invalid database key: ${dbkey}`
  } else if (!formats[format]) {
    message = `Unknown format: ${format}`
  }
  // TODO: check valid XML root name for XML formats
  if (message) {
    const error = new Error(message)
    error.status = 400
    return next(error)
  }

  // TODO: maximum number of PPNs?
  const ppns = ids.split(/\n|\s|,|\|/).filter(id => id.match(/^[0-9]+[Xx]?$/))

  // TODO: catch error of this call (also timeout)
  const records = await fetchRecords({ dbkey, ppns, format })
  const { type, data } = prepareResponse(records, formats[format].type, delim)

  // TODO: support specified method to deliver (download, email, print...)

  if (type.match(/^application\/json/)) {
    res.json(data)
  } else {
    res.contentType(type)
    res.send(data)
  }

})

// TODO: info page on root
// app.get("/")

function prepareResponse(data, type, delim) {
  if (type.match(/^application\/json/)) {
    if (delim) {
      return {
        type: "application/x-ndjson",
        data: data.map(record => JSON.stringify(record)).join("\n")
      }
    } else {
      return { type, data }
    }
  } else if (type.match(/^application\/xml/)) {
    data = data.join("\n\n")
    if (delim) { 
      return { type, data: `<${delim}>${data}</${delim}>` }
    } else {
      return { type: 'text/plain', data }
    }
  } else {
    return { type, data: data.join(delim || "\n\n") }
  }
}

// error handling
app.use((error, req, res, next) => 
  res.status(error.code || 500).json({ message: error.message, code: error.code || 500 }))

// start the server
app.listen(port, () => console.log(`Started rdAPI prototype at http://localhost:${port}/`))
