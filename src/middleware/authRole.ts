import type { Request, Response, NextFunction } from "express";

type RoleName = string;

type RequestWithUser = Request & { user?: { role?: RoleName } };

/**
 * Middleware-фабрика, проверяющая роль аутентифицированного пользователя.
 * Возвращает 403, если роль не входит в список разрешённых.
 */
export function requireRole(...allowed: RoleName[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole || !allowed.includes(userRole)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }
    return next();
  };
}
