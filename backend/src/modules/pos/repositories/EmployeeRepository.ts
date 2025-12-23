/**
 * Employee Repository
 * Database access layer for Employee entity using Prisma
 */

import { prisma } from '../../../config/database';
import { Employee, EmployeeRole } from '@prisma/client';

export interface EmployeeDTO {
  id: bigint;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: EmployeeRole;
  isActive: boolean;
  hiredAt: Date | null;
}

export interface LoginCredentials {
  employeeCode?: string;
  pinCode: string;
}

export class EmployeeRepository {
  /**
   * Find employee by PIN code for login
   * Returns active employee if PIN matches
   */
  async findByPin(pinCode: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: {
        pinCode,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Find employee by code and PIN (dual factor)
   */
  async findByCodeAndPin(employeeCode: string, pinCode: string): Promise<Employee | null> {
    return prisma.employee.findFirst({
      where: {
        employeeCode,
        pinCode,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Find employee by ID
   */
  async findById(id: bigint): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { id },
    });
  }

  /**
   * Find employee by employee code
   */
  async findByCode(employeeCode: string): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { employeeCode },
    });
  }

  /**
   * Find all active employees
   */
  async findAllActive(): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' },
      ],
    });
  }

  /**
   * Find employees by role
   */
  async findByRole(role: EmployeeRole): Promise<Employee[]> {
    return prisma.employee.findMany({
      where: {
        role,
        isActive: true,
        deletedAt: null,
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  /**
   * Get employee count by role
   */
  async countByRole(role: EmployeeRole): Promise<number> {
    return prisma.employee.count({
      where: {
        role,
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Get all active employees count
   */
  async countActive(): Promise<number> {
    return prisma.employee.count({
      where: {
        isActive: true,
        deletedAt: null,
      },
    });
  }

  /**
   * Transform Employee entity to DTO (without sensitive data)
   */
  toDTO(employee: Employee): EmployeeDTO {
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone,
      role: employee.role,
      isActive: employee.isActive,
      hiredAt: employee.hiredAt,
    };
  }

  /**
   * Transform multiple employees to DTOs
   */
  toDTOs(employees: Employee[]): EmployeeDTO[] {
    return employees.map(emp => this.toDTO(emp));
  }
}
