import axios from "axios";
import { load } from "cheerio";

// Local type — only used in this file
interface JobDetail {
  summary?: string;
  lastDate?: string;
}

function extractLastDate(text: string): string | undefined {
  const dateMatch = text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})/);
  return dateMatch?.[1]?.trim();
}

export async function scrapeJobDetails(url: string): Promise<JobDetail> {
  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const $ = load(data);

    const summary =
      $("meta[name='description']").attr("content")?.trim() ||
      $("article p").first().text().trim() ||
      $("p").first().text().trim() ||
      undefined;

    const lastDateCellText =
      $("td:contains('Last Date')").next("td").first().text().trim() ||
      $("*:contains('Last Date')").first().parent().text().trim() ||
      "";

    const lastDate = extractLastDate(lastDateCellText);

    return { summary, lastDate };
  } catch {
    return {};
  }
}