import axios from "axios"
import portfinder from "portfinder"
import nodemailer from "nodemailer"

export const env = process.env.NODE_ENV || "development"

if (env !== "test") await import("dotenv/config")

export const debug = process.env.DEBUG
export const unAPI = process.env.UNAPI || "https://unapi.k10plus.de/"
export const formatsURL = process.env.FORMATS || "https://kxpapiwww.k10plus.de/unapi/formats"

export const port = env === "test" ?
  await portfinder.getPortPromise() : process.env.PORT || "7665"

export const mailer = (({SMTP,PASS}) => {
  const match = SMTP ? SMTP.match(/^(.+)@([^:]+)(:(\d+))?$/) : undefined
  if (!match) {
    console.warn("Missing or invalid SMTP configuration! Disabling email feature.")
  } else if(!PASS) {
    console.warn("Missing PASS for SMPT! Disabling email feature.")
  } else {
    const [_, user, host, __, port] = match // eslint-disable-line
    return nodemailer.createTransport({
      host, port: port || 587, secure: port != 25,
      auth: { user, pass: PASS },
    })
  }
})(process.env)

export const formats = await axios(formatsURL).then(({data}) => {
  for (let key of Object.keys(data).filter(key => !key.match(/^[a-z][a-z0-9-]*$/))) {
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
