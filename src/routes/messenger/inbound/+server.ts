import type { RequestHandler } from '@sveltejs/kit'
import { getProfile, createProfile } from '$lib/server/services/db';
import { toolsFunc } from '$lib/server/services/tools';
import TwilioSDK from 'twilio';


const disclaimerReminderMessageCount = 200

export const POST: RequestHandler = async (event) => {

    console.log("message recieved")

    const { Body, From } = await event.request.json()


    const twimlResponse = new TwilioSDK.twiml.MessagingResponse();
    console.log("--- recieved fb messenger")

    let profile = await getProfile(From)

    // ****
    if (profile == null) {
        profile = await createProfile(From)
    }
    if (Body.toLowerCase() == "country") {
        toolsFunc["country"](profile, "CA")
    }
    if (Body.toLowerCase() == "search") {
        toolsFunc["search"](profile, "headphones")
    }
    if (Body.toLowerCase() == "report") {
        toolsFunc["report"](profile, "problem content test")
    }

    return new Response(twimlResponse.toString(), {
        headers: {
        'Content-Type': 'application/xml',
        },
    });
    // ****


    // if(profile == null){
    //     profile = await createProfile(fromFBId)
    //     await submitMessage(profile, MessageRole.NON_AI, MessageDir.INBOUND, body)
    //     await submitMessage(profile, MessageRole.NON_AI, MessageDir.OUTBOUND, "Welcome to here, Disclaimer, Instruction")
    //     // submitMessage(profile, MessageRole.NON_AI, MessageDir.OUTBOUND, "Country")
    //     return res.type('text/xml').send(twimlResponse.toString());
    // }

    // await submitMessage(profile, MessageRole.USER, MessageDir.INBOUND, body)

    // console.log("--- user message saved")

    // if(profile._count.messages>0 && profile._count.messages % disclaimerReminderMessageCount == 0){
    //     submitMessage(profile, MessageRole.ASSISTANT, MessageDir.OUTBOUND, "Disclaimer")
    // }

    // callCompletion(req.app.locals.config, profile)

    // res.type('text/xml').send(twimlResponse.toString());
    // return new Response();
};