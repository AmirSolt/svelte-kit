import type { OpenAI } from "openai";
import { submitMessage, submitTicket } from "./communications";
import type { MProfile, SearchResponse } from "../../customTypes";
import { MessageDir, MessageRole, type Config } from "@prisma/client";
import { createSearch, updateProfileCountry } from "./db";
import { amazon } from "../clients/amazon";
import * as dotenv from 'dotenv'
dotenv.config()


if (process.env.DOMAIN == null) {
    throw new Error('missing DOMAIN');
}


export const toolsObjects: OpenAI.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "search_discounts",
            description: "The tool searches amazon for discounts and coupons. Only search if the user explicitly tells you to 'search ...'",
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
            name: "country",
            description: "update user's country for better search results. Default country is US.",
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
            name: "report",
            description: "Reports a problem directly to the developer. Only report if user needs a human to help.",
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





    // ================================================
    search_discounts: async (config:Config, profile:MProfile, inputArgs:{searchTerm:string}) => {

        const {searchTerm} = inputArgs

        console.log("Search tool:",searchTerm)
        await submitMessage(
            config,
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            "searching... (one minute)",
        );
  
        
        const domain = amazon.countryToDomain(profile.country_code)
        const searchResponse:SearchResponse|null = await amazon.search(domain, searchTerm, true)
        if(searchResponse==null){
            await submitMessage(
                config,
                profile,
                MessageRole.ASSISTANT,
                MessageDir.OUTBOUND,
                "Failed to get search results",
            );
            return
        }


        const search = await createSearch(
            config,
            profile,
            searchTerm,
            searchResponse.search_results.map(sr=>sr.asin),
            searchResponse.request_metadata.amazon_url,
            JSON.stringify(searchResponse.search_results)
        )

        await submitMessage(
            config,
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            `Search Results:\n ${process.env.DOMAIN}/search_analytics/${search.id}`,
        );
    },

    // ================================================
    country: async (config:Config, profile:MProfile, inputArgs:{countryCode:string}) => {
        const {countryCode} = inputArgs

        console.log("Country tool:",countryCode)
        profile = await updateProfileCountry(
            profile,
            countryCode
        )
        submitMessage(
            config,
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            `Country updated to ${countryCode}.\n\n❓To search our discounts & coupons, type "Search [keyword]". for example:\n "Search shoes" or "Search shoes for kids"`,
        );
    },

    // ================================================

    report: async (config:Config, profile:MProfile, inputArgs:{reportContent:string}) => {

        const {reportContent} = inputArgs

        console.log("Report tool:",reportContent)

        await submitTicket(
            config,
            profile,
            reportContent,
        )
        await submitMessage(
            config,
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            "A human will review your report, shortly.",
        )
    }
};