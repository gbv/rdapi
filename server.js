import express from "express"
import cors from "cors"
import { port, formats, unAPI } from "./src/config.js"
import { fetchRecords } from "./src/service.js"

const app = express()
app.use(cors())
app.set("json spaces", 2)

// info page on root
app.set("views", "./views")
app.set("view engine", "ejs")
app.get("/", (req, res) => res.render("index", { 
  title: "rdAPI prototype", unAPI, formats, 
}))

// TODO: add parameter to ignore errors for missing PPNs
export const apiHandler = async (req, res, next) => {

  // parse and validate query
  const { dbkey } = req.params
  const [ format, ...flags ] = req.params.format.split(/!/)
  const { id, sep, download, email } = req.query

  var message
  var invalidFlags = flags.filter(f => !f.match(/^xpn=(offline|online)$|^levels=[012](,[012])*$/))
  if (invalidFlags.length) {
    message = `Invalid flags: !${invalidFlags.join("!")}`
  } else if (!id) {
    message = "Missing query parameter: id"
  } else if (!formats[format]) {
    message = `Unknown format: ${format}`
  } else if (download && email) {
    message = "Please provide at most one of download and email!"
  } else if (email) {
    message = "Email not implemented yet!"
  }
  if (message) {
    const error = new Error(message)
    error.status = 400
    return next(error)
  }

  // TODO: maximum number of PPNs?
  const ppns = id.split(/\n|\s|,|\|/).filter(id => id.match(/^[0-9]+[Xx]?$/))

  const query = { dbkey, flags, ppns, format, sep, download, email }
  await fetchRecords(query)
    .then(records => prepareResponse(records, query))
    .then(({ type, data }) => {
      const struct = formats[format].struct
      if (download) {
        const filename = `${download}.${format}.${struct||"txt"}`
        res.set({"Content-Disposition":`attachment; filename="${filename}"`})
        res.send(struct == "json" && !sep ? JSON.stringify(data) : data)
      } else if (struct === "json") {
        res.json(data)
      } else {
        // TODO: we might prefer text/plain for other than JSON and XML
        res.contentType(type) 
        res.send(data)
      }
    })
    .catch(e => next(e))
}

// api
app.get ("/:dbkey([a-zAZ0-9-]+).:format", apiHandler)
app.post("/:dbkey([a-zAZ0-9-]+).:format", apiHandler)

function prepareResponse(data, { format, sep }) {
  const { type, struct } = formats[format]
  if (struct == "json") {
    if (sep) {
      return {
        type: "application/x-ndjson",
        data: data.map(record => JSON.stringify(record)).join("\n"),
      }
    } else {
      return { type, data }
    }
  } else if (struct === "xml") {
    data = data.join("\n\n")
    data = data.replace(/^<\?xml .+?>/mg,"") // remove XML header
    // TODO: if .xml==0 then remove root element of reach record
    const root = formats[format].xml || "<records>"
    const end = root.match(/^<([^ >]+)/)[1]
    return { 
      type,
      data: ["<?xml version=\"1.0\"?>",root,data,`</${end}>`].join("\n"),
    }
  } else {
    return { type, data: data.join(sep || "\n\n") }
  }
}

// error handling
app.use((error, req, res, next) => // eslint-disable-line 
  res.status(error.status || 500)
    .json({ message: error.message, code: error.status || 500 }))

// start the server
app.listen(port, () => console.log(`Started rdAPI prototype at http://localhost:${port}/`))

export { app }
