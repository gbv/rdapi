import axios from "axios"
import portfinder from "portfinder"

export const env = process.env.NODE_ENV || "development"
export const unAPI = "https://unapi.k10plus.de/"
export const unapiConfig = "https://kxpapiwww.k10plus.de/unapi/"

const getPort = async port => {
  if (env == "test") {
    portfinder.basePort = port
    return portfinder.getPortPromise()
  } else {
    return port
  }
}
export const port = await getPort("7665")



// TODO


export const formats = await axios(`${unapiConfig}formats`).then(({data}) => {
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
