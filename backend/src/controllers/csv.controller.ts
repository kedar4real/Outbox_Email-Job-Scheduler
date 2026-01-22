import { Response, NextFunction } from "express";

import { RequestWithUser } from "../types/common.types";
import { ValidationError } from "../utils/errors";
import { logger } from "../utils/logger";

type CsvValidationResult = {
  total: number;
  valid: string[];
  invalid: string[];
  duplicates: number;
};

const parseEmailList = (emails: string[]): CsvValidationResult => {
  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();
  let duplicates = 0;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    if (!emailRegex.test(email)) {
      invalid.push(raw);
      continue;
    }
    if (seen.has(email)) {
      duplicates += 1;
      continue;
    }
    seen.add(email);
    valid.push(email);
  }

  return {
    total: emails.length,
    valid,
    invalid,
    duplicates
  };
};

const parseCsvBuffer = (csvText: string): string[] => {
  return csvText
    .split(/\r?\n/)
    .map((line) => line.split(","))
    .flat()
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

/**
 * Validates CSV input or email array without persisting data.
 */
const validateCsv = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const rawEmails = req.body?.emails as string[] | undefined;

    let emails: string[] = [];

    if (file?.buffer) {
      const csvText = file.buffer.toString("utf-8");
      emails = parseCsvBuffer(csvText);
    } else if (Array.isArray(rawEmails)) {
      emails = rawEmails;
    } else {
      throw new ValidationError("No CSV file or email list provided", "CSV_INPUT_MISSING");
    }

    const result = parseEmailList(emails);
    logger.info({ userId: req.user.userId, total: result.total }, "CSV validated");

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, "CSV validation failed");
    next(error);
  }
};

export { validateCsv };
