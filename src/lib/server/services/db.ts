import { prisma } from "../clients/prisma";
import { ConfigType, type Message, MessageDir, MessageRole, type Config, type Profile, type Search } from "@prisma/client";
import { redis } from "../clients/redis";
import type { MProfile } from "../../customTypes";

// expire redis records after x
const defaultRedisExpiration = 60*10




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
    config:Config,
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
    config:Config,
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
    config:Config,
    profile: MProfile,
    role:MessageRole,
    messageDir:MessageDir,
    content: string | null | undefined = undefined,
    extra_json:any|undefined|null=undefined,
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


export async function createProfile(config:Config, fbMessengerId: string):Promise<MProfile>{
    const profile = await prisma.profile.create({
        data:{
            fb_messenger_id:fbMessengerId
        }
    })
    const mPorfile = {
        ...profile,
        messages:[],
        _count:{messages:0}
    } as MProfile

    redis.set(fbMessengerId, JSON.stringify(mPorfile), "EX", defaultRedisExpiration)

    return mPorfile
}


export async function getProfile(config:Config,fbMessengerId: string) {

    let profile:MProfile | null | undefined

    const res = await redis.get(fbMessengerId)
    
    if (res==null) {
        const profileValue = await prisma.profile.findFirst({
            where: {
                fb_messenger_id: fbMessengerId
            },
            include: {
                messages: {
                    take: config.load_message_to_client_count,
                    orderBy: {
                        created_at: 'asc',
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

    return await prisma.config.findFirst({ where: { id: ConfigType.FREE } })


    // let config:Config|null|undefined

    // // Fetch and cache 'Config', and save to locals
    // const res = await redis.get(ConfigType.FREE)

    // if (res==null) {
    //     const configValue = await prisma.config.findFirst({ where: { id: ConfigType.FREE } })
    //     if(configValue){
    //         redis.set(ConfigType.FREE, JSON.stringify(configValue))
    //         config = configValue
    //     }
    // } else {
    //     config = JSON.parse(res)
    // }

    // return config
}


export async function createConfig():Promise<Config>{
    return await prisma.config.create({
        data:{
            id:ConfigType.FREE
        }
    })
}