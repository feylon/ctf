import { AppDataSource } from "./data-source";
import { User } from "./entity/user.entity";
import { Role } from "global/types";
import * as bcrypt from "bcrypt";

async function seed() {
    // 1. Bazaga ulanish
    await AppDataSource.initialize();
    console.log("Database connected for seeding...");

    const userRepo = AppDataSource.getRepository(User);

    // 2. Adminni tekshirish
    const adminExists = await userRepo.findOne({ where: { username: 'admin01' } });

    if (!adminExists) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin01', salt);

        const admin = userRepo.create({
            username: 'admin01',
            passwordHash: hashedPassword,
            email: 'admin@ctf.uz',
            role: Role.ADMIN,
            isActive: true,
            isDelete: false,
        });

        await userRepo.save(admin);
        console.log("✅ Admin yaratildi: admin01");
    } else {
        console.log("ℹ️ Admin allaqachon mavjud.");
    }

    // 3. Aloqani uzish
    await AppDataSource.destroy();
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed xatolik:", err);
    process.exit(1);
});