import type { ArrayPath, FieldPath, FieldValues } from 'react-hook-form';

/**
 * Reusable field groups (roles, documentation…) are generic over the form type, which
 * TypeScript cannot relate to dynamic paths like `roles.3.personId`. These helpers confine that
 * one unavoidable cast; each group documents the shape it expects under its path.
 */
export const fieldPath = <T extends FieldValues>(path: string) => path as FieldPath<T>;
export const arrayPath = <T extends FieldValues>(path: string) => path as ArrayPath<T>;
