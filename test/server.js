import chai from "chai"
import chaiHttp from "chai-http"
chai.use(chaiHttp)
import assert from "assert"

import { app } from "../server.js"

const errors = {
  "/opac-de-627.xy": { 
    code: 400, message: "Missing query parameter: id", 
  },
  "/opac-de-627!x.xy": {
    code: 400, message: "Invalid flags: !x",
  },
  "/opac-de-627.xx?id=123": {
    code: 400, message: "Unknown format: xx",
  },
  "/opac-de-627.pp?id=123&download=1&email=a@b.c": {
    code: 400, message: "Please provide at most one of download and email!",
  },
  "/opac-de-627.pp?id=123&email=?": {
    code: 400, message: "Invalid email address",
  },
  "/opac-de-627.pp?id=123&email=a@b.c": {
    code: 400, message: "Sending records by email has not been enabled!",
  },
}

describe("server", () => {
  it("/ should return HTML on root",
    () => chai.request(app).get("/")
      .then(res => {
        assert.equal(res.status,200)
      }))
  it("/_ should return 404",
    () => chai.request(app).get("/_")
      .then(res => assert.equal(res.status,404)))
})

describe("request", () => {
  for (const [query, error] of Object.entries(errors)) {
    it(`${query} should return error ${error.code}`,
      () => chai.request(app).get(query)
        .then(res => {
          assert.equal(res.status,error.code)
          assert.deepEqual(res._body,error)
        }))
  }
})
