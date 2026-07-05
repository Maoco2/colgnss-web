import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { User, UserRole, Gender } from '../../modules/users/user.entity';
import * as bcrypt from 'bcryptjs';

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get('UserRepository');

  const adminEmail = 'concivtop@gmail.com';
  const existing = await userRepo.findOne({ where: { email: adminEmail } });

  if (!existing) {
    const hashedPassword = await bcrypt.hash('Sarasofia1-', 10);
    const admin = userRepo.create({
      email: adminEmail,
      password: hashedPassword,
      fullName: 'Mauricio Orozco',
      surname: 'Orozco',
      phone: '3168831185',
      profession: 'Topografo',
      gender: Gender.MALE,
      role: UserRole.ADMIN,
      isActive: true,
      isVerified: true,
    });
    await userRepo.save(admin);
    console.log(`Admin user created: ${adminEmail}`);
  } else if (existing.role !== UserRole.ADMIN) {
    existing.role = UserRole.ADMIN;
    await userRepo.save(existing);
    console.log(`User ${adminEmail} promoted to ADMIN`);
  } else {
    console.log(`User ${adminEmail} is already ADMIN`);
  }

  const user2Email = 'coralj203@gmail.com';
  const existing2 = await userRepo.findOne({ where: { email: user2Email } });
  if (!existing2) {
    const hashedPassword = await bcrypt.hash('Sarasofia1-', 10);
    const user = userRepo.create({
      email: user2Email,
      password: hashedPassword,
      fullName: 'Coral Morales',
      surname: 'Morales',
      phone: '3218817019',
      profession: 'Topografo',
      gender: Gender.FEMALE,
      role: UserRole.USER,
      isActive: true,
      isVerified: true,
    });
    await userRepo.save(user);
    console.log(`User created: ${user2Email}`);
  } else {
    console.log(`User ${user2Email} already exists`);
  }

  await app.close();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
