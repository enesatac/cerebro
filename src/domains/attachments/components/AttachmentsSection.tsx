import { SectionCard } from '@/components/layout/SectionCard';
import { REQUIRED_DOCUMENTS } from '../types';
import { AttachmentsPanel, type AttachmentsPanelProps } from './AttachmentsPanel';

/** The attachments panel as a page section. */
export function AttachmentsSection({
  title = 'Belgeler ve ekler',
  description,
  ...props
}: AttachmentsPanelProps & { title?: string; description?: string }) {
  const hasRequired = (REQUIRED_DOCUMENTS[props.owner.type] ?? []).length > 0;
  return (
    <SectionCard
      title={title}
      description={
        description ??
        (hasRequired
          ? 'Gerekli belgeler ve referans dokümanlar: mimari, analiz, test raporları, sözleşmeler…'
          : 'Referans dokümanlar, raporlar ve kanıtlar.')
      }
    >
      <AttachmentsPanel {...props} />
    </SectionCard>
  );
}
