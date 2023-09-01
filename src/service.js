import axios from "axios"
import { unAPI } from "./config.js"

// expects valid PPN ids and known format
export const fetchRecords = async ({ dbkey, flags, ppns, format }) => Promise.all(ppns.map(ppn => {
  flags = flags ? flags.replaceAll("=","%3D") : ""
  const url = `${unAPI}?id=${dbkey}${flags}:ppn:${ppn}&format=${format}`
  // console.log(url)
  return axios.get(url)
    .then(res => res.data)
    .catch(e => {
      // TODO: other kinds of errors won't include data
      // TODO: allow to ignore errors
      const msg = e?.response?.data
      if (msg) {
        throw new Error(msg)
      } else {
        return null
      }
    })
})).then(res => res.filter(Boolean))
