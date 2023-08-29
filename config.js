import axios from "axios"

export const unAPI = "https://unapi.k10plus.de/"
export const unapiConfig = "https://kxpapiwww.k10plus.de/unapi/"
export const port = "7665"

export const formats = await axios(`${unapiConfig}formats`).then(({data}) => {
  console.log(`Configured with ${Object.keys(data).length} formats`)
  return data
})
