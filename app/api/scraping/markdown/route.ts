import cheerio from "cheerio";
import TurndownService from "turndown";

import { checkApiKey } from "@/lib/dto/api-key";
import { isLink, removeUrlSuffix } from "@/lib/utils";

export const revalidate = 600;

const turndownService = new TurndownService();

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const link = url.searchParams.get("url");
    if (!link || !isLink(link)) {
      return Response.json(
        { statusText: "Url is required" },
        {
          status: 400,
        },
      );
    }

    // Get the API key from the request
    const custom_apiKey = url.searchParams.get("key");
    if (!custom_apiKey) {
      return Response.json(
        {
          statusText:
            "API key is required. You can get your API key from Dashboard->Settings.",
        },
        { status: 400 },
      );
    }

    // Check if the API key is valid
    const user_apiKey = await checkApiKey(custom_apiKey);
    if (!user_apiKey?.id) {
      return Response.json(
        {
          statusText:
            "Invalid API key. You can get your API key from Dashboard->Settings.",
        },
        { status: 401 },
      );
    }

    const res = await fetch(link);
    if (!res.ok) {
      return Response.json(
        { statusText: "Failed to fetch url" },
        {
          status: 405,
        },
      );
    }

    const html = await res.text();

    const $ = cheerio.load(html);

    $("script").remove();
    $("style").remove();
    $("nav").remove();
    $("footer").remove();

    const mainContent = $("main").length ? $("main").html() : $("body").html();

    const markdown = turndownService.turndown(mainContent || "");

    return Response.json({
      url: link,
      content: markdown,
      format: "markdown",
      timestamp: Date.now(),
      payload: `https://wr.do/api/scraping/markdown?url=${link}&key=${custom_apiKey}`,
    });
  } catch (error) {
    console.log(error);
    return Response.json(
      { statusText: "Server error" },
      {
        status: 500,
      },
    );
  }
}
