import { type Config, type Message, MessageDir, MessageRole, type Profile } from "@prisma/client";
import { openai } from "../clients/openai";
import type { OpenAI } from "openai";
import { toolsFunc, toolsObjects } from "./tools";
import type { MProfile } from "../../customTypes";
import { submitMessage } from "./communications";





export async function callCompletion(config: Config, profile: MProfile): Promise<void> {

    const systemMessage: OpenAI.ChatCompletionMessageParam = {
        content: config.categorizer_system_message,
        role: "system"
    }

    const chatMessages = profile.messages.filter(m => m.role != MessageRole.NON_AI).map(m => {
        if (m.role == MessageRole.TOOL) {
            const extrajson = m.extra_json as any
            return {
                role: m.role.toLowerCase(),
                content: m.content ?? "",
                tool_call_id: extrajson?.tool_call_id
            } as OpenAI.ChatCompletionToolMessageParam
        }

        if (m.role == MessageRole.ASSISTANT && m.extra_json) {
            return {
                role: m.role.toLowerCase(),
                content: m.content ?? "",
                tool_calls: m.extra_json as unknown,
            } as OpenAI.ChatCompletionAssistantMessageParam
        }

        return {
            role: m.role.toLowerCase(),
            content: m.content ?? "",
        } as OpenAI.ChatCompletionMessageParam
    })

    chatMessages.unshift(systemMessage)

    console.log(chatMessages)


    const chatCompletion = await openai.chat.completions.create({
        messages: chatMessages,
        model: 'gpt-4-1106-preview',
        stream: false,
        temperature: config.categorizer_temperature,
        tool_choice: "auto",
        tools: toolsObjects
    });

    const responseMessage = chatCompletion.choices[0].message

    await submitMessage(
        config,
        profile,
        MessageRole.ASSISTANT,
        MessageDir.OUTBOUND,
        responseMessage.content,
        responseMessage.tool_calls,
    );




    console.log("--- assistance message sent")

    if (responseMessage.tool_calls) {

        // * running tool messages first because OPENAI devs are dumb as bricks
        await Promise.allSettled(
            responseMessage.tool_calls.map(toolCall => (async () => {

                await submitMessage(
                    config,
                    profile,
                    MessageRole.TOOL,
                    MessageDir.OUTBOUND,
                    "Data delivered",
                    {tool_call_id:toolCall.id},
                );
            })())
        );



        await Promise.allSettled(
            responseMessage.tool_calls.map(toolCall => (async () => {

                try {
                    const functionName = toolCall.function.name;
                    const functionToCall = toolsFunc[functionName];
                    const functionArgs = JSON.parse(toolCall.function.arguments);
                    await functionToCall(config, profile, functionArgs);
                } catch (error) {
                    await submitMessage(
                        config,
                        profile,
                        MessageRole.ASSISTANT,
                        MessageDir.OUTBOUND,
                        `Error: Server encountered an error. If the error is severe, you can notify the developer like so "report ...".`,
                    );
                }
            })())
        );
    }
}
