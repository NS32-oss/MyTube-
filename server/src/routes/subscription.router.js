import { Router } from "express";
import {
  toggleSubscription,
  subscriberList,
  subscribedToList,
  countSubscribedTo,
  countSubscribers
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router
  .route("/toggleSubscription/:channelId")
  .post(verifyJWT, toggleSubscription);
router.route("/getSubscriberList/:channelId").get(subscriberList);
router.route("/getSubscribedToList").get(verifyJWT,subscribedToList);
router.route("/count-subscribers/:channelId").get(verifyJWT,countSubscribers);
router.route("/count-subscribed-to").get(verifyJWT,countSubscribedTo);

export default router;
