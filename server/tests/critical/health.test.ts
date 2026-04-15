import request from "supertest";
import app from "../../interfaces/app.js";

describe("GET /api/v1/health", () => {
  it("should return health payload", async () => {
    const response = await request(app).get("/api/v1/health");

    expect([200, 503]).toContain(response.status);

    expect(response.body).toEqual(
      expect.objectContaining({
        status: expect.any(String),
        uptime: expect.any(Number),
        environment: expect.any(String),
        timestamp: expect.any(String),
        services: expect.objectContaining({
          database: expect.any(String),
          redis: expect.any(String),
        }),
      })
    );
  });
});