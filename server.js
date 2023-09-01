import express from "express"
import cors from "cors"
import { port, formats } from "./src/config.js"
import { fetchRecords } from "./src/service.js"

const app = express()
app.use(cors())
app.set("json spaces", 2)

export const apiHandler = async (req, res, next) => {
  const { dbkey, flags } = req.params
  const { ids, format, download, email, delim } = req.query
  const { struct } = formats[format] || {}

  // validate query
  var message
  if (flags && !flags.match(/^(!xpn=(offline|online)|!levels=[012](,[012])*)+$/)) {
    message = `Invalid flags: ${flags}`
  } else if (!ids) {
    message = "Missing query parameter: id"
  } else if (!format) {
    message = "Missing query parameter: format"
  } else if (!formats[format]) {
    message = `Unknown format: ${format}`
  } else if (download && email) {
    message = "Please provide at most one of download and email!"
  } else if (email) {
    message = "Email not implemented yet!"
  } else if (struct === "xml" && delim && !delim.match(/^[a-zA-Z_]+$/)) {
    message = `Invalid XML root element name: ${delim}`
  }
  if (message) {
    const error = new Error(message)
    error.code = 400
    return next(error)
  }

  // TODO: maximum number of PPNs?
  const ppns = ids.split(/\n|\s|,|\|/).filter(id => id.match(/^[0-9]+[Xx]?$/))

  // TODO: add parameter to ignore errors for missing PPNs
  await fetchRecords({ dbkey, flags, ppns, format })
    .then(records => prepareResponse(records, format, delim))
    .then(({ type, data }) => {
      if (download) {
        const filename = `${download}-${format}.${struct||"txt"}`
        res.set({"Content-Disposition":`attachment; filename="${filename}"`})
        res.send(struct == "json" && !delim ? JSON.stringify(data) : data)
      } else if (struct === "json") {
        res.json(data)
      } else {
        res.contentType(type)
        res.send(data)
      }
    })
    .catch(e => next(e))
}

// api
app.get("/:dbkey([a-zAZ0-9-]+):flags(!\\S*)?", apiHandler)
app.post("/:dbkey([a-zAZ0-9-]+):flags(!\\S*)?", apiHandler)

// info page on root
app.set("views", "./views")
app.set("view engine", "ejs")
app.get("/", (req, res) => {
  res.setHeader("Content-Type", "text/html")
  res.render("index", { title: "rdAPI prototype", formats })
})


function prepareResponse(data, format, delim) {
  const { type, struct } = formats[format]
  if (struct == "json") {
    if (delim) {
      return {
        type: "application/x-ndjson",
        data: data.map(record => JSON.stringify(record)).join("\n"),
      }
    } else {
      return { type, data }
    }
  } else if (struct === "xml") {
    data = data.join("\n\n")
    if (delim) {     
      data = data.replaceAll(/^<\?xml .+?>/mg,"") // remove XML header
      return { type, data: ` <?xml version="1.0" ?>
<${delim}>
${data}
</${delim}>`, 
      }
    } else {
      return { type: "text/plain", data }
    }
  } else {
    return { type, data: data.join(delim || "\n\n") }
  }
}

// error handling
app.use((error, req, res, next) => // eslint-disable-line 
  res.status(error.code || 500)
    .json({ message: error.message, code: error.code || 500 }))

// start the server
app.listen(port, () => console.log(`Started rdAPI prototype at http://localhost:${port}/`))

export { app }
