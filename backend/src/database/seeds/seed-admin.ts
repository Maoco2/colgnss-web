import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { User, UserRole, Gender } from '../../modules/users/user.entity';
import { StationsService } from '../../modules/stations/stations.service';
import { StationType } from '../../modules/stations/station.entity';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../../../');

async function seedAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepo = app.get('UserRepository');
  const stationsService = app.get(StationsService);

  const existing = await userRepo.findOne({ where: { email: 'concivtop@gmail.com' } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('Sarasofia1-', 10);
    const admin = userRepo.create({
      email: 'concivtop@gmail.com',
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
    console.log('Admin user created: concivtop@gmail.com / Sarasoofia1-');
  } else {
    console.log('Admin user already exists');
  }

  const user2Repo = app.get('UserRepository');
  const existing2 = await user2Repo.findOne({ where: { email: 'coralj203@gmail.com' } });
  if (!existing2) {
    const hashedPassword = await bcrypt.hash('Sarasofia1-', 10);
    const user = user2Repo.create({
      email: 'coralj203@gmail.com',
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
    await user2Repo.save(user);
    console.log('User created: coralj203@gmail.com');
  } else {
    console.log('User coralj203@gmail.com already exists');
  }

  const geoJsonPath = path.join(PROJECT_ROOT, 'Red_ActivaGNSS_202511.geojson');
  if (fs.existsSync(geoJsonPath)) {
    console.log('Seeding active stations...');
    const data = JSON.parse(fs.readFileSync(geoJsonPath, 'utf-8'));
    let imported = 0;
    for (const feature of data.features) {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;
      try {
        await stationsService.create({
          code: props.MRTNomencl || 'UNKNOWN',
          name: props.MDANMNombr || 'Unknown',
          type: StationType.ACTIVE,
          department: props.DeNombre || 'Unknown',
          municipality: props.MDANMNombr || 'Unknown',
          latitude: coords[1],
          longitude: coords[0],
          height: parseFloat(String(props.AlturaElip || '0').replace(',', '.')),
          receiverType: props.RedGeoAc_RedNacional_MRTMaterial || null,
          observations: props.Nota_Aclaratoria || undefined,
        });
        imported++;
      } catch (e) {
        console.error(`Failed ${props.MRTNomencl}: ${e.message}`);
      }
    }
    console.log(`Imported ${imported} active stations`);
  } else {
    console.log('GeoJSON not found, skipping active stations');
  }

  await app.close();
}

seedAdmin().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
