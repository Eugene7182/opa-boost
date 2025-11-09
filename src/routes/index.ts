import { Router } from "express"
import sales from "./sales"
import stocks from "./stocks"
import refs from "./refs"
import users from "./users"

export const router = Router()
router.use("/sales", sales)
router.use("/stocks", stocks)
router.use("/refs", refs)
router.use("/users", users)
