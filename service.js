import { unAPI } from "./config.js"
import axios from "axios"

// expects valid PPN ids and known format
export const fetchRecords = async ({ dbkey, ppns, format }) => Promise.all(ppns.map(ppn =>
  axios.get(`${unAPI}?id=${dbkey}:ppn:${ppn}&format=${format}`)
    .then(res => res.data)
    .catch(e => null) // TODO: throw exception depending on error type?
)).then(res => res.filter(Boolean))
