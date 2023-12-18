import { prisma } from "../clients/prisma";
import { ConfigType, type Message, MessageDir, MessageRole, type Config, type Profile, type Search } from "@prisma/client";
import { redis } from "../clients/redis";
import type { MProfile } from "../../customTypes";

// expire redis records after x
const defaultRedisExpiration = 60*60

// fetch message history with profile
const lastMessagesLoadedin = 10


export async function updateProfileCountry(profile:MProfile, countryCode:string){
    await prisma.profile.update({
        where:{id:profile.id},
        data:{
            country_code:countryCode
        }
    })
    profile.country_code = countryCode
    redis.set(profile.fb_messenger_id, JSON.stringify(profile), "EX", defaultRedisExpiration)
    return profile
}


export async function getSearch(searchId: string) {

    let search:Search|null|undefined
    
    const res = await redis.get(searchId)
    
    if (res==null) {
        search = await prisma.search.findFirst({
            where: {
                id: searchId
            },
        })
        if(search){
            redis.set(search.id, JSON.stringify(search), "EX", defaultRedisExpiration)
        }

    } else {
        search = JSON.parse(res)
    }

    return search
}



export async function createSearch(
    profile:MProfile,
    search_term:string,
    asins:string[],
    search_url:string,
    search_results:any
){
    const search = await prisma.search.create({
        data:{
            profile_id:profile.id,
            search_term:search_term,
            asins:asins,
            search_url,
            search_results:search_results
        },
    })

    redis.set(search.id, JSON.stringify(search), "EX", defaultRedisExpiration)
    return search
}


export async function createTicket(
    profile: MProfile,
    content: string 
    ){

    const ticket = await prisma.ticket.create({
        data:{
            profile_id:profile.id,
            content,
        }
    }) 

    return ticket
}



export async function createMessage(
    profile: MProfile,
    role:MessageRole,
    messageDir:MessageDir,
    content: string | null | undefined = undefined,
    extra_json:any|undefined|null,
    image_urls:string[]=[]
    ){

    const message = await prisma.message.create({
        data:{
            profile_id:profile.id,
            message_dir:messageDir,
            content,
            role,
            extra_json,
            image_urls
        }
    }) 

    profile.messages.push(message)
    profile._count.messages++

    redis.set(profile.fb_messenger_id, JSON.stringify(profile), "EX", defaultRedisExpiration)

    return profile
}


export async function createProfile(fbMessengerId: string){
    const profile = await prisma.profile.create({
        data:{
            fb_messenger_id:fbMessengerId
        },
        include: {
            messages: {
                take: -lastMessagesLoadedin,
                orderBy: {
                    created_at: 'asc',
                },
            },
            _count: {
                select: { messages: true },
            },
        }
    })

    redis.set(fbMessengerId, JSON.stringify(profile), "EX", defaultRedisExpiration)

    return profile
}


export async function getProfile(fbMessengerId: string) {

    let profile:MProfile | null | undefined

    const res = await redis.get(fbMessengerId)
    
    if (res==null) {
        const profileValue = await prisma.profile.findFirst({
            where: {
                fb_messenger_id: fbMessengerId
            },
            include: {
                messages: {
                    take: -lastMessagesLoadedin,
                    orderBy: {
                        created_at: 'desc',
                    },
                },
                _count: {
                    select: { messages: true },
                },
            }
        })
        if(profileValue){
            redis.set(fbMessengerId, JSON.stringify(profileValue), "EX", defaultRedisExpiration)
            profile = profileValue
        }
    } else {
        profile = JSON.parse(res)
    }

    return profile
}



export async function getConfig() {

    let config:Config|null|undefined

    // Fetch and cache 'Config', and save to locals
    const res = await redis.get(ConfigType.FREE)

    if (res==null) {
        const configValue = await prisma.config.findFirst({ where: { id: ConfigType.FREE } })
        if(configValue){
            redis.set(ConfigType.FREE, JSON.stringify(configValue))
            config = configValue
        }
    } else {
        config = JSON.parse(res)
    }

    return config
}