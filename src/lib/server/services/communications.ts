import { client, twilioPageId, TWILIO_PHONE_NUMBER, ADMIN_NUMBER } from "../clients/twilio";
import { createMessage, createTicket } from "./db";
import { ConfigType, type Message, MessageDir, MessageRole, type Config, type Profile, type Ticket } from "@prisma/client";
import type { MProfile } from "../../customTypes";




export async function submitMessage(
    config:Config,
    profile: MProfile,
    role: MessageRole,
    messageDir: MessageDir,
    content: string | null | undefined = undefined,
    extra_json: any | undefined | null = undefined,
    image_urls: string[] = []
): Promise<boolean> {

    if (messageDir === MessageDir.INBOUND && content && content.length >= config.message_char_limit) {
        const newContent = `Sorry, but your message exceeds ${config.message_char_limit} characters`
        // first save user message the send new message save and return false
        await createMessage(
            config,
            profile,
            role,
            messageDir,
            content,
            extra_json,
            image_urls
        )
        await sendMessage(profile.fb_messenger_id, newContent)
        await createMessage(
            config,
            profile,
            role,
            messageDir,
            newContent,
            extra_json
        )
        return false
    }


    if (messageDir === MessageDir.OUTBOUND && content && role !== MessageRole.TOOL) {
        await sendMessage(profile.fb_messenger_id, content.substring(0, config.message_char_limit), image_urls)
    }

    await createMessage(
        config,
        profile,
        role,
        messageDir,
        content?.substring(0, config.message_char_limit),
        extra_json,
        image_urls
    )

    return true
}



export async function submitTicket(
    config:Config,
    profile: MProfile,
    content: string): Promise<Ticket> {

    const pageLink = `https://www.facebook.com/profile.php?id=${profile.fb_messenger_id}`
    const newContent = "--- Ticket: \n" + content + `\n page link:${pageLink}`

    await sendSMS(ADMIN_NUMBER, newContent)

    return await createTicket(config, profile, newContent)
}







async function sendMessage(sendTo: string, text: string, image_urls: string[] = []): Promise<void> {


    try {
        const message = await client.messages.create({
            from: `messenger:${twilioPageId}`,
            body: text,
            to: sendTo,
            mediaUrl: image_urls
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

