import type { Handle, HandleServerError } from '@sveltejs/kit'
import { getConfig } from '$lib/server/services/db'


export const handle: Handle = async ({ event, resolve }) => {


    const config = await getConfig()

    if(config==null){
        throw new Error('Config could not be found')
    }else{
        event.locals.config = config
    }

	return await resolve(event)
}

export const handleError: HandleServerError = ({ error, event }) => {
	console.log(event.url, error)

    // send message
}

