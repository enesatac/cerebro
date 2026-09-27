import type { Draft } from '@/domains/shared/types';
import type { MasterDataItem, MasterDataList, MasterDataListKey, MasterDataUsage } from '../types';

export interface MasterDataRepository {
  /** Every administrable list with its items in display order. */
  listAll(): Promise<MasterDataList[]>;
  /** How many records use each code of `key` (drives "in use" hints and delete protection). */
  getUsage(key: MasterDataListKey): Promise<MasterDataUsage>;
  /**
   * Replaces the items of one list (order included). Requires `masterData:manage`.
   * @throws ValidationError when a system value is missing or deactivated, a code or label is
   *   duplicated, or a removed value is still used by records.
   */
  update(key: MasterDataListKey, items: Draft<MasterDataItem>[]): Promise<MasterDataList>;
}
