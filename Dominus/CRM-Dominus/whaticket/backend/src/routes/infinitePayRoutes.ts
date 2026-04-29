import { Router } from "express";
import * as InfinitePayController from "../controllers/InfinitePayController";

const infinitePayRoutes = Router();

// Endpoint que a InfinitePay vai chamar
infinitePayRoutes.post("/webhook", InfinitePayController.webhook);

export default infinitePayRoutes;
