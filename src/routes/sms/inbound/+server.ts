import type { RequestHandler } from '@sveltejs/kit'
import { getProfile, createProfile, createMessage } from '$lib/server/services/db';
import { toolsFunc } from '$lib/server/services/tools';
import TwilioSDK from 'twilio';
import type { Config } from '@prisma/client';
import { submitMessage,  } from '$lib/server/services/communications';
import { MessageRole, MessageDir } from '@prisma/client';
import { callCompletion } from '$lib/server/services/assistance';



const welcomeMessage = `🎉 Welcome to Clearance Chatbot! Where you can search through thousands of Amazon discounts & coupons.`
const disclaimerMessage = `📝 Please note: This chatbot uses AI to respond to your queries.`
const tutorialMessage = `🔍 To search follow the example: "Search running shoes" `
const introMessage = `${welcomeMessage}\n\n${disclaimerMessage}\n\n${tutorialMessage}`

export const POST = async (event) => {
    const twimlResponse = new TwilioSDK.twiml.MessagingResponse();

    try{
        console.log("message recieved")

        const config:Config = event.locals.config

        const text = await event.request.text();
        const params = Object.fromEntries(new URLSearchParams(text));
        const { Body, From } = params

        console.log("--- recieved fb messenger")

        let profile = await getProfile(config, From)

        if(profile == null){
            profile = await createProfile(config, From)
            await submitMessage(config, profile, MessageRole.NON_AI, MessageDir.INBOUND, Body)
            await submitMessage(config, profile, MessageRole.NON_AI, MessageDir.OUTBOUND, introMessage)
        
            
            return new Response(twimlResponse.toString(), {
                headers: {
                'Content-Type': 'application/xml',
                },
            });
        }

        await submitMessage(config, profile, MessageRole.USER, MessageDir.INBOUND, Body)
    
        console.log("--- user message saved")

        if(profile._count.messages>0 && profile._count.messages % config.disclaimer_repeat_message_count == 0){
            submitMessage(config, profile, MessageRole.ASSISTANT, MessageDir.OUTBOUND, "Disclaimer")
        }

        callCompletion(config, profile)

        return new Response(twimlResponse.toString(), {
            headers: {
            'Content-Type': 'application/xml',
            },
        });

    }catch(error){
        await handleError(event, error)

        return new Response(twimlResponse.toString(), {
            headers: {
            'Content-Type': 'application/xml',
            },
        });

    }
};






async function handleError(event:any, error:unknown){
    console.log("hooks.server.ts:handleError -> ",event.url, error)

    const config = event.locals.config

    const text = await event.request.text();
    const params = Object.fromEntries(new URLSearchParams(text));
    const { Body, From } = params

    let profile = await getProfile(config, From)
    if (profile == null) {
        console.log("hooks.server.ts: Could not find profile within error handling")
        return {message:"hooks.server.ts: Could not find profile within error handling"}
    }

    await submitMessage(
        config,
        profile,
        MessageRole.ASSISTANT,
        MessageDir.OUTBOUND,
        `Error: Server encountered an error. If the error is severe, you can notify the developer like so "report ...".`,
    );
}