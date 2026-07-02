import { SetMetadata } from '@nestjs/common';
import { EnterpriseRoleName } from '../entities/role.entity';

export const ENTERPRISE_ROLES_KEY = 'enterprise_roles';
export const Roles = (...roles: EnterpriseRoleName[]) => SetMetadata(ENTERPRISE_ROLES_KEY, roles);
