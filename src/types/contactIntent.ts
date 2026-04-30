export type ContactNeedType =
  | 'modular'
  | 'bespoke'
  | 'clientinfra'
  | 'automation'
  | 'consulting'
  | 'other';

export type ContactIntent = {
  origin: string;
  needType?: ContactNeedType;
  productId?: string;
  productTitle?: string;
};
