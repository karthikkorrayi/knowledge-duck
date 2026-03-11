import axios from "axios"
import { load } from "cheerio"

export async function scrapeTeluguCareers() {

  const url = "https://telugucareers.com"
  const { data } = await axios.get(url)
  const $ = load(data)
  const jobs: any[] = []

  $(".entry-title a").each((i, el) => {

    const title = $(el).text().trim()
    const link = $(el).attr("href")

    if (title && link) {
      jobs.push({
        title,
        apply_link: link,
        source: "telugucareers"
      })
    }

  })

  return jobs
}