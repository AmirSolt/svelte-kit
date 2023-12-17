import type { OpenAI } from "openai";
import { submitMessage, submitTicket } from "./communications";
import type { MProfile, SearchResponse } from "../clients/customTypes";
import { MessageDir, MessageRole } from "@prisma/client";
import { createSearch, updateProfileCountry } from "./db";
import { amazon } from "../clients/amazon";
import { scoreSearchResults } from "./productAnalytics";
import * as dotenv from 'dotenv'
dotenv.config()


if (process.env.DOMAIN == null) {
    throw new Error('missing DOMAIN');
}


export const toolsObjects: OpenAI.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "country",
            description: "Store user's country for better search results.",
            parameters: {
                type: "object",
                properties: {
                    countryCode: { type: "string", description: "Two letter country code in ISO 3166-1 alpha-2. Convert to two letter code if needed." },
                },
                required: ["countryCode"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search",
            description: "Searches amazon products and returns product quality/price analytics.",
            parameters: {
                type: "object",
                properties: {
                    searchTerm: { type: "string", description: "The search term." },
                },
                required: ["searchTerm"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "report",
            description: "Reports a problem directly to the developer.",
            parameters: {
                type: "object",
                properties: {
                    reportContent: { type: "string", description: "The content of the reported problem." },
                },
                required: ["reportContent"]
            }
        }
    },
]

export const toolsFunc: Record<string, any> = {

    country: async (profile:MProfile, countryCode:string) => {
        profile = await updateProfileCountry(
            profile,
            countryCode
        )
        submitMessage(
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            `Country set to ${countryCode}`,
        );
    },




    // ================================================
    search: async (profile:MProfile, searchTerm:string) => {
        await submitMessage(
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            "searching... (one minute)",
        );
  
        
        const domain = amazon.countryToDomain(profile.country_code)
        const searchResponse:SearchResponse|null = await amazon.search(domain, searchTerm)
        if(searchResponse==null){
            await submitMessage(
                profile,
                MessageRole.ASSISTANT,
                MessageDir.OUTBOUND,
                "Failed to get search results",
            );
            return
        }

        const search = await createSearch(
            profile,
            searchTerm,
            searchResponse.search_results.map(sr=>sr.asin),
            JSON.stringify(searchResponse.search_results)
        )

        await submitMessage(
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            `Search Analytics:\n ${process.env.DOMAIN}/search_analytics/${search.id}`,
        );
    },




    // ================================================

    report: async (profile:MProfile, reportContent:string) => {


        await submitTicket(
            profile,
            reportContent,
        )
        await submitMessage(
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            "A human will review your report shortly.",
        )
    }
};