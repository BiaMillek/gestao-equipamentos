import { NextFunction, Request, Response, Router } from "express";
import { businessRules, runRule } from "../docs/businessRules";

const router = Router();

// Os cenários gravam (e depois apagam) registros no banco: bloqueados em produção.
function guard(_req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === "production")
    return res
      .status(403)
      .json({ error: "Testes de regras de negócio desabilitados em produção" });
  next();
}

router.get("/", (_req, res) => {
  res.json(
    businessRules.map(({ id, entidade, regra, esperado }) => ({
      id,
      entidade,
      regra,
      esperado,
    })),
  );
});

router.post("/executar", guard, async (_req, res, next) => {
  try {
    const resultados = [];
    for (const rule of businessRules) resultados.push(await runRule(rule)); // um por vez (mesmo banco)
    const aprovadas = resultados.filter((r) => r.passou).length;
    res.json({
      sucesso: aprovadas === resultados.length,
      total: resultados.length,
      aprovadas,
      reprovadas: resultados.length - aprovadas,
      resultados,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/:regra", guard, async (req, res, next) => {
  try {
    const rule = businessRules.find((r) => r.id === req.params.regra);
    if (!rule) return res.status(404).json({ error: "Regra não encontrada" });
    res.json(await runRule(rule));
  } catch (e) {
    next(e);
  }
});

export default router;
