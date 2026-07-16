import { DataSource } from "typeorm";
import { config } from "dotenv";

config(); // .env ni o'qish uchun

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: ["src/entity/**/*.entity.ts"], // .ts fayllarga to'g'ridan-to'g'ri yo'l
    migrations: ["src/migrations/**/*.ts"],
    synchronize: false,
    logging: true,
});