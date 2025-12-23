/**
 * Employee Service
 * Business logic layer for employee operations
 */

import { Employee, EmployeeRole } from '@prisma/client';
import { EmployeeRepository, EmployeeDTO } from '../repositories/EmployeeRepository';

export interface LoginRequest {
  pinCode: string;
  employeeCode?: string;
}

export interface LoginResponse {
  success: boolean;
  employee?: EmployeeDTO;
  message?: string;
}

export class EmployeeService {
  constructor(private employeeRepository: EmployeeRepository) {}

  /**
   * Authenticate employee with PIN code
   * Optionally validate employee code for dual-factor authentication
   */
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { pinCode, employeeCode } = request;

    // Validate input
    if (!pinCode || pinCode.trim().length === 0) {
      return {
        success: false,
        message: 'PIN code is required',
      };
    }

    let employee: Employee | null;

    // If employee code provided, use dual-factor authentication
    if (employeeCode && employeeCode.trim().length > 0) {
      employee = await this.employeeRepository.findByCodeAndPin(
        employeeCode.trim(),
        pinCode.trim()
      );

      if (!employee) {
        return {
          success: false,
          message: 'Invalid employee code or PIN',
        };
      }
    } else {
      // Single-factor authentication (PIN only)
      employee = await this.employeeRepository.findByPin(pinCode.trim());

      if (!employee) {
        return {
          success: false,
          message: 'Invalid PIN code',
        };
      }
    }

    // Check if employee is active
    if (!employee.isActive) {
      return {
        success: false,
        message: 'Employee account is inactive',
      };
    }

    // Check if employee is not deleted (soft delete)
    if (employee.deletedAt) {
      return {
        success: false,
        message: 'Employee account is no longer available',
      };
    }

    // Successful login
    return {
      success: true,
      employee: this.employeeRepository.toDTO(employee),
      message: 'Login successful',
    };
  }

  /**
   * Get all active employees
   */
  async getAllEmployees(): Promise<EmployeeDTO[]> {
    const employees = await this.employeeRepository.findAllActive();
    return this.employeeRepository.toDTOs(employees);
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: bigint): Promise<EmployeeDTO | null> {
    const employee = await this.employeeRepository.findById(id);

    if (!employee) {
      return null;
    }

    return this.employeeRepository.toDTO(employee);
  }

  /**
   * Get employee by code
   */
  async getEmployeeByCode(employeeCode: string): Promise<EmployeeDTO | null> {
    const employee = await this.employeeRepository.findByCode(employeeCode);

    if (!employee) {
      return null;
    }

    return this.employeeRepository.toDTO(employee);
  }

  /**
   * Get employees by role
   */
  async getEmployeesByRole(role: EmployeeRole): Promise<EmployeeDTO[]> {
    const employees = await this.employeeRepository.findByRole(role);
    return this.employeeRepository.toDTOs(employees);
  }

  /**
   * Get active waiters for order assignment
   */
  async getActiveWaiters(): Promise<EmployeeDTO[]> {
    return this.getEmployeesByRole('waiter');
  }

  /**
   * Get active cashiers
   */
  async getActiveCashiers(): Promise<EmployeeDTO[]> {
    return this.getEmployeesByRole('cashier');
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<{
    total: number;
    byRole: Record<EmployeeRole, number>;
  }> {
    const total = await this.employeeRepository.countActive();

    const roles: EmployeeRole[] = [
      'admin',
      'manager',
      'cashier',
      'waiter',
      'cook',
      'bartender',
    ];

    const byRole = {} as Record<EmployeeRole, number>;

    for (const role of roles) {
      byRole[role] = await this.employeeRepository.countByRole(role);
    }

    return {
      total,
      byRole,
    };
  }

  /**
   * Validate if employee has permission for a role-based action
   */
  hasRole(employee: EmployeeDTO, allowedRoles: EmployeeRole[]): boolean {
    return allowedRoles.includes(employee.role);
  }

  /**
   * Check if employee is admin or manager
   */
  isAdminOrManager(employee: EmployeeDTO): boolean {
    return this.hasRole(employee, ['admin', 'manager']);
  }

  /**
   * Check if employee can manage cash register
   */
  canManageCash(employee: EmployeeDTO): boolean {
    return this.hasRole(employee, ['admin', 'manager', 'cashier']);
  }

  /**
   * Check if employee can take orders
   */
  canTakeOrders(employee: EmployeeDTO): boolean {
    return this.hasRole(employee, ['admin', 'manager', 'waiter']);
  }
}
