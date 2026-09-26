import { useMasterData } from '../context';
import type { MasterDataListKey } from '../types';

/** The admin-defined label of a list value, as plain text. */
export function MasterLabel({ list, code }: { list: MasterDataListKey; code: string }) {
  return <>{useMasterData().label(list, code)}</>;
}
