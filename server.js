import express from "express"
import cors from "cors"
import { port, formats } from "./src/config.js"
import { fetchRecords } from "./src/service.js"

const app = express()
app.use(cors())
app.set("json spaces", 2)

app.get("/:dbkey([a-zAZ0-9-]+):flags(!\\S+)?", async (req, res, next) => {
  const { dbkey, flags } = req.params
  const { ids, format, method, mailto, delim } = req.query

  // validate query
  var message
  if (!dbkey) {
    message = `Missing database key!`
  } else if (flags && !flags.match(/^(!xpn=(offline|online)|!levels=[012](,[012])*)+$/)) {
    message = `Invalid flags: ${flags}`
  } else if (!ids) {
    message = "Missing query parameter: id"
  } else if (!format) {
    message = "Missing query parameter: format"
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

  // TODO: add parameter to ignore errors
  await fetchRecords({ dbkey, flags, ppns, format })
    .then(records => {
      const { type, data } = prepareResponse(records, formats[format].type, delim)

      // TODO: support specified method to deliver (download, email, print...)

      if (type.match(/^application\/json/)) {
        res.json(data)
      } else {
        res.contentType(type)
        res.send(data)
      }
    })
    .catch(e => next(e))
})

// Configure view engine to render EJS templates.
app.set("views", "./views")
app.set("view engine", "ejs")

// info page on root
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.render("index", { title: "rdAPI prototype", formats })
})


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
  res.status(error.code || 500)
    .json({ message: error.message, code: error.code || 500 }))

// start the server
app.listen(port, () => console.log(`Started rdAPI prototype at http://localhost:${port}/`))
