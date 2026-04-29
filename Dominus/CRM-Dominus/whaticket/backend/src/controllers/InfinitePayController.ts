import { Request, Response } from "express";

export const webhook = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log("=============== INFINITEPAY WEBHOOK RECEBIDO ===============");
    console.log(JSON.stringify(req.body, null, 2));
    console.log("=========================================================");

    // Retorna 200 rápido para a InfinitePay não ficar tentando reenviar
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Erro no Webhook da InfinitePay:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
