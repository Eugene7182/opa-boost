import { Router } from "express"
import { db } from "../db"

const r = Router()

r.get("/", async (_req, res) => {
  const users = await db.legacyUser.findMany({
    take: 50,
    orderBy: { id: "desc" }
  })
  res.json(users)
})

export default r
