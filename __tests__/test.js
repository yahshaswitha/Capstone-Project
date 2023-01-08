/* eslint-disable no-undef */
const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/login").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Election Portal", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/elections").send({
      firstName: "yahshashwitha",
      lastName: "sirineni",
      email: "yahshashwitha.sirineni@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Login", async () => {
    const agent = request.agent(server);
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
    await login(agent, "yahshashwitha.sirineni@gmail.com", "12345678");
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
  });
  test("Signout", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });
  test("Crreating new election", async () => {
    const agent = request.agent(server);
    await login(agent, "yahshashwitha.sirineni@gmail.com", "12345678");
    const res = await agent.get("/elections/new");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/elections").send({
      name: "Test Election",
      customurl: "testelection",
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });
});
