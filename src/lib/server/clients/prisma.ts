import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config()


if(process.env.DATABASE_URL == null){
    throw new Error('missing DATABASE_URL');
}

const dburl:string = process.env.DATABASE_PRIVATE_URL || process.env.DATABASE_URL;

console.log("dburl",dburl)

export const prisma = new PrismaClient({datasourceUrl:dburl})


// npx prisma migrate dev --name init