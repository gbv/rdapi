import axios from "axios"
import { unAPI, debug } from "./config.js"

// expects valid PPN ids and known format
export const fetchRecords = async ({ dbkey, flags, ppns, format }) => Promise.all(ppns.map(ppn => {
  const allFlags = flags ? flags.map(f => "!"+f.replaceAll("=","%3D")).join("") : ""
  const url = `${unAPI}?id=${dbkey}${allFlags}:ppn:${ppn}&format=${format}`
  if (debug) {
    console.log(url)
  }
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
