import { Router } from 'express';
import { asyncErrorHandler } from '../../common/middleware/error-handler.middleware';
import { toJson } from '../../common/utils/serialization';
import { parseBigIntField } from './pos.utils';
import { ResourceNotFoundError } from '../../common/errors/typed-errors';
import { EmployeeService } from './services/EmployeeService';
import { EmployeeRepository } from './repositories/EmployeeRepository';

export function createEmployeesRouter(): Router {
  const router = Router();

  // Initialize repository and service
  const employeeRepository = new EmployeeRepository();
  const employeeService = new EmployeeService(employeeRepository);

  /**
   * POST /api/pos/employees/login
   * Authenticate employee with PIN code
   */
  router.post(
    '/login',
    asyncErrorHandler(async (req, res) => {
      const { pinCode, employeeCode } = req.body;

      // Validate required field
      if (!pinCode) {
        return res.status(400).json({
          success: false,
          message: 'PIN code is required',
        });
      }

      // Attempt login
      const result = await employeeService.login({
        pinCode: String(pinCode),
        employeeCode: employeeCode ? String(employeeCode) : undefined,
      });

      if (!result.success) {
        return res.status(401).json({
          success: false,
          message: result.message,
        });
      }

      // Successful login
      res.json(
        toJson({
          success: true,
          message: result.message,
          employee: result.employee,
        })
      );
    })
  );

  /**
   * GET /api/pos/employees
   * Get all active employees
   */
  router.get(
    '/',
    asyncErrorHandler(async (req, res) => {
      const { role } = req.query;

      let employees;

      if (role && typeof role === 'string') {
        // Filter by role
        employees = await employeeService.getEmployeesByRole(role as any);
      } else {
        // Get all active employees
        employees = await employeeService.getAllEmployees();
      }

      res.json(toJson({ data: employees }));
    })
  );

  /**
   * GET /api/pos/employees/stats
   * Get employee statistics
   */
  router.get(
    '/stats',
    asyncErrorHandler(async (req, res) => {
      const stats = await employeeService.getEmployeeStats();
      res.json(toJson(stats));
    })
  );

  /**
   * GET /api/pos/employees/waiters
   * Get active waiters for order assignment
   */
  router.get(
    '/waiters',
    asyncErrorHandler(async (req, res) => {
      const waiters = await employeeService.getActiveWaiters();
      res.json(toJson({ data: waiters }));
    })
  );

  /**
   * GET /api/pos/employees/cashiers
   * Get active cashiers
   */
  router.get(
    '/cashiers',
    asyncErrorHandler(async (req, res) => {
      const cashiers = await employeeService.getActiveCashiers();
      res.json(toJson({ data: cashiers }));
    })
  );

  /**
   * GET /api/pos/employees/:id
   * Get employee by ID
   */
  router.get(
    '/:id',
    asyncErrorHandler(async (req, res) => {
      const employeeId = parseBigIntField(req.params.id, 'employeeId');

      const employee = await employeeService.getEmployeeById(employeeId);

      if (!employee) {
        throw new ResourceNotFoundError('employee', String(employeeId));
      }

      res.json(toJson(employee));
    })
  );

  /**
   * GET /api/pos/employees/code/:code
   * Get employee by employee code
   */
  router.get(
    '/code/:code',
    asyncErrorHandler(async (req, res) => {
      const { code } = req.params;

      const employee = await employeeService.getEmployeeByCode(code);

      if (!employee) {
        throw new ResourceNotFoundError('employee', code);
      }

      res.json(toJson(employee));
    })
  );

  return router;
}
