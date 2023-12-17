import type { RequestHandler } from "@sveltejs/kit";
import TwilioSDK from 'twilio';



export const POST: RequestHandler = async (event) => {
    const { Body, From } = await event.request.json()
    const twimlResponse = new TwilioSDK.twiml.MessagingResponse();
    console.log("---  fb messenger failed")
    console.log(`body: ${Body}, from ${From}`)
    console.log("-------------------")

    // submit a message and say sorry
    // submitMessage()


    return new Response(twimlResponse.toString(), {
        headers: {
        'Content-Type': 'application/xml',
        },
    });
};