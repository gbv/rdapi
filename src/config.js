import axios from "axios"
import portfinder from "portfinder"

export const env = process.env.NODE_ENV || "development"

if (env !== "test") await import("dotenv/config")

export const debug = process.env.DEBUG
export const unAPI = process.env.UNAPI || "https://unapi.k10plus.de/"
export const formatsURL = process.env.FORMATS || "https://kxpapiwww.k10plus.de/unapi/formats"
export const port = env === "test" ?
  await portfinder.getPortPromise() : process.env.PORT || "7665"


export const formats = await axios(formatsURL).then(({data}) => {
  // remove formats with . in its name => only for internal use
  for (let key of Object.keys(data).filter(key => key.match(/\./))) {
    delete data[key]
  }
  for (let key in data) {
    data[key].struct = data[key].type?.match(/^application\/(xml|json)/)?.[1]
  }
  console.log(`Configured with ${Object.keys(data).length} formats`)
  return data
})

import formatDetails from "../formats.js"
for (let [key, format] of Object.entries(formatDetails)) {
  if (formats[key]) {
    Object.assign(formats[key], format)
  } else {
    console.error(`Format ${key} not supported by ${unAPI}`)
  }
}
