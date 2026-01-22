import { Response, NextFunction } from "express";

import { CampaignService } from "../services/campaign.service";
import { RequestWithUser } from "../types/common.types";
import { logger } from "../utils/logger";

const campaignService = new CampaignService();

/**
 * Creates a new campaign for the authenticated user.
 */
const createCampaign = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const campaign = await campaignService.createCampaign(userId, req.body);
    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    logger.error({ error }, "Create campaign failed");
    next(error);
  }
};

/**
 * Lists campaigns for the authenticated user.
 */
const getCampaigns = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const campaigns = await campaignService.getCampaigns(userId, req.query as any);
    res.status(200).json({ success: true, data: campaigns });
  } catch (error) {
    logger.error({ error }, "Get campaigns failed");
    next(error);
  }
};

/**
 * Returns a campaign by id for the authenticated user.
 */
const getCampaignById = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const campaign = await campaignService.getCampaignById(req.params.id, userId);
    res.status(200).json({ success: true, data: campaign });
  } catch (error) {
    logger.error({ error }, "Get campaign failed");
    next(error);
  }
};

/**
 * Returns a timeline of events for a campaign.
 */
const getCampaignTimeline = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.user.userId;
    const limit = Number(req.query.limit ?? 200);
    const timeline = await campaignService.getCampaignTimeline(req.params.id, userId, limit);
    res.status(200).json({ success: true, data: timeline });
  } catch (error) {
    logger.error({ error }, "Get campaign timeline failed");
    next(error);
  }
};

export { createCampaign, getCampaigns, getCampaignById, getCampaignTimeline };
