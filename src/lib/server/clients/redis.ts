import Redis from 'ioredis';
import * as dotenv from 'dotenv'
dotenv.config()



if(process.env.REDIS_URL == null){
    throw new Error('missing REDIS_URL');
}

setTimeout(function(){
    console.log("Executed after 1 second");
}, 1000);

export const redis = new Redis(process.env.REDIS_URL);

