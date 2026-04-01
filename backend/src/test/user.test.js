const request = require("supertest");
const app = require("../app");

describe("User - Failure Cases", () => {
  it("should return 401 when accessing /me without token", async () => {
    const res = await request(app).get("/api/users/me");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Access token required");
  });

  it("should return 401 when accessing users list without token", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for malformed Bearer token on /me", async () => {
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer malformed.token.here");
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("should return 401 for expired token simulation", async () => {
    const jwt = require("jsonwebtoken");
    const expiredToken = jwt.sign(
      { id: "some-id", email: "test@example.com" },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: -1 }
    );
    const res = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe("Token expired");
  });
});
