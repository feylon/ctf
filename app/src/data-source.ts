import { DataSource } from "typeorm";
import { config } from "dotenv";
import { join } from "path";

config();

// Ham ts-node (src/*.ts), ham build qilingan (dist/*.js) holatda ishlaydi
export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [join(__dirname, "entity", "**", "*.entity.{ts,js}")],
    migrations: [join(__dirname, "migrations", "**", "*.{ts,js}")],
    synchronize: false,
    logging: process.env.DB_LOGGING === "true",
});
