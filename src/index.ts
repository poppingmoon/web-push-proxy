import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { sendNotification } from "./apns";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.post("/apns/:account/:token", async (c) => {
  const account = c.req.param("account");
  const deviceToken = c.req.param("token");
  if (!/^[0-9a-fA-F]+$/.test(deviceToken)) {
    throw new HTTPException(410);
  }
  const body = await c.req.arrayBuffer();
  try {
    await sendNotification(account, body, deviceToken, c.env);
    return c.body(null, 204);
  } catch (e) {
    const status = (e as Response).status;
    switch (status) {
      case 401 | 403 | 404 | 410:
        throw new HTTPException(410);
    }
    throw new HTTPException();
  }
});

export default app;
