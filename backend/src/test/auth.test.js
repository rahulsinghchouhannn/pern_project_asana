const request = require("supertest");
const app = require("../app");

describe("Auth - Failure Cases", () => {
  it("should return 400 for missing email field", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "password123", name: "Test User" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeTruthy();
  });

  it("should return 400 for invalid email format (Zod)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "password123", name: "Test User" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("Invalid email");
  });

  it("should return 400 for password too short (Zod)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@example.com", password: "short", name: "Test User" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain("8 characters");
  });

  it("should return 400 for missing login password field", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for missing login email field", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "password123" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for missing auth token on protected route", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Access token required");
  });

  it("should return 401 for invalid/malformed token", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer invalidtoken.malformed.here");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 400 for empty request body on register", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
