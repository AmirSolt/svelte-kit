import type { Handle, HandleServerError } from '@sveltejs/kit'
import { getConfig } from '$lib/server/services/db'
import { submitMessage } from '$lib/server/services/communications'
import { getProfile } from '$lib/server/services/db'
import { MessageDir, MessageRole } from '@prisma/client'

export const handle: Handle = async ({ event, resolve }) => {

    const config = await getConfig()

    if(config==null){
        throw new Error('Config could not be found')
    }else{
        event.locals.config = config
    }

    return resolve(event, {
        filterSerializedResponseHeaders(name) {
          return name === 'content-range'
        },
      })
}

// export const handleError: HandleServerError = async ({ error, event }) => {
// 	console.log("hooks.server.ts:handleError -> ",event.url, error)

//     const text = await event.request.text();
//     const params = Object.fromEntries(new URLSearchParams(text));
//     const { Body, From } = params

//     let profile = await getProfile(From)
//     if (profile == null) {
//         console.log("hooks.server.ts: Could not find profile within error handling")
//         return {message:"hooks.server.ts: Could not find profile within error handling"}
//     }

//     await submitMessage(
//         profile,
//         MessageRole.ASSISTANT,
//         MessageDir.OUTBOUND,
//         `Error: Server encountered an error. If the error is severe, please use the keyword "report ..." to notify the developer.`,
//     );
//     return {message:"Sent Error message to sender"}
// }

