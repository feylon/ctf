import { AppDataSource } from "./data-source";
import { Role, User } from "./entity/user.entity";
import { TournamentSettings } from "./entity/tournament-settings.entity";
import * as bcrypt from "bcrypt";

async function seed() {
    // 1. Bazaga ulanish
    await AppDataSource.initialize();
    console.log("Database connected for seeding...");

    const userRepo = AppDataSource.getRepository(User);
    const settingsRepo = AppDataSource.getRepository(TournamentSettings);

    const username = process.env.ADMIN_USERNAME || 'admin01';
    const email = process.env.ADMIN_EMAIL || 'admin@ctf.uz';
    const password = process.env.ADMIN_PASSWORD || 'admin01';

    // 2. Adminni tekshirish
    const adminExists = await userRepo.exists({ where: { username } });

    if (!adminExists) {
        const admin = userRepo.create({
            username,
            fullName: 'Administrator',
            passwordHash: await bcrypt.hash(password, 10),
            email,
            role: Role.ADMIN,
            isActive: true,
            isDelete: false,
        });

        await userRepo.save(admin);
        console.log(`✅ Admin yaratildi: ${username}`);
    } else {
        console.log("ℹ️ Admin allaqachon mavjud.");
    }

    // 3. Musobaqa sozlamalari bitta yozuv sifatida saqlanadi
    if ((await settingsRepo.count()) === 0) {
        await settingsRepo.save(settingsRepo.create({ isLive: true }));
        console.log("✅ Musobaqa sozlamalari yaratildi");
    }

    // 4. Aloqani uzish
    await AppDataSource.destroy();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed xatolik:", err);
    process.exit(1);
});
