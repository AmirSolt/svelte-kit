import { client, twilioPageId, TWILIO_PHONE_NUMBER, ADMIN_NUMBER } from "../clients/twilio";
import { createMessage, createTicket } from "./db";
import { ConfigType, type Message, MessageDir, MessageRole, type Config, type Profile, type Ticket } from "@prisma/client";
import type { MProfile } from "../clients/customTypes";


const messageCharLimit = 400


export async function submitMessage(
    profile: MProfile,
    role:MessageRole,
    messageDir:MessageDir,
    content: string | null | undefined = undefined,
    extra_json: any|undefined|null=undefined,
    image_urls: string[]=[]
    ):Promise<boolean> {

    if(messageDir===MessageDir.INBOUND && content && content.length >= messageCharLimit && role!==MessageRole.TOOL){
        const newContent = `Sorry, but your message exceeds ${messageCharLimit} characters`
        // first save user message the send new message save and return false
        
        await sendMessage(profile.fb_messenger_id, newContent)
        await createMessage(
            profile,
            role,
            messageDir,
            newContent,
            extra_json
        )
        
    }


    if(messageDir===MessageDir.OUTBOUND && content && role!==MessageRole.TOOL){
        await sendMessage(profile.fb_messenger_id, content.substring(0, messageCharLimit), image_urls)
    }

    await createMessage(
        profile,
        role,
        messageDir,
        content?.substring(0, messageCharLimit),
        extra_json,
        image_urls
    )

    return true
}



export async function submitTicket(
    profile: MProfile,
    content: string):Promise<Ticket> {

    await sendSMS(ADMIN_NUMBER, "--- Ticket: \n"+content)

    return await createTicket(profile, content)
}







async function sendMessage(sendTo: string, text: string, image_urls:string[]=[]): Promise<void> {


    try {
        const message = await client.messages.create({
            from: `messenger:${twilioPageId}`,
            body: text,
            to: sendTo,
            mediaUrl:image_urls
        });
        console.log("fb messenger sent with SID:", message.sid);
    } catch (error) {
        console.error("Failed to send fb messenger:", error);
    }
}



async function sendSMS(sendTo: string, text: string): Promise<void> {
    try {
        const message = await client.messages.create({
            from: TWILIO_PHONE_NUMBER,
            body: text,
            to: sendTo,
        });
        console.log("SMS sent with SID:", message.sid);
    } catch (error) {
        console.error("Failed to send sms:", error);
    }
}

