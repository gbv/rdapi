import axios from "axios"

export const unAPI = "https://unapi.k10plus.de/"
export const unapiConfig = "https://kxpapiwww.k10plus.de/unapi/"
export const port = "7665"

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
