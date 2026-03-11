import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeFreeJobAlert() {
  const url = "https://www.freejobalert.com/latest-notifications/";
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);
  const jobs: any[] = [];

  $("table tr").each((_, el) => {
    const title = $(el).find("td a").text().trim();
    const link = $(el).find("td a").attr("href");

    if (title && link) {
      jobs.push({
        title,
        department: "Government",
        qualification: "",
        location: "India",
        last_date: "",
        apply_link: link,
        source: "freejobalert"
      });
    }
  });
  return jobs;
}