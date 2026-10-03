import type { DeletionImpact, EntityId, WriteRepository } from '@/domains/shared/types';
import type {
  Contract,
  ContractId,
  ContractInput,
  ContractQuery,
  Vendor,
  VendorInput,
} from '../types';

/**
 * Contracts and purchases. Reading needs `contracts:view`, changes `contracts:edit`, deleting
 * `contracts:delete` — commercial terms are not open to every user.
 */
export interface ContractRepository extends WriteRepository<Contract, ContractInput> {
  /** Contracts, optionally of one project or vendor, ordered by start date (newest first). */
  list(query?: ContractQuery): Promise<Contract[]>;
  /** @throws NotFoundError */
  getById(id: ContractId): Promise<Contract>;
}

/** Suppliers; vendors with contracts cannot be deleted. */
export interface VendorRepository {
  list(): Promise<Vendor[]>;
  create(input: VendorInput): Promise<Vendor>;
  update(id: EntityId, input: VendorInput): Promise<Vendor>;
  remove(id: EntityId): Promise<void>;
  getDeletionImpact(id: EntityId): Promise<DeletionImpact>;
}
