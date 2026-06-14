/**
 * RequireRole — route guard component.
 * If the current employee doesn't have the required role, redirect to /create.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import type { Employee } from '@mass-laundry/shared-types';

interface RequireRoleProps {
  employee: Employee;
  role: Employee['role'] | 'any';
  children: React.ReactNode;
  redirectTo?: string;
}

export function RequireRole({
  employee,
  role,
  children,
  redirectTo = '/create',
}: RequireRoleProps) {
  if (role !== 'any' && employee.role !== role) {
    return <Navigate to={redirectTo} replace />;
  }
  return <>{children}</>;
}
