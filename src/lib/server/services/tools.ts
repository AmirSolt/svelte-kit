import type { OpenAI } from "openai";
import { submitMessage, submitTicket } from "./communications";
import type { MProfile } from "../../customTypes";
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
            description: "Search amazon for discounts and coupons. Use this tool when user asks to search a keyword",
            parameters: {
                type: "object",
                properties: {
                    searchTerm: { type: "string", description: "The search term." },
                },
                required: ["searchTerm"]
            }
        }
    },
    // {
    //     type: "function",
    //     function: {
    //         name: "country",
    //         description: "update user's country for tailored search results.",
    //         parameters: {
    //             type: "object",
    //             properties: {
    //                 countryCode: { type: "string", description: "Two letter country code in ISO 3166-1 alpha-2. Convert to two letter code if needed." },
    //             },
    //             required: ["countryCode"]
    //         }
    //     }
    // },
    {
        type: "function",
        function: {
            name: "report",
            description: "Reports a problem directly to the developer. Only report if the user really needs a human to help.",
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
        const searchMetadata:{
            amazonSearchUrl:string
            products:Product[]
        }|null = await amazon.search(domain, searchTerm, true)
        if(searchMetadata==null){
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
            searchMetadata.products.map(p=>p.asin),
            searchMetadata.amazonSearchUrl,
            JSON.stringify(searchMetadata.products)
        )

        await submitMessage(
            config,
            profile,
            MessageRole.ASSISTANT,
            MessageDir.OUTBOUND,
            `Search Results:\n ${process.env.DOMAIN}/search/${search.id}`,
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
            `Country updated to ${countryCode}.\n\n`,
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
            "A human was notified to assist you.",
        )
    }
};